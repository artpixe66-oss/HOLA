import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  city: string;
  date: string;
  url: string;
  source: 'francetravail' | 'indeed' | 'other';
  description: string;
  isAlternance: boolean;
  linkedinSearchUrl: string;
  generatorUrl: string;
}

function buildLinkedinUrl(company: string): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}&location=France`;
}

function buildGeneratorUrl(company: string, city: string): string {
  return `/generator?company=${encodeURIComponent(company)}&city=${encodeURIComponent(city)}&type=commercant`;
}

function isAlternanceTitle(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  return text.includes('alternance') || text.includes('apprentissage') || text.includes('alternant');
}

function buildExternalLinks(keyword: string, city: string) {
  const q = encodeURIComponent(keyword);
  const loc = city ? encodeURIComponent(city + ', France') : 'France';
  return {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`,
    indeed: `https://fr.indeed.com/jobs?q=${q}&l=${encodeURIComponent(city || 'France')}`,
    apec: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${q}`,
    hellowork: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${q}&l=${encodeURIComponent(city || '')}`,
    francetravail: `https://candidat.francetravail.fr/offres/recherche?motsCles=${q}&lieuTravail=${encodeURIComponent(city || '')}`,
  };
}

// ── France Travail scraping via their public search page (no auth) ──────────────
// Uses the non-authenticated public search API
async function searchFranceTravail(keyword: string, city: string): Promise<JobOpportunity[]> {
  // France Travail public API (no auth required for basic search)
  const params = new URLSearchParams({ motsCles: keyword, typeContrat: '' });
  if (city) params.set('lieuTravail', city);

  // Try their public JSON API endpoint
  const url = `https://candidat.francetravail.fr/offres/recherche/results?${params}&page=1&tri=1&nbParPage=50`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://candidat.francetravail.fr/offres/recherche',
      'X-Requested-With': 'XMLHttpRequest',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) throw new Error(`France Travail ${resp.status}`);

  const data = await resp.json() as {
    resultats?: {
      id?: string;
      intitule?: string;
      entreprise?: { nom?: string };
      lieuTravail?: { libelle?: string };
      dateCreation?: string;
      origineOffre?: { urlOrigine?: string };
      description?: string;
      typeContratLibelle?: string;
    }[];
  };

  const resultats = data.resultats || [];
  if (!resultats.length) throw new Error('Aucun résultat');

  return resultats.map((o, i) => {
    const title = o.intitule || '';
    const company = o.entreprise?.nom || 'Entreprise confidentielle';
    const jobCity = o.lieuTravail?.libelle || city || '';
    const date = o.dateCreation ? o.dateCreation.split('T')[0] : '';
    const url2 = o.origineOffre?.urlOrigine ||
      `https://candidat.francetravail.fr/offres/recherche/detail/${o.id || i}`;
    const description = (o.description || '').slice(0, 300);

    return {
      id: `ft-${o.id || i}`,
      title,
      company,
      city: jobCity,
      date,
      url: url2,
      source: 'francetravail' as const,
      description,
      isAlternance: isAlternanceTitle(title, o.typeContratLibelle || ''),
      linkedinSearchUrl: buildLinkedinUrl(company),
      generatorUrl: buildGeneratorUrl(company, jobCity),
    };
  });
}

// ── Fallback: APEC (French jobs, no auth) ──────────────────────────────────────
async function searchAPEC(keyword: string, city: string): Promise<JobOpportunity[]> {
  const params = new URLSearchParams({
    motsCles: keyword,
    nbParPage: '50',
    debut: '0',
    tempsPartiel: 'false',
  });

  const resp = await fetch(
    `https://www.apec.fr/cms/webservices/rechercheOffre/result?${params}`,
    {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://www.apec.fr/',
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!resp.ok) throw new Error(`APEC ${resp.status}`);
  const data = await resp.json() as {
    resultats?: {
      numOffre?: string;
      intitule?: string;
      nomEntreprise?: string;
      lieuDeTravail?: string;
      datePublication?: string;
      description?: string;
      typeContrat?: string;
    }[];
  };

  return (data.resultats || [])
    .filter(o => {
      if (!city) return true;
      return (o.lieuDeTravail || '').toLowerCase().includes(city.toLowerCase());
    })
    .slice(0, 30)
    .map((o, i) => {
      const title = o.intitule || '';
      const company = o.nomEntreprise || 'Entreprise confidentielle';
      const jobCity = o.lieuDeTravail || city || 'France';
      const date = o.datePublication || '';
      const url2 = `https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/${o.numOffre || i}`;
      const description = (o.description || '').replace(/<[^>]+>/g, '').slice(0, 300);
      return {
        id: `apec-${o.numOffre || i}`,
        title,
        company,
        city: jobCity,
        date,
        url: url2,
        source: 'other' as const,
        description,
        isAlternance: isAlternanceTitle(title, o.typeContrat || ''),
        linkedinSearchUrl: buildLinkedinUrl(company),
        generatorUrl: buildGeneratorUrl(company, jobCity),
      };
    });
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'Community Manager';
  const city = searchParams.get('city') || '';
  const radius = searchParams.get('radius') || '50';
  const links = buildExternalLinks(keyword, city);

  // Try France Travail first, then Arbeitnow
  let jobs: JobOpportunity[] = [];
  let lastError = '';

  try {
    jobs = await searchFranceTravail(keyword, city);
  } catch (e1) {
    lastError = e1 instanceof Error ? e1.message : String(e1);
    try {
      jobs = await searchAPEC(keyword, city);
      lastError = '';
    } catch (e2) {
      lastError = e2 instanceof Error ? e2.message : String(e2);
    }
  }

  if (jobs.length === 0) {
    return NextResponse.json({
      jobs: [],
      blocked: true,
      message: `Aucune offre trouvée automatiquement (${lastError}). Utilisez les liens de recherche ci-dessous.`,
      externalLinks: links,
    });
  }

  return NextResponse.json({ jobs, blocked: false, externalLinks: links, count: jobs.length });
}

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

// ── France Travail official OAuth API ─────────────────────────────────────────
async function getFranceTravailToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'api_offresdemploiv2 o2dsoffre',
  });

  const resp = await fetch(
    'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!resp.ok) throw new Error(`Auth France Travail ${resp.status}`);
  const data = await resp.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Token manquant');
  return data.access_token;
}

async function searchFranceTravailAPI(
  keyword: string,
  city: string,
  clientId: string,
  clientSecret: string
): Promise<JobOpportunity[]> {
  const token = await getFranceTravailToken(clientId, clientSecret);

  const params = new URLSearchParams({
    motsCles: keyword,
    range: '0-49',
    sort: '1',
  });
  if (city) params.set('commune', city);

  const resp = await fetch(
    `https://api.francetravail.fr/partenaire/offresdemploi/v2/offres/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!resp.ok) throw new Error(`France Travail API ${resp.status}`);

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

// ── Handler ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'Community Manager';
  const city = searchParams.get('city') || '';
  const clientId = searchParams.get('ftClientId') || '';
  const clientSecret = searchParams.get('ftClientSecret') || '';
  const links = buildExternalLinks(keyword, city);

  // Require France Travail credentials
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      jobs: [],
      blocked: true,
      needsCredentials: true,
      message: 'Clés API France Travail requises. Inscrivez-vous gratuitement sur francetravail.io',
      externalLinks: links,
    });
  }

  try {
    const jobs = await searchFranceTravailAPI(keyword, city, clientId, clientSecret);

    if (jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        blocked: false,
        message: `Aucune offre trouvée pour "${keyword}"${city ? ` à ${city}` : ''}.`,
        externalLinks: links,
      });
    }

    return NextResponse.json({ jobs, blocked: false, externalLinks: links, count: jobs.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      jobs: [],
      blocked: true,
      message: `Erreur API France Travail : ${msg}`,
      externalLinks: links,
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export interface BodaccAnnonce {
  id: string;
  company: string;
  activite: string;
  ville: string;
  codePostal: string;
  dateParution: string;
  formeJuridique: string;
  dirigeant: string;
  siren: string;
  papersUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extract(record: Record<string, any>): BodaccAnnonce {
  // listepersonnes is a JSON *string* containing { personne: { typePersonne, denomination, activite, formeJuridique, nom, prenom, ... } }
  // registre = [siren_clean, siren_formatted]
  // commercant = company name string (top-level shortcut)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let personne: Record<string, any> = {};
  try {
    if (typeof record.listepersonnes === 'string') {
      const parsed = JSON.parse(record.listepersonnes);
      personne = parsed.personne || parsed.personnes?.[0]?.personne || {};
    } else if (record.listepersonnes?.personne) {
      personne = record.listepersonnes.personne;
    }
  } catch { /* ignore parse errors */ }

  const siren = (Array.isArray(record.registre) ? record.registre[0] : record.registre || '')
    .toString().replace(/\s/g, '');

  const isPhysique = personne.typePersonne === 'pp';

  const company =
    typeof record.commercant === 'string' && record.commercant
      ? record.commercant
      : personne.denomination ||
        `${personne.prenom || ''} ${personne.nom || ''}`.trim() ||
        'Entreprise';

  const activite = personne.activite || record.activite || '';

  const forme = personne.formeJuridique || record.formejuridique || '';

  const dirigeant = isPhysique
    ? `${personne.prenom || ''} ${personne.nom || ''}`.trim()
    : personne.denomination || '';

  const adresse = personne.adresseSiegeSocial || {};

  return {
    id: record.id || record.numeroannonce || Math.random().toString(36).slice(2),
    company,
    activite,
    ville: record.ville || adresse.ville || '',
    codePostal: record.cp || adresse.codePostal || '',
    dateParution: record.dateparution ? record.dateparution.split('T')[0] : '',
    formeJuridique: forme,
    dirigeant,
    siren,
    papersUrl: siren ? `https://www.pappers.fr/entreprise/${siren}` : '',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dept = searchParams.get('dept') || '';
  const keyword = searchParams.get('keyword') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

  // BODACC ODSQL filter
  // Start with no type filter — discover what's available
  const filters: string[] = [];
  if (dept) {
    const d = dept.padStart(2, '0');
    filters.push(`numerodepartement = "${d}"`);
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    order_by: 'dateparution DESC',
  });
  if (filters.length) params.set('where', filters.join(' AND '));
  if (keyword) params.set('q', keyword);

  const url = `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?${params}`;

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`BODACC ${resp.status}: ${body.slice(0, 300)}`);
    }

    const data = await resp.json() as {
      results?: Record<string, unknown>[];
      total_count?: number;
    };

    const raw = data.results || [];

    const results = raw.map(r => extract(r as Record<string, unknown>));

    // Expose raw first record in a dedicated debug field so we can identify real field names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = raw[0] as any;
    const debugInfo = s ? {
      keys: Object.keys(s),
      commercant: s.commercant,
      registre: s.registre,
      listepersonnes: s.listepersonnes,
      listeetablissements: s.listeetablissements,
      depot: s.depot,
      acte: s.acte,
    } : null;

    return NextResponse.json({
      results,
      total: data.total_count || results.length,
      _debug: debugInfo,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}

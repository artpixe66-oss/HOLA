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
  // Real BODACC structure (annonces-commerciales):
  // - record.commercant = company name string
  // - record.registre = [siren_clean, siren_formatted, ...]
  // - record.listepersonnes = array of person/entity objects
  // - record.cp, record.ville = address at top level

  const siren = (Array.isArray(record.registre) ? record.registre[0] : record.registre || '')
    .toString().replace(/\s/g, '');

  // listepersonnes holds entities (person morale or physique)
  const personnes: Record<string, unknown>[] = Array.isArray(record.listepersonnes)
    ? record.listepersonnes
    : [];
  const p0 = personnes[0] || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pm = (p0 as any).personnemorale || (p0 as any).personne_morale || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pp = (p0 as any).personnephysique || (p0 as any).personne_physique || {};

  const company =
    typeof record.commercant === 'string' && record.commercant
      ? record.commercant
      : pm.denomination || pm.denominationsociale ||
        `${pp.prenom || ''} ${pp.nom || ''}`.trim() ||
        record.nomcommercial ||
        'Entreprise';

  const activite =
    pm.activite || pp.activite ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p0 as any).activite ||
    record.activite || '';

  const forme =
    pm.forme_juridique || pm.formejuridique ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p0 as any).forme_juridique ||
    record.formejuridique || '';

  const dirigeant =
    `${pp.prenom || ''} ${pp.nom || ''}`.trim() ||
    pm.denomination || '';

  return {
    id: record.id || record.numeroannonce || Math.random().toString(36).slice(2),
    company,
    activite,
    ville: record.ville || '',
    codePostal: record.cp || '',
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

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
  // BODACC annonces-commerciales: entity data is in `commercant` (morale) or
  // `personnes[0]` / `registre` depending on record type. Ville/cp may be top-level.
  const commercant = record.commercant || {};
  const personne = Array.isArray(record.personnes) ? (record.personnes[0] || {}) : {};
  const designation = personne.designation || personne.personne_morale || personne.personne_physique || {};
  const registreItem = Array.isArray(record.registre) ? (record.registre[0] || {}) : (record.registre || {});

  // Entity block: prefer commercant, then personnes[0] designation
  const entity = Object.keys(commercant).length ? commercant : designation;
  const adresse = entity.adresse || commercant.adresse || record.adresse || {};

  const company =
    record.nomcommercial ||
    entity.denomination ||
    entity.nom_commercial ||
    registreItem.denomination ||
    `${entity.prenom || ''} ${entity.nom || ''}`.trim() ||
    `${personne.prenom || ''} ${personne.nom || ''}`.trim() ||
    'Entreprise';

  const activite =
    entity.activite ||
    record.activite ||
    entity.categorieactivite ||
    record.categorieactivite ||
    '';

  const ville =
    adresse.ville ||
    adresse.localite ||
    record.ville ||
    '';

  const cp =
    adresse.codepostal ||
    adresse.code_postal ||
    record.codepostal ||
    record.cp ||
    '';

  const forme =
    entity.forme_juridique ||
    entity.formejuridique ||
    record.formejuridique ||
    personne.forme_juridique ||
    '';

  const dirigeant =
    `${entity.prenom || ''} ${entity.nom || ''}`.trim() ||
    `${personne.prenom || ''} ${personne.nom || ''}`.trim() ||
    entity.representant ||
    '';

  const siren =
    record.siren ||
    entity.siren ||
    registreItem.siren ||
    personne.siren ||
    '';

  return {
    id: record.id || record.numeroannonce || Math.random().toString(36).slice(2),
    company,
    activite,
    ville,
    codePostal: cp,
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

  // BODACC ODSQL filter
  // Start with no type filter — discover what's available
  const filters: string[] = [];
  if (dept) {
    const d = dept.padStart(2, '0');
    filters.push(`numerodepartement = "${d}"`);
  }

  const params = new URLSearchParams({
    limit: String(limit),
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

    const debugFields = raw.length > 0 ? Object.keys(raw[0]) : [];
    const debugSample = raw.length > 0 ? raw[0] : null;

    const results = raw.map(r => extract(r as Record<string, unknown>));

    return NextResponse.json({
      results,
      total: data.total_count || results.length,
      _debug: { fields: debugFields, sample: debugSample },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}

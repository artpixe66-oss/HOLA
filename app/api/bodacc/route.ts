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
  // BODACC nested structure varies — dig into known paths
  const depot = record.commercant || record.exploitant || record.personne_physique || record.personne_morale || {};
  const adresse = depot.adresse || record.adresse || {};

  const company =
    record.nomcommercial ||
    depot.denomination ||
    depot.nom_commercial ||
    `${depot.nom || ''} ${depot.prenom || ''}`.trim() ||
    'Entreprise';

  const activite =
    record.activite ||
    depot.activite ||
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
    '';

  const forme =
    depot.forme_juridique ||
    record.formejuridique ||
    depot.formejuridique ||
    '';

  const dirigeant =
    `${depot.prenom || ''} ${depot.nom || ''}`.trim() ||
    depot.representant ||
    '';

  const siren = record.siren || depot.siren || '';

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
  const filters: string[] = ['familleavis = "Immatriculation"'];
  if (dept) {
    const d = dept.padStart(2, '0');
    filters.push(`numerodepartement = "${d}"`);
  }
  if (keyword) {
    filters.push(`activite LIKE "%${keyword}%"`);
  }

  const params = new URLSearchParams({
    limit: String(limit),
    order_by: 'dateparution DESC',
    where: filters.join(' AND '),
  });

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

    const results = (data.results || []).map(r => extract(r as Record<string, unknown>));

    return NextResponse.json({ results, total: data.total_count || results.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}

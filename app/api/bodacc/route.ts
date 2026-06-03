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
  bodaccUrl: string;
  papersUrl: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dept = searchParams.get('dept') || '';
  const keyword = searchParams.get('keyword') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Build BODACC filter
  const filters: string[] = ['typeavis="I"']; // I = Immatriculation (new business)
  if (dept) filters.push(`codedepartement="${dept.padStart(2, '0')}"`);
  if (keyword) filters.push(`activite LIKE "%${keyword}%"`);

  const params = new URLSearchParams({
    limit: String(limit),
    order_by: 'dateparution DESC',
    where: filters.join(' AND '),
    select: 'id,dateparution,publicationavis,numeroannonce,registre,nomcommercial,ville,codepostal,activite,formejuridique,dirigeant,siren',
  });

  try {
    const resp = await fetch(
      `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?${params}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!resp.ok) throw new Error(`BODACC ${resp.status}`);

    const data = await resp.json() as {
      results?: {
        id?: string;
        dateparution?: string;
        nomcommercial?: string;
        ville?: string;
        codepostal?: string;
        activite?: string;
        formejuridique?: string;
        dirigeant?: string;
        siren?: string;
        registre?: string;
      }[];
      total_count?: number;
    };

    const results: BodaccAnnonce[] = (data.results || []).map(r => {
      const siren = r.siren || '';
      return {
        id: r.id || siren || Math.random().toString(36).slice(2),
        company: r.nomcommercial || 'Entreprise',
        activite: r.activite || '',
        ville: r.ville || '',
        codePostal: r.codepostal || '',
        dateParution: r.dateparution ? r.dateparution.split('T')[0] : '',
        formeJuridique: r.formejuridique || '',
        dirigeant: r.dirigeant || '',
        siren,
        bodaccUrl: siren
          ? `https://www.bodacc.fr/pages/annonces-commerciales/?q.id=registre:${encodeURIComponent(r.registre || '')}`
          : 'https://www.bodacc.fr/pages/annonces-commerciales/',
        papersUrl: siren
          ? `https://www.pappers.fr/entreprise/${siren}`
          : '',
      };
    });

    return NextResponse.json({ results, total: data.total_count || results.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}

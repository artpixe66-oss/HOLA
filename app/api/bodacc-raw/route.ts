import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const url = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?limit=3&order_by=dateparution%20DESC&where=numerodepartement%20%3D%20%2231%22';
  const resp = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  const data = await resp.json();
  const results = (data.results ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    commercant: r.commercant,
    registre: r.registre,
    listepersonnes: r.listepersonnes,
    listeetablissements: r.listeetablissements,
    depot: r.depot,
    acte: r.acte,
    divers: r.divers,
  }));
  return NextResponse.json(results);
}

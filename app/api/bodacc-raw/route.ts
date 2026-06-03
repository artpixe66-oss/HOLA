import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const url = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?limit=1&order_by=dateparution%20DESC&where=numerodepartement%20%3D%20%2231%22';
  const resp = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  const data = await resp.json();
  const first = data.results?.[0] ?? null;
  return NextResponse.json({ keys: first ? Object.keys(first) : [], raw: first }, { headers: { 'Content-Type': 'application/json' } });
}

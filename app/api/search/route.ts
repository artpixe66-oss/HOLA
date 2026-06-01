export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export interface SearchResult {
  id: string;
  name: string;
  company: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  qualificationScore: number;
  qualificationLabel: 'Très qualifié' | 'Qualifié' | 'Peu qualifié';
  type: 'producteur' | 'commercant';
}

const SMALL_BIZ_KEYWORDS = [
  'artisan', 'maraîcher', 'maraicher', 'vigneron', 'épicerie', 'epicerie',
  'boulanger', 'boucher', 'éleveur', 'eleveur', 'arboriculteur', 'apiculteur',
  'fleuriste', 'coiffeur', 'fromagerie', 'charcuterie', 'pâtissier', 'patissier',
];

// Map user keywords to OSM tags
const KEYWORD_TO_OSM: Record<string, { key: string; value: string }[]> = {
  boulanger: [{ key: 'shop', value: 'bakery' }],
  boucher: [{ key: 'shop', value: 'butcher' }],
  fleuriste: [{ key: 'shop', value: 'florist' }],
  coiffeur: [{ key: 'shop', value: 'hairdresser' }],
  épicerie: [{ key: 'shop', value: 'convenience' }, { key: 'shop', value: 'grocery' }],
  epicerie: [{ key: 'shop', value: 'convenience' }, { key: 'shop', value: 'grocery' }],
  restaurant: [{ key: 'amenity', value: 'restaurant' }],
  café: [{ key: 'amenity', value: 'cafe' }],
  cafe: [{ key: 'amenity', value: 'cafe' }],
  vigneron: [{ key: 'craft', value: 'winery' }, { key: 'shop', value: 'wine' }],
  fromagerie: [{ key: 'shop', value: 'cheese' }],
  pâtissier: [{ key: 'shop', value: 'pastry' }],
  patissier: [{ key: 'shop', value: 'pastry' }],
  pharmacie: [{ key: 'amenity', value: 'pharmacy' }],
  maraîcher: [{ key: 'shop', value: 'greengrocer' }],
  maraicher: [{ key: 'shop', value: 'greengrocer' }],
  apiculteur: [{ key: 'craft', value: 'beekeeper' }],
  charcuterie: [{ key: 'shop', value: 'deli' }],
  librairie: [{ key: 'shop', value: 'books' }],
  bar: [{ key: 'amenity', value: 'bar' }],
};

function getOsmTags(keyword: string): { key: string; value: string }[] {
  const lower = keyword.toLowerCase().trim();
  for (const [k, v] of Object.entries(KEYWORD_TO_OSM)) {
    if (lower.includes(k)) return v;
  }
  // Generic fallback: search by name
  return [];
}

function computeScore(hasWebsite: boolean, hasPhone: boolean, name: string): number {
  let score = 0;
  if (!hasWebsite) score += 4;
  if (!hasPhone) score += 2;
  const nameLower = name.toLowerCase();
  if (SMALL_BIZ_KEYWORDS.some(kw => nameLower.includes(kw))) score += 2;
  // Small businesses often have sparse OSM data — reward that
  score += 2;
  return Math.min(score, 10);
}

function scoreToLabel(score: number): 'Très qualifié' | 'Qualifié' | 'Peu qualifié' {
  if (score >= 8) return 'Très qualifié';
  if (score >= 5) return 'Qualifié';
  return 'Peu qualifié';
}

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildOverpassQuery(keyword: string, city: string): string {
  const osmTags = getOsmTags(keyword);
  const areaQuery = `area["name"="${city}"]["boundary"="administrative"]->.searchArea;`;

  if (osmTags.length > 0) {
    const nodeQueries = osmTags.map(t =>
      `node["${t.key}"="${t.value}"](area.searchArea);\nway["${t.key}"="${t.value}"](area.searchArea);`
    ).join('\n');
    return `[out:json][timeout:25];\n${areaQuery}\n(\n${nodeQueries}\n);\nout body center 50;`;
  }

  // Fallback: search by name containing keyword
  return `[out:json][timeout:25];\n${areaQuery}\n(\nnode["name"~"${keyword}",i](area.searchArea);\nway["name"~"${keyword}",i](area.searchArea);\n);\nout body center 50;`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const city = searchParams.get('city') || '';
  const type = (searchParams.get('type') || 'commercant') as 'producteur' | 'commercant';

  if (!keyword || !city) {
    return NextResponse.json({ error: 'keyword et city sont requis', results: [] }, { status: 400 });
  }

  const query = buildOverpassQuery(keyword, city);

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Erreur de l'API OpenStreetMap (${response.status}). Réessayez dans quelques instants.`,
        results: [],
      });
    }

    const data = await response.json() as { elements: OsmElement[] };
    const elements: OsmElement[] = data.elements || [];

    const results: SearchResult[] = elements
      .filter(el => el.tags?.name)
      .slice(0, 40)
      .map(el => {
        const tags = el.tags!;
        const name = tags.name || '';
        const phone = tags.phone || tags['contact:phone'] || '';
        const website = tags.website || tags['contact:website'] || null;
        const street = tags['addr:street'] || '';
        const housenumber = tags['addr:housenumber'] || '';
        const postcode = tags['addr:postcode'] || '';
        const addrCity = tags['addr:city'] || city;
        const address = [housenumber, street, postcode, addrCity].filter(Boolean).join(' ');

        const score = computeScore(!!website, !!phone, name);

        return {
          id: `osm-${el.type}-${el.id}`,
          name,
          company: name,
          category: keyword,
          address,
          city: addrCity || city,
          phone,
          website,
          rating: null,
          reviewCount: null,
          qualificationScore: score,
          qualificationLabel: scoreToLabel(score),
          type,
        };
      });

    if (results.length === 0) {
      return NextResponse.json({
        results: [],
        message: `Aucun résultat trouvé pour "${keyword}" à ${city}. Essayez un terme plus général (ex: boulanger, boucher, épicerie).`,
      });
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('timeout') || message.includes('abort');
    return NextResponse.json({
      error: isTimeout
        ? 'La requête a pris trop de temps. Réessayez dans quelques instants.'
        : `Erreur : ${message}`,
      results: [],
    });
  }
}

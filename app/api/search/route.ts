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
  type: 'producteur' | 'commercant' | 'artisan';
}

const SMALL_BIZ_KEYWORDS = [
  'artisan', 'maraîcher', 'maraicher', 'vigneron', 'épicerie', 'epicerie',
  'boulanger', 'boucher', 'éleveur', 'eleveur', 'arboriculteur', 'apiculteur',
  'fleuriste', 'coiffeur', 'fromagerie', 'charcuterie', 'pâtissier', 'patissier',
  'plombier', 'électricien', 'electricien', 'menuisier', 'maçon', 'macon',
  'peintre', 'charpentier', 'carreleur', 'serrurier', 'couvreur', 'chauffagiste',
];

function computeScore(hasWebsite: boolean, hasPhone: boolean, reviewCount: number | null, name: string): number {
  let score = 0;
  if (!hasWebsite) score += 4;
  if (reviewCount === null || reviewCount === 0) score += 3;
  else if (reviewCount < 10) score += 2;
  else if (reviewCount < 50) score += 1;
  if (!hasPhone) score += 1;
  const nameLower = name.toLowerCase();
  if (SMALL_BIZ_KEYWORDS.some(kw => nameLower.includes(kw))) score += 2;
  return Math.min(score, 10);
}

function scoreToLabel(score: number): 'Très qualifié' | 'Qualifié' | 'Peu qualifié' {
  if (score >= 7) return 'Très qualifié';
  if (score >= 4) return 'Qualifié';
  return 'Peu qualifié';
}

// ── Google Places ──────────────────────────────────────────────────────────────

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  addressComponents?: { longText: string; types: string[] }[];
}

async function searchGooglePlaces(
  keyword: string,
  city: string,
  type: 'producteur' | 'commercant' | 'artisan',
  apiKey: string
): Promise<SearchResult[]> {
  const query = `${keyword} à ${city} France`;

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.addressComponents',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'fr',
      regionCode: 'FR',
      maxResultCount: 20,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places API ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as { places?: GooglePlace[] };
  const places = data.places || [];

  return places.map(place => {
    const name = place.displayName?.text || '';
    const website = place.websiteUri || null;
    const phone = place.internationalPhoneNumber || '';
    const reviewCount = place.userRatingCount ?? null;
    const rating = place.rating ?? null;

    // Extract city from address components
    const cityComponent = place.addressComponents?.find(c =>
      c.types?.includes('locality') || c.types?.includes('postal_town')
    );
    const detectedCity = cityComponent?.longText || city;

    const score = computeScore(!!website, !!phone, reviewCount, name);

    return {
      id: `google-${place.id}`,
      name,
      company: name,
      category: keyword,
      address: place.formattedAddress || '',
      city: detectedCity,
      phone,
      website,
      rating,
      reviewCount,
      qualificationScore: score,
      qualificationLabel: scoreToLabel(score),
      type,
    } satisfies SearchResult;
  });
}

// ── OpenStreetMap fallback ─────────────────────────────────────────────────────

const KEYWORD_TO_OSM: Record<string, { key: string; value: string }[]> = {
  boulanger: [{ key: 'shop', value: 'bakery' }],
  boucher: [{ key: 'shop', value: 'butcher' }],
  fleuriste: [{ key: 'shop', value: 'florist' }],
  coiffeur: [{ key: 'shop', value: 'hairdresser' }],
  épicerie: [{ key: 'shop', value: 'convenience' }],
  epicerie: [{ key: 'shop', value: 'convenience' }],
  restaurant: [{ key: 'amenity', value: 'restaurant' }],
  café: [{ key: 'amenity', value: 'cafe' }],
  cafe: [{ key: 'amenity', value: 'cafe' }],
  vigneron: [{ key: 'craft', value: 'winery' }],
  fromagerie: [{ key: 'shop', value: 'cheese' }],
  pâtissier: [{ key: 'shop', value: 'pastry' }],
  patissier: [{ key: 'shop', value: 'pastry' }],
  maraîcher: [{ key: 'shop', value: 'greengrocer' }],
  maraicher: [{ key: 'shop', value: 'greengrocer' }],
  apiculteur: [{ key: 'craft', value: 'beekeeper' }],
  charcuterie: [{ key: 'shop', value: 'deli' }],
  librairie: [{ key: 'shop', value: 'books' }],
  bar: [{ key: 'amenity', value: 'bar' }],
  pharmacie: [{ key: 'amenity', value: 'pharmacy' }],
  plombier: [{ key: 'craft', value: 'plumber' }],
  électricien: [{ key: 'craft', value: 'electrician' }],
  electricien: [{ key: 'craft', value: 'electrician' }],
  menuisier: [{ key: 'craft', value: 'carpenter' }],
  charpentier: [{ key: 'craft', value: 'carpenter' }],
  maçon: [{ key: 'craft', value: 'mason' }],
  macon: [{ key: 'craft', value: 'mason' }],
  peintre: [{ key: 'craft', value: 'painter' }],
  carreleur: [{ key: 'craft', value: 'tiler' }],
  serrurier: [{ key: 'craft', value: 'locksmith' }],
  couvreur: [{ key: 'craft', value: 'roofer' }],
  chauffagiste: [{ key: 'craft', value: 'hvac' }],
};

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

async function searchOSM(
  keyword: string,
  city: string,
  type: 'producteur' | 'commercant' | 'artisan'
): Promise<SearchResult[]> {
  // Step 1: geocode city to bounding box via Nominatim
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}%2C+France&format=json&limit=1`;
  const geoResp = await fetch(nominatimUrl, {
    headers: { 'User-Agent': 'HelpMe-Prospection/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!geoResp.ok) throw new Error(`Nominatim ${geoResp.status}`);
  const geoData = await geoResp.json() as { boundingbox?: string[] }[];
  if (!geoData.length || !geoData[0].boundingbox) throw new Error('Ville introuvable');

  const [minlat, maxlat, minlon, maxlon] = geoData[0].boundingbox;
  const bbox = `${minlat},${minlon},${maxlat},${maxlon}`;

  // Step 2: Overpass query with bounding box
  const lower = keyword.toLowerCase();
  const osmTags = Object.entries(KEYWORD_TO_OSM).find(([k]) => lower.includes(k))?.[1];

  let nodeQueries: string;
  if (osmTags) {
    nodeQueries = osmTags.map(t =>
      `node["${t.key}"="${t.value}"](${bbox});\nway["${t.key}"="${t.value}"](${bbox});`
    ).join('\n');
  } else {
    nodeQueries = `node["name"~"${keyword}",i](${bbox});\nway["name"~"${keyword}",i](${bbox});`;
  }

  const query = `[out:json][timeout:25];\n(\n${nodeQueries}\n);\nout body center 40;`;

  const ovResp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(25000),
  });
  if (!ovResp.ok) throw new Error(`Overpass ${ovResp.status}`);

  const data = await ovResp.json() as { elements: OsmElement[] };

  return (data.elements || [])
    .filter(el => el.tags?.name)
    .slice(0, 30)
    .map(el => {
      const tags = el.tags!;
      const name = tags.name;
      const phone = tags.phone || tags['contact:phone'] || '';
      const website = tags.website || tags['contact:website'] || null;
      const housenumber = tags['addr:housenumber'] || '';
      const street = tags['addr:street'] || '';
      const postcode = tags['addr:postcode'] || '';
      const addrCity = tags['addr:city'] || city;
      const address = [housenumber, street, postcode, addrCity].filter(Boolean).join(' ');
      const score = computeScore(!!website, !!phone, null, name);

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        company: name,
        category: keyword,
        address,
        city: addrCity,
        phone,
        website,
        rating: null,
        reviewCount: null,
        qualificationScore: score,
        qualificationLabel: scoreToLabel(score),
        type,
      } satisfies SearchResult;
    });
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const city = searchParams.get('city') || '';
  const type = (searchParams.get('type') || 'commercant') as 'producteur' | 'commercant' | 'artisan';
  const googleApiKey = searchParams.get('googleApiKey') || '';

  if (!keyword || !city) {
    return NextResponse.json({ error: 'keyword et city sont requis', results: [] }, { status: 400 });
  }

  try {
    let results: SearchResult[];
    let source: string;

    if (googleApiKey) {
      results = await searchGooglePlaces(keyword, city, type, googleApiKey);
      source = 'google';
    } else {
      results = await searchOSM(keyword, city, type);
      source = 'osm';
    }

    if (results.length === 0) {
      return NextResponse.json({
        results: [],
        source,
        message: `Aucun résultat pour "${keyword}" à ${city}. Essayez un terme différent.`,
      });
    }

    return NextResponse.json({ results, source });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: message.includes('timeout') || message.includes('abort')
        ? 'La requête a pris trop de temps. Réessayez.'
        : `Erreur : ${message}`,
      results: [],
    });
  }
}

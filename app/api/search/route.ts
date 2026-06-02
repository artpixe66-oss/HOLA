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
  email: string | null;
  website: string | null;
  googleMapsUri: string | null;
  facebookSearchUrl: string | null;
  instagramSearchUrl: string | null;
  linkedinUrl: string | null;
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
  googleMapsUri?: string;
}

async function searchGooglePlaces(
  keyword: string,
  city: string,
  type: 'producteur' | 'commercant' | 'artisan',
  apiKey: string,
  radiusKm: number
): Promise<SearchResult[]> {
  const query = keyword ? `${keyword} ${city} France` : `commerce artisan ${city} France`;
  const { lat, lon } = await geocodeCity(city);

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'Referer': 'https://hola-murex.vercel.app',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.addressComponents,places.googleMapsUri',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'fr',
      regionCode: 'FR',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lon },
          radius: radiusKm * 1000,
        },
      },
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
    const googleMapsUri = place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (place.formattedAddress || city))}`;
    const fbQuery = encodeURIComponent(`${name} ${detectedCity}`);
    const igQuery = encodeURIComponent(name.toLowerCase().replace(/\s+/g, ''));

    return {
      id: `google-${place.id}`,
      name,
      company: name,
      category: keyword,
      address: place.formattedAddress || '',
      city: detectedCity,
      phone,
      email: null,
      website,
      googleMapsUri,
      facebookSearchUrl: `https://www.facebook.com/search/top?q=${fbQuery}`,
      instagramSearchUrl: `https://www.instagram.com/explore/search/keyword/?q=${igQuery}`,
      linkedinUrl: null,
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
  brasserie: [{ key: 'amenity', value: 'pub' }, { key: 'amenity', value: 'bar' }],
  pharmacie: [{ key: 'amenity', value: 'pharmacy' }],
  opticien: [{ key: 'shop', value: 'optician' }],
  bijouterie: [{ key: 'shop', value: 'jewelry' }],
  tabac: [{ key: 'shop', value: 'tobacco' }],
  pressing: [{ key: 'shop', value: 'dry_cleaning' }],
  poissonnier: [{ key: 'shop', value: 'seafood' }],
  primeur: [{ key: 'shop', value: 'greengrocer' }],
  caviste: [{ key: 'shop', value: 'wine' }],
  chocolatier: [{ key: 'shop', value: 'chocolate' }],
  glacier: [{ key: 'shop', value: 'ice_cream' }],
  traiteur: [{ key: 'shop', value: 'deli' }],
  barbier: [{ key: 'shop', value: 'barber' }],
  esthéticienne: [{ key: 'shop', value: 'beauty' }],
  fromager: [{ key: 'shop', value: 'cheese' }],
  brasseur: [{ key: 'craft', value: 'brewery' }],
  distillateur: [{ key: 'craft', value: 'distillery' }],
  horticulteur: [{ key: 'shop', value: 'garden_centre' }],
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
  vitrier: [{ key: 'craft', value: 'glazier' }],
  jardinier: [{ key: 'craft', value: 'gardener' }],
  cuisiniste: [{ key: 'craft', value: 'kitchen_unit_installer' }],
  photographe: [{ key: 'shop', value: 'photo' }],
  imprimeur: [{ key: 'craft', value: 'printer' }],
  cordonnier: [{ key: 'craft', value: 'shoemaker' }],
  tailleur: [{ key: 'craft', value: 'tailor' }],
  horloger: [{ key: 'craft', value: 'watchmaker' }],
  ébéniste: [{ key: 'craft', value: 'cabinet_maker' }],
  forgeron: [{ key: 'craft', value: 'blacksmith' }],
  tapissier: [{ key: 'craft', value: 'upholsterer' }],
  tatoueur: [{ key: 'shop', value: 'tattoo' }],
  // Loisirs
  'laser game': [{ key: 'leisure', value: 'amusement_arcade' }],
  lasergame: [{ key: 'leisure', value: 'amusement_arcade' }],
  padel: [{ key: 'sport', value: 'padel' }, { key: 'leisure', value: 'sports_centre' }],
  'salle de sport': [{ key: 'leisure', value: 'fitness_centre' }],
  'escape game': [{ key: 'leisure', value: 'escape_game' }],
  bowling: [{ key: 'leisure', value: 'bowling_alley' }],
  karting: [{ key: 'leisure', value: 'track' }],
  trampoline: [{ key: 'leisure', value: 'sports_centre' }],
  'parc enfants': [{ key: 'leisure', value: 'playground' }],
  'jeux enfants': [{ key: 'leisure', value: 'playground' }],
  piscine: [{ key: 'leisure', value: 'swimming_pool' }],
  tennis: [{ key: 'sport', value: 'tennis' }],
  golf: [{ key: 'leisure', value: 'golf_course' }],
  équitation: [{ key: 'sport', value: 'equestrian' }],
  yoga: [{ key: 'leisure', value: 'fitness_centre' }],
  danse: [{ key: 'leisure', value: 'dance' }],
  cinéma: [{ key: 'amenity', value: 'cinema' }],
  cinema: [{ key: 'amenity', value: 'cinema' }],
  théâtre: [{ key: 'amenity', value: 'theatre' }],
  theatre: [{ key: 'amenity', value: 'theatre' }],
  musée: [{ key: 'tourism', value: 'museum' }],
  zoo: [{ key: 'tourism', value: 'zoo' }],
  aquarium: [{ key: 'tourism', value: 'aquarium' }],
  // Divers
  hôtel: [{ key: 'tourism', value: 'hotel' }],
  hotel: [{ key: 'tourism', value: 'hotel' }],
  camping: [{ key: 'tourism', value: 'camp_site' }],
  gîte: [{ key: 'tourism', value: 'chalet' }],
  'chambre d\'hôtes': [{ key: 'tourism', value: 'guest_house' }],
  'agence immobilière': [{ key: 'office', value: 'estate_agent' }],
  'agence de voyage': [{ key: 'shop', value: 'travel_agency' }],
  école: [{ key: 'amenity', value: 'school' }],
  crèche: [{ key: 'amenity', value: 'childcare' }],
  'cabinet médical': [{ key: 'amenity', value: 'doctors' }],
  vétérinaire: [{ key: 'amenity', value: 'veterinary' }],
  'garage automobile': [{ key: 'shop', value: 'car_repair' }],
  'auto-école': [{ key: 'amenity', value: 'driving_school' }],
  spa: [{ key: 'leisure', value: 'spa' }],
  'institut de beauté': [{ key: 'shop', value: 'beauty' }],
  'salle de mariage': [{ key: 'amenity', value: 'events_venue' }],
  'studio photo': [{ key: 'shop', value: 'photo' }],
  déménageur: [{ key: 'shop', value: 'moving_supplies' }],
  'traiteur événementiel': [{ key: 'shop', value: 'deli' }],
};

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}%2C+France&format=json&limit=1`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'HelpMe-Prospection/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error(`Nominatim ${resp.status}`);
  const data = await resp.json() as { lat: string; lon: string }[];
  if (!data.length) throw new Error(`Ville introuvable : ${city}`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function searchOSM(
  keyword: string,
  city: string,
  type: 'producteur' | 'commercant' | 'artisan',
  radiusKm: number
): Promise<SearchResult[]> {
  const { lat, lon } = await geocodeCity(city);
  const radiusM = radiusKm * 1000;
  const around = `around:${radiusM},${lat},${lon}`;

  let nodeQueries: string;
  if (!keyword) {
    // No keyword: search all shops, crafts and amenities (restaurants, etc.)
    nodeQueries = [
      `node["shop"](${around});`,
      `way["shop"](${around});`,
      `node["craft"](${around});`,
      `way["craft"](${around});`,
      `node["amenity"~"restaurant|cafe|bar|pub|fast_food"](${around});`,
      `way["amenity"~"restaurant|cafe|bar|pub|fast_food"](${around});`,
    ].join('\n');
  } else {
    const lower = keyword.toLowerCase();
    const osmTags = Object.entries(KEYWORD_TO_OSM).find(([k]) => lower.includes(k))?.[1];
    if (osmTags) {
      nodeQueries = osmTags.map(t =>
        `node["${t.key}"="${t.value}"](${around});\nway["${t.key}"="${t.value}"](${around});`
      ).join('\n');
    } else {
      nodeQueries = `node["name"~"${keyword}",i](${around});\nway["name"~"${keyword}",i](${around});`;
    }
  }

  const query = `[out:json][timeout:30];\n(\n${nodeQueries}\n);\nout body center 50;`;

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
      const fbQuery = encodeURIComponent(`${name} ${addrCity}`);
      const igQuery = encodeURIComponent(name.toLowerCase().replace(/\s+/g, ''));

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        company: name,
        category: keyword,
        address,
        city: addrCity,
        phone,
        email: null,
        website,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + addrCity)}`,
        facebookSearchUrl: `https://www.facebook.com/search/top?q=${fbQuery}`,
        instagramSearchUrl: `https://www.instagram.com/explore/search/keyword/?q=${igQuery}`,
        linkedinUrl: null,
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
  const radiusKm = Math.min(Math.max(parseInt(searchParams.get('radius') || '10'), 1), 100);

  if (!city) {
    return NextResponse.json({ error: 'city est requis', results: [] }, { status: 400 });
  }

  try {
    let results: SearchResult[];
    let source: string;

    if (googleApiKey) {
      results = await searchGooglePlaces(keyword, city, type, googleApiKey, radiusKm);
      source = 'google';
    } else {
      results = await searchOSM(keyword, city, type, radiusKm);
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

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export interface AuditResult {
  found: boolean;
  googleRating: number | null;
  googleReviews: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  googleMapsUrl: string | null;
  placeId: string | null;
  signals: AuditSignal[];
  score: number; // 0-10, higher = more opportunity
}

export interface AuditSignal {
  label: string;
  status: 'good' | 'warn' | 'bad' | 'info';
  detail?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get('company') || '';
  const city = searchParams.get('city') || '';
  const website = searchParams.get('website') || '';
  const instagram = searchParams.get('instagram') || '';
  const facebook = searchParams.get('facebook') || '';

  if (!company) return NextResponse.json({ error: 'company required' }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  let rating: number | null = null;
  let reviews: number | null = null;
  let hasWebsite = !!website;
  let hasPhone = false;
  let mapsUrl: string | null = null;
  let placeId: string | null = null;
  let found = false;

  if (apiKey) {
    try {
      const query = city ? `${company} ${city} France` : `${company} France`;
      const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'Referer': 'https://hola-murex.vercel.app',
          'X-Goog-FieldMask': 'places.id,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber,places.googleMapsUri',
        },
        body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', maxResultCount: 1 }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = await resp.json() as { places?: { id: string; rating?: number; userRatingCount?: number; websiteUri?: string; internationalPhoneNumber?: string; googleMapsUri?: string }[] };
        const place = data.places?.[0];
        if (place) {
          found = true;
          placeId = place.id;
          rating = place.rating ?? null;
          reviews = place.userRatingCount ?? null;
          hasWebsite = !!(website || place.websiteUri);
          hasPhone = !!place.internationalPhoneNumber;
          mapsUrl = place.googleMapsUri || null;
        }
      }
    } catch { /* ignore */ }
  }

  const signals: AuditSignal[] = [];
  let score = 0;

  // Google Business
  if (!found) {
    signals.push({ label: 'Fiche Google', status: 'bad', detail: 'Non trouvée ou non revendiquée' });
    score += 3;
  } else if (reviews !== null && reviews < 5) {
    signals.push({ label: 'Fiche Google', status: 'warn', detail: `Peu d'avis (${reviews})` });
    score += 2;
  } else {
    signals.push({ label: 'Fiche Google', status: 'good', detail: reviews !== null ? `${reviews} avis` : 'Présente' });
  }

  // Rating
  if (found && rating !== null) {
    if (rating < 3.5) {
      signals.push({ label: 'Note Google', status: 'bad', detail: `${rating}/5 — amélioration possible` });
      score += 1;
    } else if (rating < 4.2) {
      signals.push({ label: 'Note Google', status: 'warn', detail: `${rating}/5` });
    } else {
      signals.push({ label: 'Note Google', status: 'good', detail: `${rating}/5` });
    }
  }

  // Website
  if (!hasWebsite) {
    signals.push({ label: 'Site web', status: 'bad', detail: 'Aucun site détecté' });
    score += 3;
  } else {
    signals.push({ label: 'Site web', status: 'good', detail: 'Site présent' });
  }

  // Instagram
  if (!instagram) {
    signals.push({ label: 'Instagram', status: 'warn', detail: 'Non renseigné' });
    score += 1;
  } else {
    signals.push({ label: 'Instagram', status: 'good', detail: 'Présent' });
  }

  // Facebook
  if (!facebook) {
    signals.push({ label: 'Facebook', status: 'warn', detail: 'Non renseigné' });
    score += 1;
  } else {
    signals.push({ label: 'Facebook', status: 'good', detail: 'Présent' });
  }

  // Phone
  if (!hasPhone) {
    signals.push({ label: 'Téléphone Google', status: 'warn', detail: 'Absent de la fiche' });
  } else {
    signals.push({ label: 'Téléphone Google', status: 'good', detail: 'Renseigné' });
  }

  return NextResponse.json({
    found,
    googleRating: rating,
    googleReviews: reviews,
    hasWebsite,
    hasPhone,
    googleMapsUrl: mapsUrl,
    placeId,
    signals,
    score: Math.min(score, 10),
  } satisfies AuditResult);
}

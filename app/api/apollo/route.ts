export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { SearchResult } from '@/app/api/search/route';

const COMMERCANT_ARTISAN_TITLES = ['gérant', 'propriétaire', 'dirigeant', 'fondateur', 'directeur'];
const PRODUCTEUR_TITLES = ['exploitant', 'agriculteur', 'producteur', 'gérant', 'propriétaire'];

function scoreToLabel(score: number): 'Très qualifié' | 'Qualifié' | 'Peu qualifié' {
  if (score >= 7) return 'Très qualifié';
  if (score >= 4) return 'Qualifié';
  return 'Peu qualifié';
}

function computeApolloScore(hasWebsite: boolean, hasEmail: boolean, hasPhone: boolean): number {
  let score = 0;
  if (!hasWebsite) score += 4;
  if (hasEmail) score -= 1; // already digitally active
  if (hasPhone) score += 1;
  return Math.max(0, Math.min(score, 10));
}

interface ApolloPhoneNumber {
  raw_number: string;
}

interface ApolloOrganization {
  name?: string;
  website_url?: string;
}

interface ApolloPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_numbers?: ApolloPhoneNumber[];
  linkedin_url?: string;
  title?: string;
  organization?: ApolloOrganization;
  city?: string;
  state?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const city = searchParams.get('city') || '';
  const type = (searchParams.get('type') || 'commercant') as 'producteur' | 'commercant' | 'artisan';
  const apolloKey = searchParams.get('apolloKey') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!city) {
    return NextResponse.json({ error: 'city est requis', results: [] }, { status: 400 });
  }
  if (!apolloKey) {
    return NextResponse.json({ error: 'apolloKey est requis', results: [] }, { status: 400 });
  }

  const personTitles = type === 'producteur' ? PRODUCTEUR_TITLES : COMMERCANT_ARTISAN_TITLES;

  const body: Record<string, unknown> = {
    person_titles: personTitles,
    organization_locations: [`${city}, France`],
    person_locations: ['France'],
    page,
    per_page: 25,
  };

  if (keyword) {
    body.q_organization_keyword_tags = [keyword];
  }

  try {
    const apolloRes = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      return NextResponse.json(
        { error: `Apollo API ${apolloRes.status}: ${errText.slice(0, 200)}`, results: [] },
        { status: apolloRes.status }
      );
    }

    const data = await apolloRes.json() as { people?: ApolloPerson[] };
    const people = data.people || [];

    const results: SearchResult[] = people.map((person) => {
      const name = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      const company = person.organization?.name || '';
      const website = person.organization?.website_url || null;
      const email = person.email || null;
      const phone = person.phone_numbers?.[0]?.raw_number || '';
      const linkedinUrl = person.linkedin_url || null;
      const personCity = person.city || city;

      const score = computeApolloScore(!!website, !!email, !!phone);
      const fbQuery = encodeURIComponent(`${company || name} ${personCity}`);
      const igQuery = encodeURIComponent((company || name).toLowerCase().replace(/\s+/g, ''));

      return {
        id: `apollo-${person.id}`,
        name,
        company,
        category: keyword || person.title || '',
        address: personCity,
        city: personCity,
        phone,
        email,
        website,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((company || name) + ' ' + personCity)}`,
        facebookSearchUrl: `https://www.facebook.com/search/top?q=${fbQuery}`,
        instagramSearchUrl: `https://www.instagram.com/explore/search/keyword/?q=${igQuery}`,
        linkedinUrl,
        rating: null,
        reviewCount: null,
        qualificationScore: score,
        qualificationLabel: scoreToLabel(score),
        type,
        distanceKm: null,
      } satisfies SearchResult;
    });

    if (results.length === 0) {
      return NextResponse.json({
        results: [],
        source: 'apollo',
        page,
        message: `Aucun résultat Apollo.io pour "${keyword}" à ${city}.`,
      });
    }

    return NextResponse.json({ results, source: 'apollo', page });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: message.includes('timeout') || message.includes('abort')
        ? 'La requête Apollo a pris trop de temps. Réessayez.'
        : `Erreur Apollo : ${message}`,
      results: [],
    });
  }
}

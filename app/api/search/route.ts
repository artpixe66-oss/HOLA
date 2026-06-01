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

function computeScore(hasWebsite: boolean, reviewCount: number | null, name: string): number {
  let score = 0;

  if (!hasWebsite) score += 4;

  if (reviewCount === null || reviewCount === 0) {
    score += 3;
  } else if (reviewCount < 5) {
    score += 3;
  } else if (reviewCount <= 20) {
    score += 2;
  } else if (reviewCount <= 50) {
    score += 1;
  }

  const nameLower = name.toLowerCase();
  if (SMALL_BIZ_KEYWORDS.some(kw => nameLower.includes(kw))) {
    score += 2;
  }

  return Math.min(score, 10);
}

function scoreToLabel(score: number): 'Très qualifié' | 'Qualifié' | 'Peu qualifié' {
  if (score >= 8) return 'Très qualifié';
  if (score >= 5) return 'Qualifié';
  return 'Peu qualifié';
}

function extractTextBetween(html: string, startPattern: string, endPattern: string): string | null {
  const startIdx = html.indexOf(startPattern);
  if (startIdx === -1) return null;
  const afterStart = html.slice(startIdx + startPattern.length);
  const endIdx = afterStart.indexOf(endPattern);
  if (endIdx === -1) return null;
  return afterStart.slice(0, endIdx).replace(/<[^>]+>/g, '').trim();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function parseListings(html: string, category: string, cityInput: string): SearchResult[] {
  const results: SearchResult[] = [];

  // PagesJaunes listing blocks — look for article/li elements with class patterns
  // Try to split by common listing container patterns
  const listingPatterns = [
    /(<article[^>]*class="[^"]*bi-generic[^"]*"[^>]*>[\s\S]*?<\/article>)/g,
    /(<li[^>]*class="[^"]*bi-item[^"]*"[^>]*>[\s\S]*?<\/li>)/g,
    /(<div[^>]*class="[^"]*bi-item[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*bi-item|$))/g,
    /(<div[^>]*class="[^"]*listingHit[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*listingHit|$))/g,
  ];

  let blocks: string[] = [];

  for (const pattern of listingPatterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 0) {
      blocks = matches.map(m => m[1]);
      break;
    }
  }

  // Fallback: split by denomination markers
  if (blocks.length === 0) {
    const denominationSplit = html.split(/class="[^"]*(?:bi-denomination|denomination-links)[^"]*"/);
    if (denominationSplit.length > 1) {
      blocks = denominationSplit.slice(1).map((chunk, i) => {
        // Take a reasonable chunk of HTML for each listing
        return denominationSplit[i] + 'class="denomination"' + chunk.slice(0, 2000);
      });
    }
  }

  if (blocks.length === 0) return [];

  for (const block of blocks.slice(0, 20)) {
    // Extract name
    let name = '';
    const namePatterns = [
      /class="[^"]*(?:bi-denomination|denomination-links)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
      /class="[^"]*(?:denomination)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
      /<a[^>]*class="[^"]*(?:denomination|name)[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
    ];
    for (const p of namePatterns) {
      const m = block.match(p);
      if (m) { name = stripTags(m[1]); break; }
    }
    if (!name) continue;

    // Extract address
    let address = '';
    const addrPatterns = [
      /class="[^"]*(?:bi-address|address-container|adresse)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|span|address)>/i,
    ];
    for (const p of addrPatterns) {
      const m = block.match(p);
      if (m) { address = stripTags(m[1]).replace(/\s+/g, ' '); break; }
    }

    // Extract phone
    let phone = '';
    const phonePatterns = [
      /class="[^"]*(?:bi-phone|phone|numero)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
      /(?:tel:|telephone:)[^"]*"([0-9 .+()-]{8,})/i,
      /data-(?:phone|tel)="([^"]+)"/i,
      /(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/,
    ];
    for (const p of phonePatterns) {
      const m = block.match(p);
      if (m) { phone = stripTags(m[1] || m[0]).replace(/\s+/g, ' ').trim(); break; }
    }

    // Extract website
    let website: string | null = null;
    const websitePatterns = [
      /href="(https?:\/\/(?!(?:www\.)?pagesjaunes)[^"]+)"[^>]*>[^<]*(?:site|web)/i,
      /class="[^"]*(?:site-web|website)[^"]*"[^>]*href="([^"]+)"/i,
      /href="([^"]+)"[^>]*class="[^"]*(?:site-web|website)[^"]*"/i,
    ];
    for (const p of websitePatterns) {
      const m = block.match(p);
      if (m) { website = m[1]; break; }
    }

    // Extract rating and reviews
    let rating: number | null = null;
    let reviewCount: number | null = null;
    const ratingPatterns = [
      /class="[^"]*(?:note|rating|avis)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/i,
      /data-note="([0-9.]+)"/i,
      /itemprop="ratingValue"[^>]*content="([0-9.]+)"/i,
    ];
    for (const p of ratingPatterns) {
      const m = block.match(p);
      if (m) {
        const val = parseFloat(m[1]);
        if (!isNaN(val) && val >= 0 && val <= 5) { rating = val; break; }
      }
    }
    const reviewPatterns = [
      /([0-9]+)\s*avis/i,
      /itemprop="reviewCount"[^>]*content="([0-9]+)"/i,
      /data-(?:nb-avis|review-count)="([0-9]+)"/i,
    ];
    for (const p of reviewPatterns) {
      const m = block.match(p);
      if (m) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val)) { reviewCount = val; break; }
      }
    }

    // Detect city from address or use input city
    const city = cityInput;

    const score = computeScore(!!website, reviewCount, name);
    const qualificationLabel = scoreToLabel(score);

    results.push({
      id: crypto.randomUUID(),
      name,
      company: name,
      category,
      address,
      city,
      phone,
      website,
      rating,
      reviewCount,
      qualificationScore: score,
      qualificationLabel,
      type: 'commercant',
    });
  }

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const city = searchParams.get('city') || '';

  if (!keyword || !city) {
    return NextResponse.json({ error: 'keyword and city are required', results: [] }, { status: 400 });
  }

  const url = `https://www.pagesjaunes.fr/pros/recherche?quoi=${encodeURIComponent(keyword)}&ou=${encodeURIComponent(city)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `PagesJaunes a retourné une erreur (${response.status}). Le site peut être temporairement inaccessible.`,
        results: [],
      });
    }

    const html = await response.text();
    const results = parseListings(html, keyword, city);

    if (results.length === 0) {
      // Check if blocked
      if (html.includes('captcha') || html.includes('robot') || html.includes('403')) {
        return NextResponse.json({
          error: 'PagesJaunes a bloqué la requête. Veuillez réessayer dans quelques instants.',
          results: [],
        });
      }
      return NextResponse.json({ results: [], message: 'Aucun résultat trouvé pour cette recherche.' });
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('timeout') || message.includes('abort');
    return NextResponse.json({
      error: isTimeout
        ? 'La requête a pris trop de temps. PagesJaunes est peut-être temporairement inaccessible.'
        : `Erreur lors de la récupération des données : ${message}`,
      results: [],
    });
  }
}

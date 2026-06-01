import { NextRequest, NextResponse } from 'next/server';

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  city: string;
  date: string;
  url: string;
  source: 'indeed' | 'francetravail' | 'other';
  description: string;
  isAlternance: boolean;
  linkedinSearchUrl: string;
  generatorUrl: string;
}

function buildLinkedinUrl(company: string): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}&location=France`;
}

function buildGeneratorUrl(company: string, city: string): string {
  return `/generator?company=${encodeURIComponent(company)}&city=${encodeURIComponent(city)}&type=commercant`;
}

function isAlternance(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  return text.includes('alternance') || text.includes('apprentissage') || text.includes('contrat pro') || text.includes('alternant');
}

function parseRSSDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {
    // ignore
  }
  return dateStr;
}

function extractText(xml: string, tag: string): string {
  // Use [\s\S] instead of . with s flag for compatibility
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (plainMatch) return plainMatch[1].replace(/<[^>]+>/g, '').trim();
  return '';
}

function parseRSSItems(xml: string): JobOpportunity[] {
  const items: JobOpportunity[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let idx = 0;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractText(itemXml, 'title');
    const company = extractText(itemXml, 'source') || extractText(itemXml, 'author') || 'Inconnu';
    const link = extractText(itemXml, 'link') || '';
    const pubDate = extractText(itemXml, 'pubDate');
    const description = extractText(itemXml, 'description').slice(0, 300);
    // location from category or description
    const location = extractText(itemXml, 'location') || '';

    if (!title) continue;

    items.push({
      id: `indeed-${idx++}`,
      title,
      company,
      city: location,
      date: parseRSSDate(pubDate),
      url: link,
      source: 'indeed',
      description,
      isAlternance: isAlternance(title, description),
      linkedinSearchUrl: buildLinkedinUrl(company),
      generatorUrl: buildGeneratorUrl(company, location),
    });
  }
  return items;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword') || 'Community Manager';
  const city = searchParams.get('city') || '';
  const radius = searchParams.get('radius') || '50';

  const rssUrl = `https://fr.indeed.com/rss?q=${encodeURIComponent(keyword)}${city ? `&l=${encodeURIComponent(city)}` : ''}&radius=${radius}&sort=date`;

  // External search links (always included)
  const externalLinks = {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}${city ? `&location=${encodeURIComponent(city + ', France')}` : '&location=France'}`,
    indeed: `https://fr.indeed.com/jobs?q=${encodeURIComponent(keyword)}${city ? `&l=${encodeURIComponent(city)}` : ''}`,
    apec: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keyword)}${city ? `&lieuTravail=${encodeURIComponent(city)}` : ''}`,
    hellowork: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(keyword)}${city ? `&l=${encodeURIComponent(city)}` : ''}`,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HelpMeCRM/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok || (!contentType.includes('xml') && !text.trim().startsWith('<'))) {
      return NextResponse.json({
        jobs: [],
        blocked: true,
        message: 'Indeed RSS non disponible. Utilisez les liens de recherche externes.',
        externalLinks,
      });
    }

    const jobs = parseRSSItems(text);

    return NextResponse.json({
      jobs,
      blocked: false,
      message: null,
      externalLinks,
      count: jobs.length,
    });
  } catch (err) {
    return NextResponse.json({
      jobs: [],
      blocked: true,
      message: `Impossible de récupérer les offres : ${err instanceof Error ? err.message : 'Erreur réseau'}`,
      externalLinks,
    });
  }
}

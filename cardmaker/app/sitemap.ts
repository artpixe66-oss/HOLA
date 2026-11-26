import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { NICHES } from "@/lib/niches";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/creer`, priority: 0.9 },
    ...NICHES.map((n) => ({ url: `${SITE_URL}/generateur/${n.slug}`, priority: 0.8 })),
  ];
}

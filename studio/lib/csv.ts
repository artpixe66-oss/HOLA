import type { PostMetrics } from "./types";

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : firstLine.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

type Field = keyof Pick<
  PostMetrics,
  "permalink" | "caption" | "publishedAt" | "views" | "reach" | "likes" | "comments" | "shares" | "saves" | "follows" | "avgWatchSec"
>;

// Intitulés des exports Meta Business Suite / Instagram, en anglais et en français.
const ALIASES: Record<Field, string[]> = {
  permalink: ["permalink", "lien permanent", "lien", "url", "link"],
  caption: ["description", "caption", "légende", "legende", "titre", "title"],
  publishedAt: ["publish time", "heure de publication", "date de publication", "date", "published"],
  views: ["views", "vues", "plays", "lectures", "impressions"],
  reach: ["reach", "couverture", "comptes touchés", "portée", "portee"],
  likes: ["likes", "j'aime", "mentions j'aime", "reactions", "réactions"],
  comments: ["comments", "commentaires"],
  shares: ["shares", "partages"],
  saves: ["saves", "enregistrements", "sauvegardes"],
  follows: ["follows", "abonnements", "nouveaux abonnés", "follows gained"],
  avgWatchSec: ["average watch time", "durée moyenne de visionnage", "temps de visionnage moyen", "avg watch time"],
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function detectColumns(header: string[]): Partial<Record<Field, number>> {
  const map: Partial<Record<Field, number>> = {};
  const h = header.map(norm);
  (Object.keys(ALIASES) as Field[]).forEach((field) => {
    // correspondance exacte d'abord, puis partielle
    let idx = h.findIndex((c) => ALIASES[field].includes(c));
    if (idx === -1) idx = h.findIndex((c) => ALIASES[field].some((a) => c.startsWith(a)));
    if (idx !== -1 && !Object.values(map).includes(idx)) map[field] = idx;
  });
  return map;
}

function toNumber(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.replace(/[\s ]/g, "").replace(",", ".");
  if (!t || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toDate(s: string | undefined): string | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  // 03/15/2026 14:05 (export US) ou 15/03/2026 14:05 (export FR)
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    // Meta exporte en mois/jour ; si le premier nombre dépasse 12, c'est jour/mois.
    const [month, day] = a > 12 ? [b, a] : [a, b];
    const d = new Date(Number(m[3]), month - 1, day, Number(m[4] ?? 12), Number(m[5] ?? 0));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function rowsToMetrics(rows: string[][], columns: Partial<Record<Field, number>>, id: () => string): PostMetrics[] {
  const importedAt = new Date().toISOString();
  return rows.map((r) => {
    const get = (f: Field) => (columns[f] != null ? r[columns[f] as number] : undefined);
    return {
      id: id(),
      permalink: (get("permalink") ?? "").trim(),
      caption: (get("caption") ?? "").trim(),
      publishedAt: toDate(get("publishedAt")),
      views: toNumber(get("views")),
      reach: toNumber(get("reach")),
      likes: toNumber(get("likes")),
      comments: toNumber(get("comments")),
      shares: toNumber(get("shares")),
      saves: toNumber(get("saves")),
      follows: toNumber(get("follows")),
      avgWatchSec: toNumber(get("avgWatchSec")),
      contentId: null,
      importedAt,
    };
  });
}

export const FIELD_LABELS: Record<Field, string> = {
  permalink: "Lien de la publication",
  caption: "Légende",
  publishedAt: "Date de publication",
  views: "Vues",
  reach: "Portée",
  likes: "J'aime",
  comments: "Commentaires",
  shares: "Partages",
  saves: "Enregistrements",
  follows: "Abonnements générés",
  avgWatchSec: "Durée moyenne de visionnage (s)",
};

export type { Field as MetricField };

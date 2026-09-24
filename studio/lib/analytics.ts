import type { Content, CreativeAttributes, PostMetrics, Store } from "./types";
import { ATTRIBUTE_LABELS } from "./types";

export interface PostRow {
  metrics: PostMetrics;
  content: Content | null;
  views: number;
  engagement: number;
  engagementRate: number | null; // interactions / portée
  saveRate: number | null;
  shareRate: number | null;
  followsPer1k: number | null;
  relViews: number | null; // vues / médiane du compte
}

export type Verdict = "solide" | "prometteur" | "neutre" | "a_eviter" | "faible_negatif" | "insuffisant";

export interface GroupStat {
  attribute: string;
  attributeLabel: string;
  value: string;
  n: number;
  medianRelViews: number | null;
  medianEngagement: number | null;
  aboveMedian: number;
  pValue: number | null;
  verdict: Verdict;
  postIds: string[];
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  solide: "Signal solide",
  prometteur: "Prometteur, à confirmer",
  neutre: "Dans la moyenne",
  a_eviter: "Sous-performe nettement",
  faible_negatif: "En dessous, à confirmer",
  insuffisant: "Pas assez de données",
};

export function median(xs: number[]): number | null {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

const n0 = (x: number | null) => x ?? 0;

function binomTail(k: number, n: number): number {
  // P(X >= k) pour X ~ B(n, 0.5)
  let p = 0;
  for (let i = k; i <= n; i++) p += choose(n, i);
  return p / 2 ** n;
}

function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export function normalizeUrl(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\?.*$/, "").replace(/\/+$/, "");
}

export function contentForMetrics(m: PostMetrics, contents: Content[]): Content | null {
  if (m.contentId) return contents.find((c) => c.id === m.contentId) ?? null;
  if (!m.permalink) return null;
  const key = normalizeUrl(m.permalink);
  return contents.find((c) => c.permalink && normalizeUrl(c.permalink) === key) ?? null;
}

export function buildRows(store: Store, influencerId?: string | null): PostRow[] {
  const base = store.metrics.map((m) => ({ m, c: contentForMetrics(m, store.contents) }));
  const filtered = influencerId ? base.filter((x) => x.c?.influencerId === influencerId) : base;
  const medViews = median(filtered.map((x) => n0(x.m.views)).filter((v) => v > 0));
  return filtered.map(({ m, c }) => {
    const engagement = n0(m.likes) + n0(m.comments) + n0(m.shares) + n0(m.saves);
    const denom = m.reach || m.views || 0;
    const views = n0(m.views);
    return {
      metrics: m,
      content: c,
      views,
      engagement,
      engagementRate: denom ? engagement / denom : null,
      saveRate: denom && m.saves != null ? m.saves / denom : null,
      shareRate: denom && m.shares != null ? m.shares / denom : null,
      followsPer1k: denom && m.follows != null ? (m.follows / denom) * 1000 : null,
      relViews: medViews && views ? views / medViews : null,
    };
  });
}

function durationBucket(s: number | null): string {
  if (s == null) return "";
  if (s <= 7) return "≤ 7 s";
  if (s <= 15) return "8–15 s";
  if (s <= 30) return "16–30 s";
  return "> 30 s";
}

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function slotOf(iso: string | null): { day: string; hour: string } {
  if (!iso) return { day: "", hour: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "", hour: "" };
  const h = d.getHours();
  const hour = h < 11 ? "matin (avant 11 h)" : h < 14 ? "midi (11–14 h)" : h < 18 ? "après-midi (14–18 h)" : "soir (après 18 h)";
  return { day: WEEKDAYS[d.getDay()], hour };
}

type Dimension = { key: string; label: string; get: (r: PostRow) => string };

export const DIMENSIONS: Dimension[] = [
  ...(["topic", "hookType", "outfit", "setting", "format", "editing"] as (keyof CreativeAttributes)[]).map((k) => ({
    key: k,
    label: ATTRIBUTE_LABELS[k],
    get: (r: PostRow) => String(r.content?.attributes[k] ?? "").trim(),
  })),
  { key: "duration", label: "Durée", get: (r) => durationBucket(r.content?.attributes.durationSec ?? null) },
  { key: "day", label: "Jour de publication", get: (r) => slotOf(r.metrics.publishedAt).day },
  { key: "hour", label: "Créneau horaire", get: (r) => slotOf(r.metrics.publishedAt).hour },
];

/**
 * Compare chaque valeur d'attribut à la médiane du compte.
 * Un groupe n'est « solide » que s'il bat la médiane assez souvent pour que
 * le hasard l'explique mal (test de signe) — sinon on parle de piste à confirmer.
 */
export function groupStats(rows: PostRow[]): GroupStat[] {
  const out: GroupStat[] = [];
  for (const dim of DIMENSIONS) {
    const groups = new Map<string, PostRow[]>();
    for (const r of rows) {
      const v = dim.get(r);
      if (!v || r.relViews == null) continue;
      const k = v.toLowerCase();
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    for (const [, g] of groups) {
      const n = g.length;
      const rel = g.map((r) => r.relViews as number);
      const medRel = median(rel);
      const above = rel.filter((x) => x > 1).length;
      const below = rel.filter((x) => x < 1).length;
      const pUp = n ? binomTail(above, n) : null;
      const pDown = n ? binomTail(below, n) : null;
      let verdict: Verdict = "neutre";
      let p: number | null = null;
      if (n < 2 || medRel == null) verdict = "insuffisant";
      else if (medRel >= 1.2) {
        p = pUp;
        verdict = n >= 4 && (pUp ?? 1) <= 0.11 ? "solide" : "prometteur";
      } else if (medRel <= 0.8) {
        p = pDown;
        verdict = n >= 4 && (pDown ?? 1) <= 0.11 ? "a_eviter" : "faible_negatif";
      }
      out.push({
        attribute: dim.key,
        attributeLabel: dim.label,
        value: dim.get(g[0]),
        n,
        medianRelViews: medRel,
        medianEngagement: median(g.map((r) => r.engagementRate ?? NaN)),
        aboveMedian: above,
        pValue: p,
        verdict,
        postIds: g.map((r) => r.metrics.id),
      });
    }
  }
  return out;
}

export interface Recommendation {
  kind: "reproduire" | "tester" | "eviter" | "creneau" | "donnees";
  title: string;
  detail: string;
}

export function recommendations(rows: PostRow[], stats: GroupStat[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const linked = rows.filter((r) => r.content).length;
  if (rows.length < 6) {
    recs.push({
      kind: "donnees",
      title: "Encore trop peu de publications",
      detail: `${rows.length} publication(s) importée(s). En dessous d'une dizaine, les écarts entre deux posts sont surtout du bruit : continue de publier et d'importer avant de tirer des règles.`,
    });
  }
  if (rows.length && linked < rows.length) {
    recs.push({
      kind: "donnees",
      title: `${rows.length - linked} publication(s) non reliée(s) à une création`,
      detail: "Relie-les dans Performances : sans lien, on ne sait pas quel sujet, accroche ou tenue elles utilisaient.",
    });
  }
  const creative = stats.filter((s) => s.attribute !== "day" && s.attribute !== "hour");
  const byStrength = (a: GroupStat, b: GroupStat) => (b.medianRelViews ?? 0) - (a.medianRelViews ?? 0);
  for (const s of creative.filter((s) => s.verdict === "solide").sort(byStrength).slice(0, 4)) {
    recs.push({
      kind: "reproduire",
      title: `Reproduire — ${s.attributeLabel.toLowerCase()} « ${s.value} »`,
      detail: `${fmtRel(s.medianRelViews)} des vues médianes sur ${s.n} posts, ${s.aboveMedian}/${s.n} au-dessus de la médiane du compte.`,
    });
  }
  for (const s of creative.filter((s) => s.verdict === "prometteur").sort(byStrength).slice(0, 4)) {
    recs.push({
      kind: "tester",
      title: `À confirmer — ${s.attributeLabel.toLowerCase()} « ${s.value} »`,
      detail: `${fmtRel(s.medianRelViews)} sur seulement ${s.n} post(s). Refais-en ${Math.max(2, 4 - s.n)} en ne changeant que cet élément pour vérifier que ce n'est pas un coup de chance.`,
    });
  }
  for (const s of creative.filter((s) => s.verdict === "a_eviter").slice(0, 3)) {
    recs.push({
      kind: "eviter",
      title: `Retravailler — ${s.attributeLabel.toLowerCase()} « ${s.value} »`,
      detail: `${fmtRel(s.medianRelViews)} des vues médianes sur ${s.n} posts. Change l'accroche ou le format avant d'abandonner le sujet.`,
    });
  }
  const slots = stats.filter((s) => (s.attribute === "day" || s.attribute === "hour") && s.n >= 2).sort(byStrength);
  if (slots.length >= 2) {
    const best = slots[0];
    const worst = slots[slots.length - 1];
    recs.push({
      kind: "creneau",
      title: `Créneau à comparer : ${best.value}`,
      detail: `${fmtRel(best.medianRelViews)} contre ${fmtRel(worst.medianRelViews)} pour « ${worst.value} ». Programme deux contenus similaires sur ces deux créneaux pour départager.`,
    });
  }
  return recs;
}

export function fmtRel(x: number | null): string {
  if (x == null) return "—";
  return `×${x.toFixed(x >= 10 ? 0 : 2).replace(".", ",")}`;
}

export function fmtPct(x: number | null, digits = 1): string {
  if (x == null) return "—";
  return `${(x * 100).toFixed(digits).replace(".", ",")} %`;
}

export function fmtNum(x: number | null): string {
  if (x == null) return "—";
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (x >= 10_000) return `${Math.round(x / 1000)} k`;
  return x.toLocaleString("fr-FR");
}

/** Résumé transmis à l'agent pour orienter les prochains scénarios. */
export function insightsForAgent(store: Store, influencerId: string | null): string {
  const rows = buildRows(store, influencerId);
  if (!rows.length) return "Aucune statistique importée pour l'instant : propose sans t'appuyer sur des performances passées.";
  const stats = groupStats(rows).filter((s) => s.verdict !== "neutre");
  const top = [...rows].sort((a, b) => b.views - a.views).slice(0, 3);
  const lines: string[] = [];
  lines.push(`Publications analysées : ${rows.length} (vues médianes ${fmtNum(median(rows.map((r) => r.views)))}).`);
  lines.push("Lecture des attributs (×1 = médiane du compte) :");
  for (const s of stats.sort((a, b) => (b.medianRelViews ?? 0) - (a.medianRelViews ?? 0)).slice(0, 14)) {
    lines.push(`- ${s.attributeLabel} « ${s.value} » : ${fmtRel(s.medianRelViews)}, n=${s.n}, ${VERDICT_LABEL[s.verdict]}`);
  }
  lines.push("Meilleures publications :");
  for (const r of top) {
    const a = r.content?.attributes;
    lines.push(
      `- ${fmtNum(r.views)} vues, enregistrements ${fmtPct(r.saveRate)} — ${r.content?.title ?? r.metrics.caption.slice(0, 60) ?? "sans titre"}${a?.hook ? ` — accroche : « ${a.hook} »` : ""}`,
    );
  }
  lines.push("Règle : ne traite comme acquis que les signaux solides ; le reste est une piste à tester.");
  return lines.join("\n");
}

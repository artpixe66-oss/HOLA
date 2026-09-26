import { contentForMetrics, lastImportAt } from "./analytics";
import { allTests } from "./hookTests";
import { editHref } from "./store";
import type { Content, Store } from "./types";

const DAY = 86_400_000;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Lundi 00 h de la semaine de d. */
export function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}

export interface NextAction {
  title: string;
  detail: string;
  href: string;
  minutes: number;
}

/** La publication à préparer : aujourd'hui en priorité, sinon la prochaine programmée. */
export function nextPost(store: Store): { content: Content; isToday: boolean } | null {
  const today = startOfDay(new Date()).getTime();
  const upcoming = store.contents
    .filter((c) => c.status !== "publie" && c.scheduledAt && new Date(c.scheduledAt).getTime() >= today)
    .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
  const first = upcoming[0];
  if (!first) return null;
  return { content: first, isToday: new Date(first.scheduledAt!).getTime() < today + DAY };
}

export function nextActions(store: Store): NextAction[] {
  const actions: NextAction[] = [];
  const now = Date.now();
  const soon = (c: Content) => c.scheduledAt && new Date(c.scheduledAt).getTime() - now < 3 * DAY && c.status !== "publie";

  const unlinked = store.metrics.filter((m) => !contentForMetrics(m, store.contents)).length;
  if (unlinked) actions.push({ title: `Relier ${unlinked} publication${unlinked > 1 ? "s" : ""} à ${unlinked > 1 ? "leurs créations" : "sa création"}`, detail: "Sans lien, l'analyse ne sait pas quel format, accroche ou tenue elles utilisaient.", href: "/performances?tab=publications", minutes: 2 });

  const published = store.contents.filter((c) => c.status === "publie").length;
  const last = lastImportAt(store);
  if (published && (!last || now - last.getTime() > 7 * DAY))
    actions.push({ title: "Importer tes statistiques Instagram", detail: last ? `Dernier import le ${last.toLocaleDateString("fr-FR")}.` : "Aucun import pour l'instant : les recommandations restent vides.", href: "/performances?tab=importer", minutes: 3 });

  for (const r of allTests(store)) {
    if ((r.state === "gagnant" || r.state === "egalite") && r.a) actions.push({ title: `Lire le verdict du test « ${r.a.title} »`, detail: r.summary, href: "/performances?tab=tests", minutes: 1 });
  }

  for (const c of store.contents.filter(soon)) {
    if (c.kind !== "carousel" && !c.attributes.hook) actions.push({ title: `Choisir l'accroche de « ${c.title} »`, detail: "Programmée bientôt, sans accroche validée : 5 propositions en un clic dans le labo.", href: editHref(c), minutes: 3 });
    else if (c.kind !== "carousel" && !c.prompts.length) actions.push({ title: `Écrire le prompt de « ${c.title} »`, detail: "Programmée bientôt, aucun prompt enregistré.", href: editHref(c), minutes: 5 });
  }

  for (const c of store.contents.filter((x) => x.kind === "carousel" && x.status !== "publie")) {
    const slides = c.carousel?.slides ?? [];
    const missing = slides.map((s, i) => (s.imageUrl ? null : i + 1)).filter((x): x is number => x !== null);
    if (slides.length && missing.length) actions.push({ title: `Finir les photos du carrousel « ${c.title} »`, detail: `Il manque ${missing.length > 1 ? "les slides" : "la slide"} ${missing.join(", ")}.`, href: editHref(c), minutes: 10 });
  }

  for (const c of store.contents.filter((x) => x.status === "publie" && !x.permalink)) {
    actions.push({ title: `Ajouter le lien Instagram de « ${c.title} »`, detail: "Il sert à relier les statistiques automatiquement.", href: editHref(c), minutes: 1 });
  }
  return actions;
}

export function weekProgress(store: Store) {
  const start = startOfWeek(new Date()).getTime();
  const posts = store.contents.filter((c) => c.publishedAt && new Date(c.publishedAt).getTime() >= start).length;
  const tests = (store.hookTests ?? []).filter((t) => new Date(t.createdAt).getTime() >= start).length;
  return { posts, tests, goalPosts: store.settings.weeklyGoalPosts ?? 5, goalTests: store.settings.weeklyGoalTests ?? 2 };
}

/** Le paquet à copier le jour de la publication. */
export function publishPacket(c: Content): string {
  const caption = c.kind === "carousel" ? c.carousel?.caption ?? "" : c.caption ?? "";
  return [c.attributes.hook ? `Accroche : ${c.attributes.hook}` : "", caption].filter(Boolean).join("\n\n");
}


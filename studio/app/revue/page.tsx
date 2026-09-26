"use client";

import Link from "next/link";
import { useState } from "react";
import AgentJson from "@/components/AgentJson";
import { Button, Card, Loading, PageHeader } from "@/components/ui";
import { buildRows, fmtNum, fmtPct, fmtRel, groupStats, insightsForAgent, median, recommendations, VERDICT_LABEL } from "@/lib/analytics";
import { newCarouselData } from "@/lib/carousel";
import { allTests } from "@/lib/hookTests";
import { editHref, emptyAttributes, newContent, update, useStore } from "@/lib/store";
import { startOfDay } from "@/lib/today";
import { vocabValues } from "@/lib/vocab";
import type { Content, Store } from "@/lib/types";

interface WeekItem {
  title: string;
  kind: "video" | "carousel";
  topic: string;
  hook: string;
  hook_type: string;
  format: string;
  day: number;
  hour: number;
  why: string;
}

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** Lundi de la semaine à planifier : aujourd'hui si on est lundi, sinon lundi prochain. */
function planStart(): Date {
  const d = startOfDay(new Date());
  const offset = (8 - d.getDay()) % 7;
  d.setDate(d.getDate() + offset);
  return d;
}

export default function ReviewPage() {
  const store = useStore();
  if (!store) return <Loading />;
  return <Review store={store} />;
}

function Review({ store }: { store: Store }) {
  const [influencerId, setInfluencerId] = useState(store.influencers[0]?.id ?? "");
  const [plan, setPlan] = useState<(WeekItem & { keep: boolean })[]>([]);
  const [added, setAdded] = useState<Content[]>([]);

  const rows = buildRows(store);
  const stats = groupStats(rows);
  const recs = recommendations(rows, stats);
  const [nowMs] = useState(() => Date.now());
  const weekAgo = nowMs - 7 * 86_400_000;
  const lastWeek = rows.filter((r) => r.metrics.publishedAt && new Date(r.metrics.publishedAt).getTime() >= weekAgo);
  const tests = allTests(store);

  const worked = [
    ...lastWeek.filter((r) => (r.relViews ?? 0) >= 1.2).map((r) => ({ title: r.content?.title ?? (r.metrics.caption.slice(0, 50) || "Publication"), detail: `${fmtNum(r.views)} vues, ${fmtRel(r.relViews)} la médiane${r.retention != null ? `, rétention ${fmtPct(r.retention, 0)}` : ""}.`, href: r.content ? editHref(r.content) : undefined })),
    ...recs.filter((r) => r.kind === "reproduire").map((r) => ({ title: r.title, detail: r.detail, href: undefined })),
    ...tests.filter((t) => t.state === "gagnant").map((t) => ({ title: `Test gagné : « ${(t.winner === "A" ? t.a : t.b)?.attributes.hook ?? ""} »`, detail: t.summary, href: undefined })),
  ];
  const retest = [
    ...recs.filter((r) => r.kind === "tester" || r.kind === "creneau").map((r) => ({ title: r.title, detail: r.detail })),
    ...tests.filter((t) => t.state === "egalite").map((t) => ({ title: `Test sans vainqueur : ${t.a?.title ?? ""}`, detail: t.summary })),
  ];
  const stop = stats
    .filter((s) => s.verdict === "a_eviter" || s.verdict === "faible_negatif")
    .sort((a, b) => (a.medianRelViews ?? 0) - (b.medianRelViews ?? 0))
    .map((s) => ({ title: `${s.attributeLabel} « ${s.value} »`, detail: `${fmtRel(s.medianRelViews)} des vues médianes sur ${s.n} post(s) · ${VERDICT_LABEL[s.verdict]}.` }));

  const start = planStart();
  const influencer = store.influencers.find((i) => i.id === influencerId);
  const agent = store.agentVersions.find((a) => a.id === store.activeAgentVersionId) ?? store.agentVersions[0];

  const addToCalendar = () => {
    const created = plan
      .filter((p) => p.keep)
      .map((p) => {
        const when = new Date(start);
        when.setDate(when.getDate() + Math.min(6, Math.max(0, p.day)));
        when.setHours(Math.min(23, Math.max(0, p.hour)), 0, 0, 0);
        const isCarousel = p.kind === "carousel";
        return newContent({
          kind: isCarousel ? "carousel" : "video",
          title: p.title,
          influencerId: influencerId || null,
          status: "idee",
          scheduledAt: when.toISOString(),
          attributes: { ...emptyAttributes(), topic: p.topic, hook: p.hook, hookType: p.hook_type, format: isCarousel ? `Carrousel · ${p.format}` : p.format },
          script: `Pourquoi : ${p.why}`,
          carousel: isCarousel ? newCarouselData({ brief: `${p.topic}. Accroche : ${p.hook}` }) : undefined,
        });
      });
    update((s) => ({ ...s, contents: [...created, ...s.contents] }));
    setAdded(created);
    setPlan([]);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revue de la semaine"
        subtitle={`${lastWeek.length} publication(s) sur les 7 derniers jours${lastWeek.length ? `, vues médianes ${fmtNum(median(lastWeek.map((r) => r.views)))} contre ${fmtNum(median(rows.map((r) => r.views)))} pour tout le compte` : ""}. Rien n'est inventé : sans statistiques importées, les sections restent vides.`}
        actions={<Link href="/performances?tab=importer"><Button tone="ghost" icon="upload">Importer les stats</Button></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Ce qui a marché" tone="lime" items={worked} empty="Pas encore de signal : importe les stats de la semaine." />
        <Section title="À retester" tone="white" items={retest} empty="Rien à confirmer pour l'instant." />
        <Section title="À arrêter ou retravailler" tone="dark" items={stop} empty="Aucun élément ne sous-performe nettement." />
      </div>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Planifier la semaine du {start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</h3>
            <p className="text-sm text-muted">L&apos;agent propose 5 créations à partir de cette revue. Tu gardes celles que tu veux, elles arrivent dans le calendrier.</p>
          </div>
          <select className="input w-auto" value={influencerId} onChange={(e) => setInfluencerId(e.target.value)}>
            {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <AgentJson<{ items: WeekItem[] }>
          schema="week"
          label="Proposer le plan de la semaine"
          model={store.settings.model}
          disabled={!influencer}
          build={() => ({
            instructions: agent?.instructions ?? "",
            context: [
              `# Influenceuse : ${influencer?.name ?? ""}${influencer?.handle ? ` (@${influencer.handle})` : ""}`,
              influencer?.niche ? `Univers : ${influencer.niche}` : "",
              influencer?.formats ? `## Formats validés\n${influencer.formats}` : "",
              "# Revue de la semaine",
              `Ce qui a marché :\n${worked.map((w) => `- ${w.title} : ${w.detail}`).join("\n") || "- rien de marquant"}`,
              `À retester :\n${retest.map((w) => `- ${w.title} : ${w.detail}`).join("\n") || "- rien"}`,
              `À arrêter :\n${stop.map((w) => `- ${w.title} : ${w.detail}`).join("\n") || "- rien"}`,
              "# Enseignements des performances",
              insightsForAgent(store, influencerId || null),
              `Types d'accroche déjà utilisés : ${vocabValues(store, "hookType").map((v) => v.value).join(", ") || "aucun"}`,
              `Formats déjà utilisés : ${vocabValues(store, "format").map((v) => v.value).join(", ") || "aucun"}`,
            ].filter(Boolean).join("\n\n"),
            request: [
              "Propose exactement 5 créations pour la semaine à venir (day : 0 = lundi … 6 = dimanche, hour : heure de publication).",
              "Reprends en priorité ce qui a marché, inclus au moins une piste « à retester » avec une seule variable changée, et évite ce qui est à arrêter.",
              "Mélange vidéos et carrousels selon ce qui marche le mieux, et place les publications sur les créneaux les plus prometteurs.",
              "Pour chacune : un titre court, le sujet, l'accroche des 2 premières secondes, le type d'accroche et le format (réutilise les intitulés existants), et pourquoi.",
            ].join("\n"),
          })}
          onResult={(data) => setPlan((data.items ?? []).map((i) => ({ ...i, keep: true })))}
        />

        {plan.length > 0 && (
          <div className="space-y-3">
            {plan.map((p, i) => (
              <label key={i} className={`flex cursor-pointer gap-4 rounded-2xl p-4 text-sm ${p.keep ? "bg-white text-black" : "bg-surface-2"}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-black" checked={p.keep} onChange={(e) => setPlan(plan.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{DAYS[Math.min(6, Math.max(0, p.day))]} {p.hour} h · {p.kind === "carousel" ? "Carrousel" : "Reel"} · {p.title}</span>
                  <span className="block">« {p.hook} »</span>
                  <span className="mt-1 block opacity-60">{[p.topic, p.hook_type, p.format].filter(Boolean).join(" · ")} — {p.why}</span>
                </span>
              </label>
            ))}
            <Button tone="lime" icon="calendar" disabled={!plan.some((p) => p.keep)} onClick={addToCalendar}>Ajouter au calendrier</Button>
          </div>
        )}
        {added.length > 0 && (
          <p className="rounded-2xl bg-lime/15 p-3 text-sm">{added.length} création(s) ajoutée(s). <Link href="/calendrier" className="text-lime">Voir le calendrier</Link></p>
        )}
      </Card>
    </div>
  );
}

function Section({ title, tone, items, empty }: { title: string; tone: "lime" | "white" | "dark"; items: { title: string; detail: string; href?: string }[]; empty: string }) {
  return (
    <Card tone={tone} className="space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {items.length ? (
        items.slice(0, 6).map((it, i) => (
          <div key={i} className={`rounded-2xl p-3 text-sm ${tone === "dark" ? "bg-surface-2" : "bg-black/5"}`}>
            {it.href ? <Link href={it.href} className="font-semibold underline-offset-2 hover:underline">{it.title}</Link> : <p className="font-semibold">{it.title}</p>}
            <p className="mt-1 opacity-70">{it.detail}</p>
          </div>
        ))
      ) : (
        <p className="text-sm opacity-70">{empty}</p>
      )}
    </Card>
  );
}

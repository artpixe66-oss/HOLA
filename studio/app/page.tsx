"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, Button, Card, Loading, StatCard, StatusPill } from "@/components/ui";
import { buildRows, fmtNum, fmtPct, groupStats, median, recommendations } from "@/lib/analytics";
import { withDemo } from "@/lib/demo";
import { update, useStore } from "@/lib/store";
import { STATUSES, type Content, type Influencer } from "@/lib/types";

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const contentDate = (c: Content) => c.scheduledAt ?? c.publishedAt;

export default function Dashboard() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!store) return null;
    const rows = buildRows(store);
    const stats = groupStats(rows);
    const inProgress = store.contents.filter((c) => c.status !== "publie");
    const upcoming = store.contents
      .filter((c) => c.scheduledAt && new Date(c.scheduledAt).getTime() >= startOfDay(new Date()).getTime())
      .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
    const recent = [...store.contents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { rows, stats, inProgress, upcoming, recent, recs: recommendations(rows, stats) };
  }, [store]);

  if (!store || !data) return <Loading />;

  const { rows, inProgress, upcoming, recent, recs } = data;
  const focusList = [...upcoming, ...recent.filter((c) => !upcoming.includes(c))];
  const selected = store.contents.find((c) => c.id === selectedId) ?? focusList[0] ?? null;
  const infl = (id: string | null) => store.influencers.find((i) => i.id === id) ?? null;
  const signals = data.stats.filter((s) => s.verdict === "solide").length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <StatCard tone="lime" title="Contenus en production" value={inProgress.length} caption={`${upcoming.length} programmé(s) à venir`} href="/bibliotheque" />
          <StatCard tone="white" title="Publications analysées" value={rows.length} caption={rows.length ? `${fmtNum(median(rows.map((r) => r.views)))} vues médianes` : "Importe tes statistiques"} href="/performances" />
          <StatCard tone="dark" title="Influenceuses" value={store.influencers.length} caption={`${signals} signal(aux) solide(s)`} href="/influenceuses" />
        </section>

        <section className="border-t border-line pt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold md:text-3xl">Programme de publication</h2>
            <span className="text-sm font-medium">{new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
          </div>
          <DayStrip contents={store.contents} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          {selected ? (
            <FocusCard content={selected} influencerName={infl(selected.influencerId)?.name} influencer={infl(selected.influencerId)} rows={rows} />
          ) : (
            <Card tone="white" className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-xl font-semibold">Aucune création pour l&apos;instant</p>
                <p className="mt-2 text-sm text-black/60">Pars d&apos;une inspiration ou crée directement un contenu dans le studio. Tu peux aussi charger un exemple pour voir le tableau de bord rempli.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/studio?new=1" className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white">Nouvelle création</Link>
                <button onClick={() => update(withDemo)} className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium">Charger un exemple</button>
              </div>
            </Card>
          )}
          <div className="space-y-3">
            {focusList.slice(0, 5).map((c) => {
              const i = infl(c.influencerId);
              const st = STATUSES.find((s) => s.id === c.status)!;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`relative flex w-full items-center gap-4 rounded-[28px] bg-surface p-4 pr-6 text-left transition hover:bg-surface-2 ${selected?.id === c.id ? "ring-2 ring-lime" : ""}`}>
                  <span className="absolute left-1/2 top-0 h-1 w-1/2 -translate-x-1/2 rounded-b-full" style={{ background: st.color }} />
                  <Avatar influencer={i} size={52} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">{c.title}</span>
                    <span className="block truncate text-sm text-muted">
                      {i?.name ?? "Sans influenceuse"} · {contentDate(c) ? new Date(contentDate(c)!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : st.label}
                    </span>
                  </span>
                  <Icon name="arrow" className="shrink-0" />
                </button>
              );
            })}
            {!focusList.length && <p className="rounded-[28px] bg-surface p-6 text-sm text-muted">Tes créations apparaîtront ici.</p>}
          </div>
        </section>

        {recs.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ce que disent tes stats</h2>
              <Link href="/performances" className="text-sm text-lime">Tout voir</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recs.slice(0, 4).map((r, i) => (
                <div key={i} className="rounded-[24px] bg-surface p-5">
                  <p className="font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm text-muted">{r.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <SidePanel content={selected} store={store} />
    </div>
  );
}

function DayStrip({ contents }: { contents: Content[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 9 }, (_, i) => new Date(today.getTime() + (i - 2) * DAY));
  const onDay = (d: Date) => contents.filter((c) => contentDate(c) && sameDay(new Date(contentDate(c)!), d));
  const todays = onDay(today);
  return (
    <div className="flex items-center overflow-x-auto pb-2">
      {days.map((d, idx) => {
        const n = onDay(d).length;
        const isToday = sameDay(d, today);
        if (isToday)
          return (
            <Link key={idx} href="/calendrier" className="-mx-2 z-10 flex h-24 min-w-[300px] shrink-0 items-center gap-6 rounded-full bg-lime px-8 text-black">
              <span className="text-4xl font-semibold">{d.getDate()}</span>
              {todays.length ? (
                <span className="flex flex-1 items-center justify-around gap-4">
                  {todays.slice(0, 3).map((c) => (
                    <span key={c.id} className="flex max-w-[110px] flex-col items-center text-center text-xs font-semibold leading-tight">
                      <span className="mb-1 h-2.5 w-2.5 rounded-full bg-black" />
                      <span className="line-clamp-2">{c.title}</span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-sm font-semibold">Rien de programmé aujourd&apos;hui</span>
              )}
            </Link>
          );
        const past = d < today;
        return (
          <Link
            key={idx}
            href="/calendrier"
            className={`relative -mr-3 grid h-24 w-24 shrink-0 place-items-center rounded-full text-4xl font-semibold ${past ? "bg-surface-2 text-white/80" : "bg-white text-black"}`}
            title={`${n} contenu(s)`}
          >
            {d.getDate()}
            {n > 0 && <span className={`absolute bottom-3 h-2 w-2 rounded-full ${past ? "bg-lime" : "bg-violet"}`} />}
          </Link>
        );
      })}
    </div>
  );
}

function FocusCard({ content, influencer, influencerName, rows }: { content: Content; influencer: Influencer | null; influencerName?: string; rows: ReturnType<typeof buildRows> }) {
  const idx = STATUSES.findIndex((s) => s.id === content.status);
  const progress = Math.round(((idx + 1) / STATUSES.length) * 100);
  const row = rows.find((r) => r.content?.id === content.id);
  return (
    <Card tone="white" className="flex flex-col gap-6">
      <Link href={`/studio?id=${content.id}`} className="flex items-center gap-4">
        <Avatar influencer={influencer} size={60} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{influencerName ?? "Sans influenceuse"}</span>
          <StatusPill status={content.status} />
        </span>
        <Icon name="arrow" size={24} />
      </Link>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold">{content.title}</p>
          <p className="mt-1 text-sm text-black/60">{content.attributes.format || content.attributes.topic || "Format à définir"}</p>
        </div>
        <p className="shrink-0 text-4xl font-semibold">{row ? fmtNum(row.views) : content.attributes.durationSec ? `${content.attributes.durationSec}s` : "—"}</p>
      </div>
      <div>
        <div className="relative h-11 overflow-hidden rounded-full border-2 border-black/80">
          <div className="absolute inset-y-0 left-0 rounded-full bg-black" style={{ width: `${progress}%` }} />
          <span className="absolute inset-0 grid place-items-center text-sm font-semibold mix-blend-difference text-white">{progress}%</span>
        </div>
        <p className="mt-3 text-sm font-medium text-black/60">{row ? `Enregistrements ${fmtPct(row.saveRate)} · partages ${fmtPct(row.shareRate)}` : STATUSES[idx].label}</p>
      </div>
    </Card>
  );
}

function SidePanel({ content, store }: { content: Content | null; store: NonNullable<ReturnType<typeof useStore>> }) {
  const influencer = store.influencers.find((i) => i.id === content?.influencerId) ?? null;
  const row = content ? buildRows(store).find((r) => r.content?.id === content.id) : undefined;
  const counts = STATUSES.map((s) => ({ ...s, n: store.contents.filter((c) => c.status === s.id).length }));
  const total = counts.reduce((a, b) => a + b.n, 0);

  return (
    <aside className="space-y-8 border-line xl:border-l xl:pl-6">
      {content ? (
        <div>
          <div className="flex items-center gap-4">
            <Avatar influencer={influencer} size={72} />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{influencer?.name ?? "Sans influenceuse"}</p>
              <p className="flex gap-3 text-sm">
                <span className="text-muted">{influencer?.handle ? `@${influencer.handle}` : "—"}</span>
                <span className="text-lime">{STATUSES.find((s) => s.id === content.status)?.label}</span>
              </p>
            </div>
          </div>
          <h3 className="mt-6 text-3xl font-semibold leading-tight">{content.title}</h3>
          <p className="mt-1 text-sm text-muted">{content.attributes.hook ? `« ${content.attributes.hook} »` : "Accroche à écrire"}</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold">{row ? fmtNum(row.views) : content.prompts.length}</p>
              <p className="mt-1 text-sm text-muted">{row ? "Vues" : "Versions de prompt"}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-semibold">{row ? fmtPct(row.engagementRate, 0) : content.attributes.durationSec ? `${content.attributes.durationSec}s` : "—"}</p>
              <p className="mt-1 text-sm text-muted">{row ? "Engagement" : "Durée"}</p>
            </div>
          </div>
          <Link href={`/studio?id=${content.id}`} className="mt-5 inline-block">
            <Button tone="lime" icon="wand">Ouvrir dans le studio</Button>
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted">Sélectionne une création pour voir son détail.</p>
      )}

      <MiniMonth contents={store.contents} />

      <div>
        <div className="flex h-10 gap-1">
          {total ? (
            counts.filter((c) => c.n).map((c) => <span key={c.id} className="rounded-full" style={{ background: c.color, flexGrow: c.n }} title={`${c.label} : ${c.n}`} />)
          ) : (
            <span className="flex-1 rounded-full bg-surface-2" />
          )}
        </div>
        <ul className="mt-5 space-y-3 text-sm">
          {counts.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              <span className="flex-1 font-medium">{c.label}</span>
              <span className="text-muted">{total ? Math.round((c.n / total) * 100) : 0}%</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function MiniMonth({ contents }: { contents: Content[] }) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lundi en premier
  const has = new Set(
    contents
      .map(contentDate)
      .filter(Boolean)
      .map((d) => new Date(d!))
      .filter((d) => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear())
      .map((d) => d.getDate()),
  );
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-y-2 text-center text-base font-semibold">
      {cells.map((d, i) => {
        if (d == null) return <span key={i} />;
        const on = has.has(d);
        const col = i % 7;
        const left = on && !(col > 0 && has.has(d - 1));
        const right = on && !(col < 6 && d < daysInMonth && has.has(d + 1));
        const isToday = d === today.getDate();
        return (
          <span
            key={i}
            className={`py-2.5 ${on ? "bg-white text-black" : ""} ${left ? "rounded-l-full" : ""} ${right ? "rounded-r-full" : ""} ${isToday ? "underline decoration-lime decoration-4 underline-offset-4" : ""}`}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}

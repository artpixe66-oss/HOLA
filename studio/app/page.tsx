"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, Button, Card, Loading } from "@/components/ui";
import { withDemo } from "@/lib/demo";
import { allTests } from "@/lib/hookTests";
import { editHref, now, update, useStore } from "@/lib/store";
import { nextActions, nextPost, publishPacket, weekProgress } from "@/lib/today";
import type { Content, Store } from "@/lib/types";

const DAY = 86_400_000; // utilisé par DayStrip
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const contentDate = (c: Content) => c.scheduledAt ?? c.publishedAt;

export default function Today() {
  const store = useStore();
  if (!store) return <Loading />;
  const post = nextPost(store);
  const actions = nextActions(store).slice(0, 3);
  const week = weekProgress(store);
  const tests = allTests(store).filter((t) => t.state !== "preparation" || t.a || t.b).slice(-3).reverse();
  const isMonday = new Date().getDay() === 1;
  const empty = !store.contents.length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-8">
        <div>
          <p className="text-sm font-medium text-lime">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h2 className="text-3xl font-semibold md:text-4xl">Aujourd&apos;hui</h2>
        </div>

        {post ? (
          <PostCard key={post.content.id} content={post.content} isToday={post.isToday} store={store} />
        ) : (
          <Card tone="lime" className="flex flex-col gap-4">
            <p className="text-2xl font-semibold">{empty ? "Bienvenue dans ton studio" : "Rien de programmé"}</p>
            <p className="max-w-xl text-sm text-black/70">{empty ? "Crée ta première vidéo ou ton premier carrousel, ou charge un exemple pour voir l'application remplie." : "Programme ta prochaine publication depuis le calendrier ou lance la revue de la semaine pour planifier les 7 prochains jours."}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/studio?new=1" className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white">Nouvelle vidéo</Link>
              <Link href="/carrousels?new=1" className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium">Nouveau carrousel</Link>
              {empty ? <button onClick={() => update(withDemo)} className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium">Charger un exemple</button> : <Link href="/revue" className="rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium">Planifier la semaine</Link>}
            </div>
          </Card>
        )}

        <section className="space-y-3">
          <h3 className="text-xl font-semibold">Prochaines actions</h3>
          {actions.length ? (
            actions.map((a, i) => (
              <Link key={i} href={a.href} className="flex items-center gap-4 rounded-[24px] bg-surface p-4 pr-6 transition hover:bg-surface-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet font-semibold">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{a.title}</span>
                  <span className="block text-sm text-muted">{a.detail}</span>
                </span>
                <span className="shrink-0 text-sm text-lime">{a.minutes} min</span>
              </Link>
            ))
          ) : (
            <p className="rounded-[24px] bg-surface p-5 text-sm text-muted">Rien en attente. Tout est à jour.</p>
          )}
        </section>

        <section className="border-t border-line pt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Programme</h3>
            <Link href="/calendrier" className="text-sm text-lime">Calendrier</Link>
          </div>
          <DayStrip contents={store.contents} />
        </section>
      </div>

      <aside className="space-y-6 xl:border-l xl:border-line xl:pl-6">
        <Card tone="white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tests d&apos;accroche</h3>
            <Link href="/performances?tab=tests" className="text-sm text-black/60">Tout voir</Link>
          </div>
          {tests.length ? (
            <div className="mt-3 space-y-3">
              {tests.map((t) => (
                <div key={t.test.id} className="rounded-2xl bg-black/5 p-3 text-sm">
                  <p className="font-semibold">{t.a?.title ?? "Test"}</p>
                  <p className="mt-1 text-black/60">{t.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-black/60">Aucun test. Dans le studio, le labo d&apos;accroches propose 5 accroches : choisis-en deux pour lancer un test A/B.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Objectif de la semaine</h3>
          <Progress label="Publications" value={week.posts} goal={week.goalPosts} />
          <Progress label="Tests d'accroche lancés" value={week.tests} goal={week.goalTests} />
          <p className="text-xs text-muted">Objectifs réglables dans Agent &amp; réglages.</p>
        </Card>

        <Card className={isMonday ? "ring-2 ring-lime" : ""}>
          <h3 className="text-lg font-semibold">Revue de la semaine</h3>
          <p className="mt-1 text-sm text-muted">Ce qui a marché, ce qu&apos;il faut retester, ce qu&apos;il faut arrêter, puis le plan des 7 prochains jours.{isMonday ? " C'est lundi : bon moment pour la faire." : ""}</p>
          <Link href="/revue" className="mt-4 inline-block"><Button tone="lime" icon="arrow">Ouvrir la revue</Button></Link>
        </Card>

        <MiniMonth contents={store.contents} />
      </aside>
    </div>
  );
}

function Progress({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, goal ? (value / goal) * 100 : 0);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">{label}</span><span className="font-semibold">{value} / {goal}</span></div>
      <div className="h-3 rounded-full bg-surface-2"><div className="h-3 rounded-full bg-lime" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function PostCard({ content, isToday, store }: { content: Content; isToday: boolean; store: Store }) {
  const [copied, setCopied] = useState(false);
  const influencer = store.influencers.find((i) => i.id === content.influencerId) ?? null;
  const cl = content.checklist ?? {};
  const setCheck = (k: "hook" | "checkpoints" | "caption", v: boolean) => update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, checklist: { ...c.checklist, [k]: v } } : c)) }));
  const when = new Date(content.scheduledAt!);
  const cover = content.kind === "carousel" ? content.carousel?.slides.find((s) => s.imageUrl)?.imageUrl : undefined;
  const packet = publishPacket(content);

  const copyPacket = async () => {
    await navigator.clipboard.writeText(packet);
    setCheck("caption", true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markPublished = () => {
    const link = prompt("Lien de la publication Instagram (pour relier les statistiques) :", content.permalink || "https://www.instagram.com/reel/");
    if (link === null) return;
    const clean = /instagram\.com\/(reel|p)\/[\w-]+/.test(link) ? link.trim() : "";
    update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, status: "publie", publishedAt: now(), permalink: clean || c.permalink } : c)) }));
  };

  const items: { k: "hook" | "checkpoints" | "caption" | "link"; label: string; done: boolean }[] = [
    { k: "hook", label: "Accroche validée", done: !!cl.hook || !!content.attributes.hook },
    { k: "checkpoints", label: influencer?.checkpoints ? "Points de contrôle vérifiés" : "Vidéo relue", done: !!cl.checkpoints },
    { k: "caption", label: "Légende et hashtags copiés", done: !!cl.caption },
    { k: "link", label: "Lien Instagram ajouté", done: !!content.permalink },
  ];

  return (
    <Card tone="lime" className="flex flex-col gap-6 md:flex-row">
      <Link href={editHref(content)} className="grid aspect-[4/5] w-full shrink-0 place-items-center overflow-hidden rounded-[20px] bg-black text-sm text-lime md:w-40">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : content.videoUrl ? (
          <video src={content.videoUrl} muted className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2"><Icon name={content.kind === "carousel" ? "layers" : "film"} size={28} />Aperçu</span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
          <span>{isToday ? "À publier aujourd'hui" : `Prochaine publication · ${when.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}`} · {when.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex items-center gap-2"><Avatar influencer={influencer} size={24} />{influencer?.name ?? "—"} · {content.kind === "carousel" ? "Carrousel" : "Reel"}</span>
        </div>
        <Link href={editHref(content)} className="text-2xl font-semibold leading-tight md:text-3xl">{content.title}</Link>
        {content.attributes.hook && <p className="text-sm text-black/70">« {content.attributes.hook} »</p>}
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {items.map((it) => (
            <label key={it.k} className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-black" checked={it.done} disabled={it.k === "link"} onChange={(e) => it.k !== "link" && setCheck(it.k, e.target.checked)} />
              {it.label}
            </label>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          <button onClick={copyPacket} disabled={!packet} className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">{copied ? "Copié" : packet ? "Copier le paquet de publication" : "Ajoute une légende dans la création"}</button>
          <button onClick={markPublished} className="rounded-full border border-black/25 px-4 py-2.5 text-sm font-medium">C&apos;est publié</button>
        </div>
      </div>
    </Card>
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

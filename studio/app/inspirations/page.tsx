"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, Button, Card, Empty, Field, Loading, PageHeader } from "@/components/ui";
import { newContent, now, saveContent, uid, update, useStore } from "@/lib/store";
import type { Inspiration } from "@/lib/types";

export default function InspirationsPage() {
  const store = useStore();
  const router = useRouter();
  const [draft, setDraft] = useState({ url: "", title: "", notes: "", transcript: "", tags: "", influencerId: "" });
  const [filter, setFilter] = useState("");
  if (!store) return <Loading />;

  const add = () => {
    const insp: Inspiration = {
      id: uid(),
      url: draft.url.trim(),
      title: draft.title.trim() || draft.url.trim() || "Inspiration",
      influencerId: draft.influencerId || null,
      notes: draft.notes,
      transcript: draft.transcript,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: now(),
    };
    update((s) => ({ ...s, inspirations: [insp, ...s.inspirations] }));
    setDraft({ url: "", title: "", notes: "", transcript: "", tags: "", influencerId: draft.influencerId });
  };

  const toStudio = (i: Inspiration) => {
    const c = newContent({ title: i.title, inspirationId: i.id, influencerId: i.influencerId ?? store.influencers[0]?.id ?? null, status: "idee" });
    saveContent(c);
    router.push(`/studio?id=${c.id}`);
  };

  const list = store.inspirations.filter((i) => !filter || [i.title, i.notes, i.tags.join(" ")].join(" ").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <PageHeader title="Inspirations" subtitle="Les Reels à décortiquer. Colle le lien, tes observations et la transcription : l'agent s'en sert pour écrire le scénario et le prompt." />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card tone="white" className="h-fit space-y-4">
          <h3 className="text-lg font-semibold">Ajouter une inspiration</h3>
          <div className="space-y-3 [&_.input]:bg-black/5 [&_.input]:text-black [&_.input]:border-black/10 [&_span]:text-black/50">
            <Field label="Lien du Reel"><input className="input" placeholder="https://www.instagram.com/reel/…" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} /></Field>
            <Field label="Titre"><input className="input" placeholder="Ex. vanne serviette salle de sport" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Field label="Pour"><select className="input" value={draft.influencerId} onChange={(e) => setDraft({ ...draft, influencerId: e.target.value })}>
              <option value="">À décider</option>
              {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></Field>
            <Field label="Ce qui marche dedans" hint="Accroche, beats, regards, mesures d'image si tu les as."><textarea className="input" rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
            <Field label="Transcription"><textarea className="input" rows={3} value={draft.transcript} onChange={(e) => setDraft({ ...draft, transcript: e.target.value })} /></Field>
            <Field label="Tags" hint="Séparés par des virgules"><input className="input" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} /></Field>
          </div>
          <button disabled={!draft.url.trim() && !draft.title.trim()} onClick={add} className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white disabled:opacity-40">Enregistrer</button>
        </Card>

        <div className="space-y-4">
          <input className="input" placeholder="Rechercher…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          {!list.length && <Empty title="Aucune inspiration">Enregistre les Reels qui t&apos;intéressent pour les transformer ensuite en création.</Empty>}
          {list.map((i) => {
            const infl = store.influencers.find((x) => x.id === i.influencerId);
            const used = store.contents.filter((c) => c.inspirationId === i.id).length;
            return (
              <Card key={i.id}>
                <div className="flex flex-wrap items-start gap-4">
                  {infl && <Avatar influencer={infl} size={40} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">{i.title}</p>
                    {i.url && <a href={i.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-sm text-lime"><Icon name="link" size={14} />{i.url}</a>}
                    {i.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{i.notes}</p>}
                    {i.transcript && <p className="mt-2 line-clamp-3 text-sm italic text-muted">« {i.transcript} »</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {i.tags.map((t) => <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-xs">{t}</span>)}
                      {used > 0 && <span className="rounded-full bg-violet px-3 py-1 text-xs">{used} création(s)</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button tone="lime" icon="wand" small onClick={() => toStudio(i)}>Créer</Button>
                    <Button tone="danger" icon="trash" small onClick={() => confirm("Supprimer cette inspiration ?") && update((s) => ({ ...s, inspirations: s.inspirations.filter((x) => x.id !== i.id) }))} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

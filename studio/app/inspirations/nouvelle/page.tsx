"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loading } from "@/components/ui";
import { newContent, now, saveContent, uid, update, useStore } from "@/lib/store";
import type { Inspiration, Store } from "@/lib/types";

const TAGS = ["Accroche", "Chute", "Son", "Décor", "Montage", "Tenue", "Format"];

/** Écran ouvert depuis le menu Partager d'Instagram (ou à la main sur mobile). */
export default function CapturePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CaptureLoader />
    </Suspense>
  );
}

function CaptureLoader() {
  const store = useStore();
  const params = useSearchParams();
  if (!store) return <Loading />;
  // Instagram met souvent le lien dans « text » plutôt que dans « url »
  const shared = [params.get("url"), params.get("text"), params.get("title")].filter(Boolean).join(" ");
  const url = shared.match(/https?:\/\/\S+/)?.[0] ?? "";
  const title = (params.get("title") ?? "").trim();
  return <Capture store={store} initialUrl={url} initialTitle={title && !title.startsWith("http") ? title : ""} />;
}

function Capture({ store, initialUrl, initialTitle }: { store: Store; initialUrl: string; initialTitle: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [influencerId, setInfluencerId] = useState<string>(store.influencers[0]?.id ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const save = (thenCreate: boolean) => {
    const insp: Inspiration = {
      id: uid(),
      url: url.trim(),
      title: initialTitle || (tags.length ? `Reel · ${tags.join(", ")}` : "Reel partagé"),
      influencerId: influencerId || null,
      notes: note.trim(),
      transcript: "",
      tags,
      createdAt: now(),
    };
    update((s) => ({ ...s, inspirations: [insp, ...s.inspirations] }));
    if (thenCreate) {
      const c = newContent({ title: insp.title, inspirationId: insp.id, influencerId: insp.influencerId });
      saveContent(c);
      router.push(`/studio?id=${c.id}`);
    } else router.push("/inspirations");
  };

  const chip = (on: boolean) => `min-h-11 rounded-full px-4 text-sm font-medium transition ${on ? "bg-lime text-black" : "border border-surface-2 text-white"}`;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div>
        <p className="text-xs font-semibold tracking-wide text-lime">{initialUrl ? "PARTAGÉ DEPUIS INSTAGRAM" : "CAPTURE RAPIDE"}</p>
        <h2 className="text-2xl font-semibold">Nouvelle inspiration</h2>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">LIEN DU REEL</span>
        <input className="input" inputMode="url" placeholder="https://www.instagram.com/reel/…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">POUR</p>
        <div className="flex flex-wrap gap-2">
          {store.influencers.map((i) => <button key={i.id} className={chip(influencerId === i.id)} onClick={() => setInfluencerId(i.id)}>{i.name}</button>)}
          <button className={chip(influencerId === "")} onClick={() => setInfluencerId("")}>À décider</button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">CE QUI MARCHE DEDANS</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => <button key={t} className={chip(tags.includes(t))} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">NOTE RAPIDE</span>
        <textarea className="input" rows={3} placeholder="Ex. le regard caméra à 2 s, la chute sans sourire" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button disabled={!url.trim() && !note.trim()} onClick={() => save(false)} className="min-h-14 rounded-full bg-lime text-base font-semibold text-black disabled:opacity-40">Enregistrer</button>
      <button disabled={!url.trim() && !note.trim()} onClick={() => save(true)} className="min-h-12 rounded-full border border-surface-2 text-sm font-medium disabled:opacity-40">Enregistrer et créer le prompt</button>
    </div>
  );
}

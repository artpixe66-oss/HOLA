"use client";

import { useState } from "react";
import { Avatar, Button, Card, Field, Loading, PageHeader } from "@/components/ui";
import { newInfluencer, saveInfluencer, update, useStore } from "@/lib/store";
import type { Influencer } from "@/lib/types";

const BLOCKS: { key: keyof Influencer; label: string; hint: string; rows: number }[] = [
  { key: "anchors", label: "Ancrages physiques", hint: "En tête du bloc SUJET, injecté mot pour mot dans chaque prompt.", rows: 5 },
  { key: "voice", label: "Bloc VOIX", hint: "Timbre, accent, diction, rythme.", rows: 8 },
  { key: "attitude", label: "Bloc ATTITUDE", hint: "Regard, bouche, posture, gestes.", rows: 8 },
  { key: "formats", label: "Formats et options de DA validés", hint: "À proposer, jamais imposés par défaut.", rows: 8 },
  { key: "checkpoints", label: "Points de contrôle", hint: "À vérifier sur chaque sortie générée.", rows: 4 },
  { key: "notes", label: "Consignes complémentaires", hint: "Ordre des blocs, dosage, ce qu'il faut couper si ça surjoue.", rows: 8 },
];

export default function InfluencersPage() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!store) return <Loading />;
  const selected = store.influencers.find((i) => i.id === selectedId) ?? store.influencers[0] ?? null;

  const create = () => {
    const i = newInfluencer();
    saveInfluencer(i);
    setSelectedId(i.id);
  };

  return (
    <div>
      <PageHeader
        title="Tes influenceuses"
        subtitle="Chaque fiche porte l'identité fixe du personnage. L'agent l'injecte telle quelle dans les prompts : c'est ce qui la rend reconnaissable d'une vidéo à l'autre."
        actions={<Button tone="lime" icon="plus" onClick={create}>Ajouter</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          {store.influencers.map((i) => (
            <button key={i.id} onClick={() => setSelectedId(i.id)} className={`flex w-full items-center gap-3 rounded-[24px] p-3 text-left transition ${selected?.id === i.id ? "bg-white text-black" : "bg-surface hover:bg-surface-2"}`}>
              <Avatar influencer={i} size={48} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{i.name}</span>
                <span className={`block truncate text-sm ${selected?.id === i.id ? "text-black/60" : "text-muted"}`}>{i.handle ? `@${i.handle}` : i.niche || "—"}</span>
              </span>
            </button>
          ))}
        </div>
        {selected ? <Editor key={selected.id} influencer={selected} /> : <p className="text-muted">Ajoute ta première influenceuse.</p>}
      </div>
    </div>
  );
}

function Editor({ influencer }: { influencer: Influencer }) {
  const [draft, setDraft] = useState(influencer);
  const [refLabel, setRefLabel] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(influencer);
  const set = <K extends keyof Influencer>(k: K, v: Influencer[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const remove = () => {
    if (!confirm(`Supprimer la fiche de ${influencer.name} ? Ses créations restent dans la bibliothèque.`)) return;
    update((s) => ({ ...s, influencers: s.influencers.filter((i) => i.id !== influencer.id) }));
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar influencer={draft} size={72} />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Field label="Nom"><input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Alias"><input className="input" value={draft.aliases} onChange={(e) => set("aliases", e.target.value)} /></Field>
            <Field label="Compte Instagram"><input className="input" placeholder="sans @" value={draft.handle} onChange={(e) => set("handle", e.target.value.replace(/^@/, ""))} /></Field>
            <Field label="Univers"><input className="input" value={draft.niche} onChange={(e) => set("niche", e.target.value)} /></Field>
            <Field label="Photo de profil (URL)"><input className="input" value={draft.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} /></Field>
            <Field label="Couleur"><input type="color" className="input h-[42px] p-1" value={draft.color} onChange={(e) => set("color", e.target.value)} /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 text-lg font-semibold">Références visuelles</h3>
        <p className="mb-4 text-sm text-muted">Visage, silhouette en plan entier et vêtements près du corps, même lumière. Colle les liens de tes images (Higgsfield, Drive, etc.).</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {draft.references.map((r, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={r.label} className="aspect-[3/4] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-3 py-2 text-xs">
                <span className="truncate">{r.label || `Réf ${i + 1}`}</span>
                <button onClick={() => set("references", draft.references.filter((_, j) => j !== i))} className="text-danger">Retirer</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="input max-w-[200px]" placeholder="Visage, silhouette…" value={refLabel} onChange={(e) => setRefLabel(e.target.value)} />
          <input className="input min-w-[220px] flex-1" placeholder="https://…" value={refUrl} onChange={(e) => setRefUrl(e.target.value)} />
          <Button icon="plus" disabled={!refUrl.trim()} onClick={() => { set("references", [...draft.references, { label: refLabel.trim(), url: refUrl.trim() }]); setRefLabel(""); setRefUrl(""); }}>Ajouter</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold">Blocs fixes du personnage</h3>
        <div className="grid gap-5">
          {BLOCKS.map((b) => (
            <Field key={b.key} label={b.label} hint={b.hint}>
              <textarea className="input font-mono text-[13px]" rows={b.rows} value={String(draft[b.key] ?? "")} onChange={(e) => set(b.key, e.target.value as never)} />
            </Field>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 flex flex-wrap justify-between gap-2 rounded-full bg-black/80 p-2 backdrop-blur">
        <Button tone="danger" icon="trash" onClick={remove}>Supprimer</Button>
        <div className="flex gap-2">
          <Button tone="ghost" disabled={!dirty} onClick={() => setDraft(influencer)}>Annuler</Button>
          <Button tone="lime" icon="check" disabled={!dirty} onClick={() => saveInfluencer(draft)}>Enregistrer la fiche</Button>
        </div>
      </div>
    </div>
  );
}

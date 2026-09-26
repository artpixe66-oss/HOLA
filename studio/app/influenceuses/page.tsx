"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { uploadImage } from "@/lib/image";
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

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  // Les photos sont enregistrées immédiatement, sans attendre « Enregistrer la fiche ».
  const persist = (patch: Partial<Influencer>) => {
    setDraft((d) => ({ ...d, ...patch }));
    update((s) => ({ ...s, influencers: s.influencers.map((i) => (i.id === influencer.id ? { ...i, ...patch } : i)) }));
  };
  const setRefs = (references: Influencer["references"]) => persist({ references });
  const setAvatar = (avatarUrl: string) => persist({ avatarUrl });

  const onFiles = async (files: File[]) => {
    setUploading(true);
    setUploadNote(null);
    const added: Influencer["references"] = [];
    let local = false;
    try {
      for (const f of files) {
        const r = await uploadImage(f);
        local ||= r.local;
        added.push({ label: "", url: r.url });
      }
    } catch (e) {
      setUploadNote(e instanceof Error ? e.message : "Envoi impossible.");
    }
    if (added.length) {
      const references = [...draft.references, ...added];
      persist(draft.avatarUrl ? { references } : { references, avatarUrl: added[0].url });
    }
    if (local) setUploadNote("Photos gardées sur cet appareil, en version réduite : active le stockage Blob sur Vercel pour les enregistrer en ligne en pleine qualité.");
    setUploading(false);
  };

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
            <Field label="Photo de profil" hint="Choisis-la parmi les références ci-dessous."><input className="input" placeholder="Lien d'une image (optionnel)" value={draft.avatarUrl.startsWith("data:") ? "Photo importée" : draft.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} /></Field>
            <Field label="Couleur"><input type="color" className="input h-[42px] p-1" value={draft.color} onChange={(e) => set("color", e.target.value)} /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 text-lg font-semibold">Références visuelles</h3>
        <p className="mb-4 text-sm text-muted">Visage, silhouette en plan entier et vêtements près du corps, même lumière. Les photos sont enregistrées tout de suite.</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {draft.references.map((r, i) => (
            <div key={r.url + i} className="relative overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={r.label} className="aspect-[3/4] w-full object-cover" />
              {draft.avatarUrl === r.url && <span className="absolute left-2 top-2 rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold text-black">Photo de profil</span>}
              <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-black/75 p-2 text-xs">
                <input className="w-full rounded-lg bg-white/10 px-2 py-1 outline-none" placeholder={`Réf ${i + 1} (visage, silhouette…)`} value={r.label} onChange={(e) => setRefs(draft.references.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <div className="flex justify-between gap-2">
                  <button onClick={() => setAvatar(r.url)} className="text-lime">Photo de profil</button>
                  <button onClick={() => setRefs(draft.references.filter((_, j) => j !== i))} className="text-danger">Retirer</button>
                </div>
              </div>
            </div>
          ))}
          <label className={`grid aspect-[3/4] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-surface-2 text-center text-sm text-muted transition hover:border-lime hover:text-white ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <span className="px-3">
              <Icon name="upload" className="mx-auto mb-2" size={28} />
              {uploading ? "Envoi…" : "Ajouter des photos"}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); e.target.value = ""; }} />
          </label>
        </div>
        {uploadNote && <p className="mb-3 rounded-2xl bg-surface-2 p-3 text-xs text-muted">{uploadNote}</p>}
        <details>
          <summary className="cursor-pointer text-sm text-muted">Ajouter par lien</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="input max-w-[200px]" placeholder="Visage, silhouette…" value={refLabel} onChange={(e) => setRefLabel(e.target.value)} />
            <input className="input min-w-[220px] flex-1" placeholder="https://…" value={refUrl} onChange={(e) => setRefUrl(e.target.value)} />
            <Button icon="plus" disabled={!refUrl.trim()} onClick={() => { setRefs([...draft.references, { label: refLabel.trim(), url: refUrl.trim() }]); setRefLabel(""); setRefUrl(""); }}>Ajouter</Button>
          </div>
        </details>
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

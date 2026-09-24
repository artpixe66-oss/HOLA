"use client";

import { useState } from "react";
import { Button, Card, Field, Loading, PageHeader } from "@/components/ui";
import { now, replaceStore, resetStore, uid, update, useStore } from "@/lib/store";
import type { Settings, Store } from "@/lib/types";

export default function AgentPage() {
  const store = useStore();
  if (!store) return <Loading />;
  return <AgentEditor key={store.activeAgentVersionId ?? "none"} store={store} />;
}

function AgentEditor({ store }: { store: Store }) {
  const active = store.agentVersions.find((a) => a.id === store.activeAgentVersionId) ?? store.agentVersions[0];
  const [text, setText] = useState(active?.instructions ?? "");
  const [label, setLabel] = useState("");
  const dirty = text !== (active?.instructions ?? "");

  const saveVersion = () => {
    const id = uid();
    const n = store.agentVersions.length + 1;
    update((s) => ({ ...s, agentVersions: [{ id, label: `v${n}${label.trim() ? ` — ${label.trim()}` : ""}`, instructions: text, createdAt: now() }, ...s.agentVersions], activeAgentVersionId: id }));
    setLabel("");
  };

  const importFile = async (file: File) => {
    const content = await file.text();
    setText(content.replace(/^---[\s\S]*?---\s*/, ""));
    setLabel(file.name.replace(/\.[^.]+$/, ""));
  };

  const setSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `studio-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Store;
      if (!Array.isArray(data.contents) || !Array.isArray(data.influencers)) throw new Error();
      if (confirm("Remplacer toutes les données actuelles par cette sauvegarde ?")) replaceStore(data);
    } catch {
      alert("Fichier de sauvegarde invalide.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Instructions de l'agent" subtitle="Versionnées : remplace-les par la dernière version de ton skill sans toucher à l'application. Chaque prompt enregistré garde la version utilisée." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Version active : <span className="font-semibold text-white">{active?.label}</span> · {text.length.toLocaleString("fr-FR")} caractères</p>
            <label className="cursor-pointer rounded-full border border-surface-2 px-4 py-2 text-sm">
              Importer un SKILL.md
              <input type="file" accept=".md,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
            </label>
          </div>
          <textarea className="input font-mono text-[12.5px]" rows={28} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <input className="input max-w-xs" placeholder="Nom de la version (optionnel)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button tone="lime" icon="check" disabled={!dirty || !text.trim()} onClick={saveVersion}>Enregistrer une nouvelle version</Button>
            <Button tone="ghost" disabled={!dirty} onClick={() => setText(active?.instructions ?? "")}>Annuler</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 font-semibold">Historique</h3>
            <div className="space-y-2">
              {store.agentVersions.map((v) => (
                <button key={v.id} onClick={() => update((s) => ({ ...s, activeAgentVersionId: v.id }))} className={`w-full rounded-2xl px-4 py-3 text-left text-sm ${v.id === active?.id ? "bg-lime text-black" : "bg-surface-2"}`}>
                  <span className="block font-semibold">{v.label}</span>
                  <span className="text-xs opacity-60">{new Date(v.createdAt).toLocaleString("fr-FR")}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <h3 className="font-semibold">Réglages</h3>
            <Field label="Modèle Claude" hint="Opus 5 par défaut ; en cas de refus, l'API bascule automatiquement sur un modèle de repli.">
              <select className="input" value={store.settings.model} onChange={(e) => setSetting("model", e.target.value)}>
                <option value="claude-opus-5">Claude Opus 5</option>
                <option value="claude-sonnet-5">Claude Sonnet 5 (moins cher)</option>
                <option value="claude-fable-5-1">Claude Fable 5.1 (le plus capable)</option>
              </select>
            </Field>
            <Field label="Modèle Higgsfield par défaut"><input className="input font-mono text-xs" value={store.settings.higgsfieldModel} onChange={(e) => setSetting("higgsfieldModel", e.target.value)} /></Field>
            <Field label="Tarif par seconde générée" hint="À prendre sur ta page de facturation Higgsfield ; l'application ne le devine pas."><input className="input" inputMode="decimal" value={store.settings.pricePerSecond ?? ""} onChange={(e) => setSetting("pricePerSecond", e.target.value ? Number(e.target.value.replace(",", ".")) : null)} /></Field>
            <Field label="Plafond de dépense"><input className="input" inputMode="decimal" value={store.settings.budgetCap ?? ""} onChange={(e) => setSetting("budgetCap", e.target.value ? Number(e.target.value.replace(",", ".")) : null)} /></Field>
            <p className="text-xs text-muted">Dépensé (estimé) : {store.settings.spent.toFixed(2)} <button className="text-lime" onClick={() => setSetting("spent", 0)}>remettre à zéro</button></p>
          </Card>

          <Card className="space-y-3">
            <h3 className="font-semibold">Données</h3>
            <p className="text-xs text-muted">Pour l&apos;instant, tout est enregistré dans ce navigateur. Exporte une sauvegarde régulièrement.</p>
            <div className="flex flex-wrap gap-2">
              <Button small icon="download" onClick={exportBackup}>Exporter</Button>
              <label className="inline-flex cursor-pointer items-center rounded-full border border-surface-2 px-3 py-1.5 text-xs">
                Restaurer
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
              </label>
              <Button small tone="danger" onClick={() => confirm("Tout effacer et repartir de zéro ?") && resetStore()}>Réinitialiser</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

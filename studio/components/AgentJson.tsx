"use client";

import { useState } from "react";
import { Button } from "./ui";
import { parseJsonAnswer, SCHEMA_HINT, type SchemaName } from "@/lib/schemas";

export interface AgentJsonRequest {
  instructions: string;
  context: string;
  request: string;
  images?: string[];
}

/**
 * Demande structurée à l'agent : par l'API si la clé est configurée,
 * sinon par copier-coller avec Claude.ai (même format de réponse).
 */
export default function AgentJson<T>({
  schema,
  label,
  model,
  build,
  onResult,
  disabled,
}: {
  schema: SchemaName;
  label: string;
  model: string;
  build: () => AgentJsonRequest;
  onResult: (data: T) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/structured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema, model, ...build() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      onResult(data as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setShowPaste(true);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    const r = build();
    const text = [r.instructions, "", r.context, "", "# Demande", "", r.request, r.images?.length ? "\n(Je joins les images à ce message.)" : "", "", `Réponds UNIQUEMENT avec un bloc \`\`\`json de la forme : ${SCHEMA_HINT[schema]}`].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setShowPaste(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importPasted = () => {
    try {
      onResult(parseJsonAnswer<T>(paste));
      setPaste("");
      setError(null);
    } catch {
      setError("Réponse illisible : colle le bloc JSON complet renvoyé par Claude.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button tone="lime" icon="wand" disabled={busy || disabled} onClick={run}>{busy ? "L'agent réfléchit…" : label}</Button>
        <Button tone="ghost" icon={copied ? "check" : "copy"} disabled={disabled} onClick={copy}>{copied ? "Copié" : "Copier pour Claude.ai"}</Button>
      </div>
      {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {showPaste && (
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-xs text-muted">Colle ici la réponse de Claude.ai.</p>
          <textarea className="input mt-2 font-mono text-xs" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
          <Button small tone="white" className="mt-2" disabled={!paste.trim()} onClick={importPasted}>Importer la réponse</Button>
        </div>
      )}
    </div>
  );
}

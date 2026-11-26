import type { Metadata } from "next";
import Editor from "@/components/Editor";

export const metadata: Metadata = {
  title: "Créer une carte",
  description: "Éditeur de cartes à collectionner : illustration IA, PV, attaques, effet holo, export PNG HD.",
};

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ modele?: string; prompt?: string }> }) {
  const { modele, prompt } = await searchParams;
  const template = modele === "arcane" || modele === "creature" ? modele : undefined;
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Crée ta carte</h1>
      <Editor initialTemplate={template} initialPrompt={typeof prompt === "string" ? prompt.slice(0, 400) : undefined} />
    </div>
  );
}

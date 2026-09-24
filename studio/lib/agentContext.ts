import { insightsForAgent } from "./analytics";
import type { Content, Store } from "./types";
import { ATTRIBUTE_LABELS } from "./types";

const block = (title: string, body: string) => (body.trim() ? `## ${title}\n\n${body.trim()}\n` : "");

/** Contexte variable envoyé à l'agent après ses instructions (qui, elles, restent en cache). */
export function buildContext(store: Store, content: Content): string {
  const infl = store.influencers.find((i) => i.id === content.influencerId);
  const insp = store.inspirations.find((i) => i.id === content.inspirationId);
  const parts: string[] = ["# Contexte fourni par l'application\n"];

  if (infl) {
    parts.push(
      `# Fiche de l'influenceuse : ${infl.name}${infl.aliases ? ` (alias : ${infl.aliases})` : ""}${infl.handle ? ` — @${infl.handle}` : ""}\n`,
      block("Univers", infl.niche),
      block("Ancrages physiques (mot pour mot, en tête du bloc SUJET)", infl.anchors),
      block("Bloc VOIX (mot pour mot)", infl.voice),
      block("Bloc ATTITUDE (mot pour mot)", infl.attitude),
      block("Formats et options de DA validés", infl.formats),
      block("Points de contrôle propres au personnage", infl.checkpoints),
      block("Consignes complémentaires", infl.notes),
      block("Références visuelles disponibles", infl.references.map((r, i) => `- @Image${i + 1} : ${r.label || "référence"} — ${r.url}`).join("\n")),
    );
  } else {
    parts.push("Aucune influenceuse n'est associée à ce contenu.\n");
  }

  if (insp) {
    parts.push(
      `# Inspiration : ${insp.title}\n`,
      block("Lien", insp.url),
      block("Observations", insp.notes),
      block("Transcription", insp.transcript),
      block("Tags", insp.tags.join(", ")),
    );
  }

  const attrs = Object.entries(content.attributes)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `- ${ATTRIBUTE_LABELS[k as keyof typeof ATTRIBUTE_LABELS]} : ${v}${k === "durationSec" ? " s" : ""}`)
    .join("\n");
  parts.push(`# Contenu en cours : ${content.title}\n`, block("Attributs", attrs), block("Scénario actuel", content.script));
  const last = content.prompts[0];
  if (last) parts.push(block(`Dernière version du prompt (${content.prompts.length} au total)${last.note ? ` — note : ${last.note}` : ""}`, "```\n" + last.text + "\n```"));

  parts.push("# Enseignements des performances\n", insightsForAgent(store, content.influencerId));
  return parts.filter(Boolean).join("\n");
}

export function extractCodeBlock(text: string): string | null {
  const m = text.match(/```[^\n]*\n([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

import { insightsForAgent } from "./analytics";
import { uid } from "./store";
import type { CarouselData, Content, Slide, SlideCategory, Store } from "./types";

export function newCarouselData(partial: Partial<CarouselData> = {}): CarouselData {
  return {
    type: "Photo dump",
    slideCount: 5,
    source: "brief",
    brief: "",
    inspirationUrl: "",
    inspirationNotes: "",
    refImages: [],
    concept: "",
    styleNotes: "",
    caption: "",
    slides: [],
    ...partial,
  };
}

const block = (title: string, body: string | undefined) => (body?.trim() ? `## ${title}\n\n${body.trim()}\n` : "");

export function buildCarouselContext(store: Store, content: Content): string {
  const infl = store.influencers.find((i) => i.id === content.influencerId);
  const parts = ["# Contexte fourni par l'application\n"];
  if (infl) {
    parts.push(
      `# Fiche de l'influenceuse : ${infl.name}${infl.handle ? ` — @${infl.handle}` : ""}\n`,
      block("Univers", infl.niche),
      block("Ancrages physiques (mot pour mot)", infl.anchors),
      block("Détails du corps visibles en POV", infl.povDetails),
      block("Attitude", infl.attitude),
      block("Formats et options de DA validés", infl.formats),
      block("Points de contrôle", infl.checkpoints),
      block("Consignes complémentaires", infl.notes),
      block(
        "Références visuelles disponibles (à citer en @ImageN)",
        infl.references.map((r, i) => `- @Image${i + 1} : ${r.label || "référence sans étiquette"}`).join("\n"),
      ),
    );
  } else parts.push("Aucune influenceuse n'est associée à ce carrousel.\n");
  parts.push("# Enseignements des performances\n", insightsForAgent(store, content.influencerId));
  return parts.filter(Boolean).join("\n");
}

export function carouselRequest(c: CarouselData): string {
  const lines = [`Conçois un carrousel de type « ${c.type} » de exactement ${c.slideCount} photos.`];
  if (c.source === "brief") lines.push("", "Brief (situation, idée ou prompt) :", c.brief.trim() || "(aucun brief : propose un thème adapté à l'influenceuse et à ses meilleures performances)");
  else {
    lines.push("", "Inspiration : un carrousel existant à reprendre avec le personnage.");
    if (c.inspirationUrl.trim()) lines.push(`Lien : ${c.inspirationUrl.trim()}`);
    if (c.refImages.length) lines.push(`Les ${c.refImages.length} image(s) jointe(s) sont des captures de ce carrousel, dans l'ordre.`);
    if (c.inspirationNotes.trim()) lines.push("Notes :", c.inspirationNotes.trim());
  }
  return lines.join("\n");
}

/** Demande à coller dans Claude.ai, avec le format de réponse attendu pour pouvoir la recoller ici. */
export function carouselRequestForClaudeAi(store: Store, content: Content, guide: string): string {
  const c = content.carousel!;
  return [
    guide,
    "",
    buildCarouselContext(store, content),
    "",
    "# Demande",
    "",
    carouselRequest(c),
    c.source === "inspiration" && c.refImages.length ? "\n(Je joins les captures du carrousel d'inspiration à ce message.)" : "",
    "",
    "Réponds UNIQUEMENT avec un bloc ```json contenant : {\"concept\": \"…\", \"style_notes\": \"…\", \"caption\": \"…\", \"slides\": [{\"category\": \"ELLE|POV|DECOR\", \"framing\": \"…\", \"light\": \"…\", \"description\": \"…\", \"prompt\": \"…\"}]}",
  ].join("\n");
}

interface RawStoryboard {
  concept?: string;
  style_notes?: string;
  caption?: string;
  slides?: { category?: string; framing?: string; light?: string; description?: string; prompt?: string }[];
}

export function parseStoryboard(text: string): RawStoryboard {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = JSON.parse(raw) as RawStoryboard;
  if (!Array.isArray(parsed.slides) || !parsed.slides.length) throw new Error("Aucune slide trouvée dans la réponse.");
  return parsed;
}

export function applyStoryboard(c: CarouselData, sb: RawStoryboard): CarouselData {
  const slides: Slide[] = (sb.slides ?? []).map((s, i) => ({
    id: uid(),
    category: (["ELLE", "POV", "DECOR"].includes(String(s.category)) ? s.category : "ELLE") as SlideCategory,
    framing: s.framing ?? "",
    light: s.light ?? "",
    description: s.description ?? "",
    prompt: s.prompt ?? "",
    // on garde l'image déjà obtenue pour la même position
    imageUrl: c.slides[i]?.imageUrl ?? "",
  }));
  return { ...c, concept: sb.concept ?? "", styleNotes: sb.style_notes ?? "", caption: sb.caption ?? "", slides };
}

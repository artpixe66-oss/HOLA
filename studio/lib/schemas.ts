// Schémas JSON des réponses structurées de l'agent (partagés client / serveur).

const str = { type: "string" };

export const SCHEMAS = {
  carousel: {
    type: "object",
    properties: {
      concept: str,
      style_notes: str,
      caption: str,
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: { category: { type: "string", enum: ["ELLE", "POV", "DECOR"] }, framing: str, light: str, description: str, prompt: str },
          required: ["category", "framing", "light", "description", "prompt"],
          additionalProperties: false,
        },
      },
    },
    required: ["concept", "style_notes", "caption", "slides"],
    additionalProperties: false,
  },
  hooks: {
    type: "object",
    properties: {
      hooks: {
        type: "array",
        items: {
          type: "object",
          properties: { image: str, on_screen_text: str, first_line: str, hook_type: str, why: str },
          required: ["image", "on_screen_text", "first_line", "hook_type", "why"],
          additionalProperties: false,
        },
      },
    },
    required: ["hooks"],
    additionalProperties: false,
  },
  week: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: str,
            kind: { type: "string", enum: ["video", "carousel"] },
            topic: str,
            hook: str,
            hook_type: str,
            format: str,
            day: { type: "integer", minimum: 0, maximum: 6 },
            hour: { type: "integer", minimum: 0, maximum: 23 },
            why: str,
          },
          required: ["title", "kind", "topic", "hook", "hook_type", "format", "day", "hour", "why"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
} as const;

export type SchemaName = keyof typeof SCHEMAS;

/** Forme attendue, à rappeler dans une demande copiée vers Claude.ai. */
export const SCHEMA_HINT: Record<SchemaName, string> = {
  carousel: '{"concept": "…", "style_notes": "…", "caption": "…", "slides": [{"category": "ELLE|POV|DECOR", "framing": "…", "light": "…", "description": "…", "prompt": "…"}]}',
  hooks: '{"hooks": [{"image": "…", "on_screen_text": "…", "first_line": "…", "hook_type": "…", "why": "…"}]}',
  week: '{"items": [{"title": "…", "kind": "video|carousel", "topic": "…", "hook": "…", "hook_type": "…", "format": "…", "day": 0, "hour": 19, "why": "…"}]}  (day : 0 = lundi … 6 = dimanche)',
};

/** Extrait le JSON d'une réponse collée (bloc ```json ou objet brut). */
export function parseJsonAnswer<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw) as T;
}

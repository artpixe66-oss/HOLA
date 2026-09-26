import Anthropic from "@anthropic-ai/sdk";
import { getFile } from "@/lib/blobStore";

const client = new Anthropic();

type ImageBlock = Anthropic.Beta.BetaImageBlockParam;
type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

async function toImageBlock(src: string): Promise<ImageBlock | null> {
  const data = src.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (data) return { type: "image", source: { type: "base64", media_type: data[1] as MediaType, data: data[2] } };
  if (/^https?:\/\//.test(src)) return { type: "image", source: { type: "url", url: src } };
  const priv = src.match(/^\/api\/image\?p=(.+)$/);
  if (priv) {
    const res = await getFile(decodeURIComponent(priv[1]));
    if (!res || res.statusCode !== 200) return null;
    const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
    return { type: "image", source: { type: "base64", media_type: (res.blob.contentType as MediaType) || "image/jpeg", data: buf.toString("base64") } };
  }
  return null;
}

export interface StructuredRequest {
  model?: string;
  instructions: string;
  context: string;
  request: string;
  images?: string[];
}

/** Appelle Claude et renvoie une réponse JSON conforme au schéma, ou une réponse d'erreur prête à renvoyer. */
export async function runStructured(body: StructuredRequest, schema: Record<string, unknown>): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY n'est pas configurée : utilise « Copier pour Claude.ai »." }, { status: 500 });
  }
  const images = (await Promise.all((body.images ?? []).slice(0, 10).map(toImageBlock))).filter((b): b is ImageBlock => b !== null);
  try {
    const stream = client.beta.messages.stream({
      model: body.model || "claude-opus-5",
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: body.instructions, cache_control: { type: "ephemeral" } },
        { type: "text", text: body.context },
      ],
      messages: [{ role: "user", content: [...images, { type: "text", text: body.request }] }],
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") return Response.json({ error: "L'agent a refusé cette demande. Reformule-la." }, { status: 422 });
    const text = final.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return Response.json(JSON.parse(text));
  } catch (error) {
    const message =
      error instanceof Anthropic.AuthenticationError
        ? "Clé API Anthropic invalide."
        : error instanceof Anthropic.RateLimitError
          ? "Limite de requêtes atteinte, réessaie dans un instant."
          : error instanceof Anthropic.APIError
            ? `Erreur API ${error.status} : ${error.message}`
            : error instanceof SyntaxError
              ? "Réponse de l'agent illisible, relance."
              : "Erreur de connexion à l'agent.";
    return Response.json({ error: message }, { status: 502 });
  }
}

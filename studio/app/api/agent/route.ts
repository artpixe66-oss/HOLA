import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

interface AgentRequest {
  model?: string;
  instructions: string;
  context: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

const client = new Anthropic();

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY n'est pas configurée dans les variables d'environnement du projet." },
      { status: 500 },
    );
  }
  const body = (await request.json()) as AgentRequest;
  if (!body.messages?.length || body.messages[0].role !== "user") {
    return Response.json({ error: "La conversation doit commencer par un message utilisateur." }, { status: 400 });
  }

  // Instructions stables en premier (mises en cache), contexte variable ensuite.
  const stream = client.beta.messages.stream({
    model: body.model || "claude-opus-5",
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: body.instructions, cache_control: { type: "ephemeral" } },
      { type: "text", text: body.context },
    ],
    messages: body.messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n[L'agent a refusé cette demande. Reformule-la.]"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n[Réponse coupée : limite de longueur atteinte.]"));
        }
      } catch (error) {
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "Clé API Anthropic invalide."
            : error instanceof Anthropic.RateLimitError
              ? "Limite de requêtes atteinte, réessaie dans un instant."
              : error instanceof Anthropic.APIError
                ? `Erreur API ${error.status} : ${error.message}`
                : "Erreur de connexion à l'agent.";
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

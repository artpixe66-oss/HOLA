import { runStructured, type StructuredRequest } from "@/lib/claudeServer";
import { SCHEMAS, type SchemaName } from "@/lib/schemas";

export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json()) as StructuredRequest & { schema: SchemaName };
  const schema = SCHEMAS[body.schema];
  if (!schema) return Response.json({ error: "Schéma inconnu." }, { status: 400 });
  return runStructured(body, schema as unknown as Record<string, unknown>);
}

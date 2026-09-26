import { runStructured, type StructuredRequest } from "@/lib/claudeServer";
import { SCHEMAS } from "@/lib/schemas";

export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json()) as StructuredRequest;
  return runStructured(body, SCHEMAS.carousel as unknown as Record<string, unknown>);
}

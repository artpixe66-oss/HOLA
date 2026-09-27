// État des branchements, sans jamais renvoyer la valeur d'une clé.
import { checkAll } from "@/lib/instagram";

const HF_BASE = process.env.HF_BASE || "https://platform.higgsfield.ai";

async function checkHiggsfield(): Promise<{ ok: boolean | null; detail: string }> {
  const key = process.env.HF_API_KEY;
  const secret = process.env.HF_API_SECRET;
  if (!key || !secret) return { ok: false, detail: "HF_API_KEY et/ou HF_API_SECRET absentes des variables d'environnement." };
  try {
    // Demande le statut d'une génération qui n'existe pas : 401/403 = clés refusées, sinon clés acceptées.
    const res = await fetch(`${HF_BASE.replace(/\/$/, "")}/requests/00000000-0000-0000-0000-000000000000/status`, {
      headers: { Authorization: `Key ${key}:${secret}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, detail: `Clés refusées par Higgsfield (HTTP ${res.status}) : vérifie la clé et le secret.` };
    return { ok: true, detail: `Higgsfield répond (HTTP ${res.status} sur une génération fictive) : les clés sont acceptées.` };
  } catch {
    return { ok: null, detail: `Impossible de joindre ${HF_BASE}.` };
  }
}

export async function GET() {
  const [hf, instagram] = await Promise.all([checkHiggsfield(), checkAll()]);
  return Response.json(
    {
      password: Boolean(process.env.APP_PASSWORD),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      higgsfield: hf,
      instagram,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

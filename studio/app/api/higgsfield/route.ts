// Proxy vers l'API Higgsfield : les clés restent côté serveur.
// Flux asynchrone : POST {model} -> request_id, puis GET /requests/{id}/status.

const BASE = process.env.HF_BASE || "https://platform.higgsfield.ai";

function auth(): string | null {
  const key = process.env.HF_API_KEY;
  const secret = process.env.HF_API_SECRET;
  return key && secret ? `Key ${key}:${secret}` : null;
}

async function call(url: string, init: RequestInit = {}) {
  const header = auth();
  if (!header) {
    return Response.json({ error: "HF_API_KEY et HF_API_SECRET ne sont pas configurées." }, { status: 500 });
  }
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: header, "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 600) };
  }
  return Response.json(res.ok ? data : { error: `Higgsfield HTTP ${res.status}`, detail: data }, { status: res.ok ? 200 : res.status });
}

export async function POST(request: Request) {
  const { model, payload } = (await request.json()) as { model: string; payload: Record<string, unknown> };
  if (!model || !/^[\w.\-/]+$/.test(model)) {
    return Response.json({ error: "Identifiant de modèle invalide." }, { status: 400 });
  }
  return call(`${BASE.replace(/\/$/, "")}/${model.replace(/^\/|\/$/g, "")}`, { method: "POST", body: JSON.stringify(payload) });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[\w-]+$/.test(id)) return Response.json({ error: "request_id manquant." }, { status: 400 });
  return call(`${BASE.replace(/\/$/, "")}/requests/${id}/status`);
}

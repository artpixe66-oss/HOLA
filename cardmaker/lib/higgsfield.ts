// Appels serveur à l'API Higgsfield : les clés ne quittent jamais le serveur.
const BASE = (process.env.HF_BASE || "https://platform.higgsfield.ai").replace(/\/$/, "");
export const IMAGE_MODEL = process.env.CARD_IMAGE_MODEL || "higgsfield-ai/soul/v2/standard";

function authHeader(): string | null {
  const key = process.env.HF_API_KEY;
  const secret = process.env.HF_API_SECRET;
  return key && secret ? `Key ${key}:${secret}` : null;
}

export async function hf(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const auth = authHeader();
  if (!auth) return { ok: false, status: 500, data: { error: "HF_API_KEY et HF_API_SECRET ne sont pas configurées." } };
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, data };
}

/** Extrait l'URL de l'image, quelle que soit la forme de la réponse. */
export function findOutputUrl(data: Record<string, unknown>): string | null {
  for (const key of ["images", "image", "outputs", "results"]) {
    const v = data[key];
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    for (const item of arr) {
      const u = typeof item === "string" ? item : (item as { url?: string })?.url;
      if (u) return u;
    }
  }
  for (const key of ["image_url", "url", "output"]) {
    const v = data[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

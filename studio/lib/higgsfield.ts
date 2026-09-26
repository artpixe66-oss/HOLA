/** Extrait l'URL du résultat, quelle que soit la forme de la réponse Higgsfield. */
export function findOutputUrl(data: Record<string, unknown>): string | null {
  for (const key of ["images", "image", "video", "videos", "outputs", "results"]) {
    const v = data[key];
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    for (const item of arr) {
      const u = typeof item === "string" ? item : (item as { url?: string })?.url;
      if (u) return u;
    }
  }
  for (const key of ["image_url", "video_url", "url", "output"]) {
    const v = data[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

const FINAL = ["completed", "failed", "nsfw", "canceled", "cancelled"];

/** Lance une génération puis attend le résultat ; onStatus reçoit chaque changement d'état. */
export async function generateAndWait(model: string, payload: Record<string, unknown>, onStatus: (s: string) => void): Promise<string | null> {
  const res = await fetch("/api/higgsfield", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, payload }) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${data.error ?? "Erreur"} ${data.detail ? JSON.stringify(data.detail).slice(0, 200) : ""}`);
  const id = String(data.request_id ?? data.id ?? "");
  onStatus(String(data.status ?? "en file"));
  if (!id) return findOutputUrl(data);
  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const st = await fetch(`/api/higgsfield?id=${encodeURIComponent(id)}`);
    const body = await st.json();
    if (!st.ok) throw new Error(body.error ?? "Erreur de suivi");
    const status = String(body.status ?? "");
    onStatus(status);
    if (FINAL.includes(status)) return status === "completed" ? findOutputUrl(body) : null;
  }
  throw new Error("Délai dépassé");
}

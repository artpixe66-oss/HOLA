import { findOutputUrl, hf } from "@/lib/higgsfield";

// Renvoie l'image d'une génération terminée depuis notre propre domaine :
// le navigateur peut alors l'intégrer à la carte et l'exporter en PNG.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[\w-]{6,80}$/.test(id)) return new Response("Identifiant invalide", { status: 400 });
  const res = await hf(`requests/${id}/status`);
  if (!res.ok || res.data.status !== "completed") return new Response("Image pas prête", { status: 409 });
  const url = findOutputUrl(res.data);
  if (!url) return new Response("Image introuvable", { status: 404 });
  const img = await fetch(url, { cache: "no-store" });
  if (!img.ok || !img.body) return new Response("Téléchargement impossible", { status: 502 });
  return new Response(img.body, {
    headers: { "Content-Type": img.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}

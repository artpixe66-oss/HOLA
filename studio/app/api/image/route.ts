import { getFile } from "@/lib/blobStore";

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams.get("p") ?? "";
  if (!/^studio\/images\/[\w-]+\.(jpg|png|webp)$/.test(p)) return new Response("Chemin invalide", { status: 400 });
  const res = await getFile(p);
  if (!res || res.statusCode !== 200) return new Response("Introuvable", { status: 404 });
  return new Response(res.stream, { headers: { "Content-Type": res.blob.contentType, "Cache-Control": "private, max-age=31536000, immutable" } });
}

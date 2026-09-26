import { blobEnabled, putFile } from "@/lib/blobStore";

// Envoi d'une image de référence (déjà redimensionnée côté navigateur).
export async function POST(request: Request) {
  if (!blobEnabled()) return Response.json({ error: "Stockage en ligne non configuré." }, { status: 501 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ error: "Image attendue." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return Response.json({ error: "Image trop lourde (4 Mo max)." }, { status: 413 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const id = crypto.randomUUID().slice(0, 12);
  const saved = await putFile(`studio/images/${id}.${ext}`, file, file.type);
  // En store privé, l'image passe par /api/image (protégé par le mot de passe de l'app).
  const url = saved.access === "public" ? saved.url : `/api/image?p=${encodeURIComponent(`studio/images/${id}.${ext}`)}`;
  return Response.json({ url, access: saved.access });
}

import { blobEnabled, getFile, putFile } from "@/lib/blobStore";

// Sauvegarde de l'état complet dans le store Blob : un seul utilisateur, dernière écriture gagnante.
const PATH = "studio/state.json";

export async function GET() {
  if (!blobEnabled()) return Response.json({ enabled: false, state: null });
  const res = await getFile(PATH);
  if (!res || res.statusCode !== 200) return Response.json({ enabled: true, state: null });
  const text = await new Response(res.stream).text();
  return Response.json({ enabled: true, state: JSON.parse(text) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!blobEnabled()) return Response.json({ enabled: false }, { status: 501 });
  const body = await request.text();
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed?.contents) || !Array.isArray(parsed?.influencers)) throw new Error();
  } catch {
    return Response.json({ error: "État invalide." }, { status: 400 });
  }
  await putFile(PATH, body, "application/json");
  return Response.json({ ok: true });
}

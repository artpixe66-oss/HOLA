import { get, put } from "@vercel/blob";

// Sauvegarde de l'état complet dans un blob privé : un seul utilisateur, dernière écriture gagnante.
const PATH = "studio/state.json";
const enabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function GET() {
  if (!enabled()) return Response.json({ enabled: false, state: null });
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return Response.json({ enabled: true, state: null });
  const text = await new Response(res.stream).text();
  return Response.json({ enabled: true, state: JSON.parse(text) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!enabled()) return Response.json({ enabled: false }, { status: 501 });
  const body = await request.text();
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed?.contents) || !Array.isArray(parsed?.influencers)) throw new Error();
  } catch {
    return Response.json({ error: "État invalide." }, { status: 400 });
  }
  await put(PATH, body, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json" });
  return Response.json({ ok: true });
}

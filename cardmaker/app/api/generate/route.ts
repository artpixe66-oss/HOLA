import { IMAGE_MODEL, hf } from "@/lib/higgsfield";

// Les noms de licences connues sont refusés : on génère des créatures originales.
const BLOCKED = /pok[eé]mon|pikachu|dracaufeu|charizard|mewtwo|evoli|eevee|magic the gathering|\bmtg\b|yu-?gi-?oh|digimon|nintendo/i;

// Garde-fou provisoire tant que comptes et crédits ne sont pas branchés :
// N générations par IP et par jour (mémoire d'une instance serveur, donc approximatif).
const LIMIT = Number(process.env.FREE_GENERATIONS_PER_DAY || 3);
const usage = new Map<string, { day: string; count: number }>();

function allow(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(ip);
  if (!u || u.day !== day) {
    usage.set(ip, { day, count: 1 });
    return true;
  }
  if (u.count >= LIMIT) return false;
  u.count += 1;
  return true;
}

const STYLE = {
  creature:
    "original creature design for a collectible card game, cute but powerful, dynamic pose, vibrant colors, painterly digital illustration, detailed environment background, soft rim light",
  arcane:
    "epic dark fantasy illustration for a collectible card game, dramatic lighting, painterly, highly detailed, cinematic composition",
} as const;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { prompt?: string; template?: string };
  const prompt = (body.prompt ?? "").trim();
  const template = body.template === "arcane" ? "arcane" : "creature";
  if (prompt.length < 3 || prompt.length > 400) {
    return Response.json({ error: "Décris ta créature en 3 à 400 caractères." }, { status: 400 });
  }
  if (BLOCKED.test(prompt)) {
    return Response.json({ error: "Les personnages et marques existants ne sont pas autorisés : décris ta propre créature." }, { status: 400 });
  }
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!allow(ip)) {
    return Response.json({ error: `Limite de ${LIMIT} illustrations gratuites par jour atteinte.` }, { status: 429 });
  }

  const full = `${prompt}. ${STYLE[template]}. No text, no letters, no logo, no card frame, no border.`;
  const res = await hf(IMAGE_MODEL, {
    method: "POST",
    body: JSON.stringify({ prompt: full, aspect_ratio: template === "creature" ? "16:9" : "4:3" }),
  });
  if (!res.ok) return Response.json({ error: `Génération refusée (HTTP ${res.status}).`, detail: res.data }, { status: res.status });
  const id = String(res.data.request_id ?? res.data.id ?? "");
  if (!id) return Response.json({ error: "Réponse inattendue du service d'images.", detail: res.data }, { status: 502 });
  return Response.json({ id, status: String(res.data.status ?? "queued") });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[\w-]{6,80}$/.test(id)) return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  const res = await hf(`requests/${id}/status`);
  if (!res.ok) return Response.json({ error: `Suivi impossible (HTTP ${res.status}).` }, { status: res.status });
  return Response.json({ status: String(res.data.status ?? "") });
}

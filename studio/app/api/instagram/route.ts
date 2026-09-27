import { syncAll, tokenKeys } from "@/lib/instagram";

export const maxDuration = 300;

// Récupère les publications et statistiques de chaque compte relié (jetons IG_TOKEN_*).
export async function POST() {
  if (!tokenKeys().length) return Response.json({ enabled: false, accounts: [] });
  const accounts = await syncAll();
  return Response.json({ enabled: true, accounts }, { headers: { "Cache-Control": "no-store" } });
}

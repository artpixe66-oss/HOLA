import { blobEnabled, getFile, putFile } from "./blobStore";

// API Instagram « connexion avec Instagram » (graph.instagram.com), comptes professionnels.
// Un jeton par compte, dans des variables IG_TOKEN_<NOM>. Les jetons renouvelés sont gardés dans le stockage Blob.

const GRAPH = process.env.IG_GRAPH_BASE || "https://graph.instagram.com";
const REFRESHED_PATH = "studio/instagram-tokens.json";
const REFRESH_AFTER_MS = 20 * 86_400_000;

export interface IgPost {
  permalink: string;
  caption: string;
  publishedAt: string | null;
  mediaType: string;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows: number | null;
  avgWatchSec: number | null;
}

export interface IgAccountResult {
  key: string;
  username: string | null;
  posts: IgPost[];
  error: string | null;
}

type Refreshed = Record<string, { token: string; refreshedAt: string }>;

export function tokenKeys(): string[] {
  return Object.keys(process.env).filter((k) => k.startsWith("IG_TOKEN_") && process.env[k]);
}

async function readRefreshed(): Promise<Refreshed> {
  if (!blobEnabled()) return {};
  const res = await getFile(REFRESHED_PATH);
  if (!res || res.statusCode !== 200) return {};
  try {
    return JSON.parse(await new Response(res.stream).text()) as Refreshed;
  } catch {
    return {};
  }
}

async function ig<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Instagram HTTP ${res.status}`);
  return data as T;
}

/** Jeton à utiliser : le renouvelé s'il existe, sinon celui de Vercel ; renouvelé tous les 20 jours (il expire à 60). */
async function tokenFor(key: string, refreshed: Refreshed): Promise<{ token: string; changed: boolean }> {
  const stored = refreshed[key];
  const token = stored?.token ?? (process.env[key] as string);
  const age = stored ? Date.now() - new Date(stored.refreshedAt).getTime() : Infinity;
  if (age < REFRESH_AFTER_MS || !blobEnabled()) return { token, changed: false };
  try {
    const r = await ig<{ access_token: string }>("refresh_access_token", token, { grant_type: "ig_refresh_token" });
    refreshed[key] = { token: r.access_token, refreshedAt: new Date().toISOString() };
    return { token: r.access_token, changed: true };
  } catch {
    return { token, changed: false };
  }
}

const num = (v: unknown) => (typeof v === "number" ? v : null);

/** Statistiques d'une publication ; les métriques non disponibles pour ce type de média sont ignorées. */
async function insights(mediaId: string, token: string): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  const read = (data: { data?: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }) => {
    for (const m of data.data ?? []) out[m.name] = num(m.total_value?.value ?? m.values?.[0]?.value);
  };
  const full = ["views", "reach", "likes", "comments", "shares", "saved", "follows", "ig_reels_avg_watch_time"];
  try {
    read(await ig(`${mediaId}/insights`, token, { metric: full.join(",") }));
    return out;
  } catch {
    // une métrique refusée fait échouer tout l'appel : on les demande une par une
  }
  await Promise.all(
    full.map(async (metric) => {
      try {
        read(await ig(`${mediaId}/insights`, token, { metric }));
      } catch {
        // métrique indisponible pour ce média
      }
    }),
  );
  return out;
}

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

async function syncAccount(key: string, token: string, limit: number): Promise<IgAccountResult> {
  try {
    const me = await ig<{ username?: string }>("me", token, { fields: "user_id,username" });
    const media = await ig<{ data: MediaItem[] }>("me/media", token, {
      fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
      limit: String(limit),
    });
    const posts: IgPost[] = [];
    for (const m of media.data ?? []) {
      const s = await insights(m.id, token);
      const watchMs = s.ig_reels_avg_watch_time;
      posts.push({
        permalink: m.permalink ?? "",
        caption: (m.caption ?? "").slice(0, 300),
        publishedAt: m.timestamp ? new Date(m.timestamp).toISOString() : null,
        mediaType: m.media_product_type ?? m.media_type ?? "",
        views: s.views ?? null,
        reach: s.reach ?? null,
        likes: s.likes ?? num(m.like_count),
        comments: s.comments ?? num(m.comments_count),
        shares: s.shares ?? null,
        saves: s.saved ?? null,
        follows: s.follows ?? null,
        avgWatchSec: watchMs != null ? watchMs / 1000 : null,
      });
    }
    return { key, username: me.username ?? null, posts, error: null };
  } catch (e) {
    return { key, username: null, posts: [], error: e instanceof Error ? e.message : "Erreur Instagram" };
  }
}

export async function syncAll(limit = 30): Promise<IgAccountResult[]> {
  const keys = tokenKeys();
  const refreshed = await readRefreshed();
  let changed = false;
  const results: IgAccountResult[] = [];
  for (const key of keys) {
    const t = await tokenFor(key, refreshed);
    changed ||= t.changed;
    results.push(await syncAccount(key, t.token, limit));
  }
  if (changed) await putFile(REFRESHED_PATH, JSON.stringify(refreshed), "application/json");
  return results;
}

/** Vérifie chaque jeton sans lire les statistiques. */
export async function checkAll(): Promise<{ key: string; username: string | null; error: string | null }[]> {
  const refreshed = await readRefreshed();
  return Promise.all(
    tokenKeys().map(async (key) => {
      try {
        const me = await ig<{ username?: string }>("me", refreshed[key]?.token ?? (process.env[key] as string), { fields: "username" });
        return { key, username: me.username ?? null, error: null };
      } catch (e) {
        return { key, username: null, error: e instanceof Error ? e.message : "Erreur" };
      }
    }),
  );
}

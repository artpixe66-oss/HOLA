import { normalizeUrl } from "./analytics";
import type { PostMetrics, Store } from "./types";

/** Ajoute ou met à jour des statistiques : une publication déjà connue (même lien) est mise à jour, pas dupliquée. */
export function mergeMetrics(s: Store, incoming: PostMetrics[]): Store {
  const key = (m: PostMetrics) => (m.permalink ? normalizeUrl(m.permalink) : "");
  const existing = new Map(s.metrics.filter((m) => m.permalink).map((m) => [key(m), m]));
  const incomingKeys = new Set(incoming.map(key).filter(Boolean));
  const kept = s.metrics.filter((m) => !m.permalink || !incomingKeys.has(key(m)));
  const merged = incoming.map((m) => {
    const old = existing.get(key(m));
    return old ? { ...m, id: old.id, contentId: old.contentId, avgWatchSec: m.avgWatchSec ?? old.avgWatchSec, follows: m.follows ?? old.follows } : m;
  });
  return { ...s, metrics: [...merged, ...kept] };
}

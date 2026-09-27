"use client";

import { mergeMetrics } from "./mergeMetrics";
import { uid, update } from "./store";
import type { PostMetrics } from "./types";
import type { IgAccountResult } from "./instagram";

let running = false;

/** Récupère les stats des comptes Instagram reliés et les fusionne. Renvoie false si aucun compte n'est relié. */
export async function syncInstagram(): Promise<{ enabled: boolean; accounts: IgAccountResult[] }> {
  if (running) return { enabled: true, accounts: [] };
  running = true;
  try {
    const res = await fetch("/api/instagram", { method: "POST" });
    const data = (await res.json()) as { enabled: boolean; accounts: IgAccountResult[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
    if (!data.enabled) return data;
    const importedAt = new Date().toISOString();
    const incoming: PostMetrics[] = data.accounts.flatMap((a) =>
      a.posts
        .filter((p) => p.permalink)
        .map((p) => ({
          id: uid(),
          permalink: p.permalink,
          caption: p.caption,
          publishedAt: p.publishedAt,
          views: p.views,
          reach: p.reach,
          likes: p.likes,
          comments: p.comments,
          shares: p.shares,
          saves: p.saves,
          follows: p.follows,
          avgWatchSec: p.avgWatchSec,
          contentId: null,
          importedAt,
        })),
    );
    update((s) => ({
      ...mergeMetrics(s, incoming),
      settings: { ...s.settings, lastIgSync: importedAt, igReport: data.accounts.map((a) => ({ key: a.key, username: a.username, posts: a.posts.length, error: a.error })) },
    }));
    return data;
  } finally {
    running = false;
  }
}

"use client";

import { useSyncExternalStore } from "react";
import type { Content, CreativeAttributes, Influencer, Store } from "./types";
import { AGENT_V1 } from "./seed/agent-v1";
import { AGENT_V2 } from "./seed/agent-v2";
import { GIULIA } from "./seed/giulia";

const KEY = "studio-influence:v1";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const now = () => new Date().toISOString();

export function emptyAttributes(): CreativeAttributes {
  return { topic: "", hook: "", hookType: "", outfit: "", setting: "", format: "", durationSec: null, editing: "" };
}

export function newInfluencer(partial: Partial<Influencer> = {}): Influencer {
  return {
    id: uid(),
    name: "Nouvelle influenceuse",
    aliases: "",
    handle: "",
    niche: "",
    color: "#c8f31d",
    avatarUrl: "",
    references: [],
    anchors: "",
    voice: "",
    attitude: "",
    formats: "",
    checkpoints: "",
    notes: "",
    createdAt: now(),
    ...partial,
  };
}

export function newContent(partial: Partial<Content> = {}): Content {
  return {
    id: uid(),
    title: "Nouveau contenu",
    influencerId: null,
    inspirationId: null,
    status: "idee",
    attributes: emptyAttributes(),
    script: "",
    prompts: [],
    generations: [],
    videoUrl: "",
    scheduledAt: null,
    publishedAt: null,
    permalink: "",
    createdAt: now(),
    ...partial,
  };
}

const V2_ID = "seed-v2";
const V1_LABEL = "v1 — reverse-video-prompt";

/** Ajoute la v2 (mode viral) aux données existantes ; l'active si la version active était la v1 d'origine. */
function withSeeds(s: Store): Store {
  const existing = s.agentVersions.find((a) => a.id === V2_ID);
  // La v2 d'origine n'est jamais modifiée sur place (une modification crée une nouvelle version) : on la tient à jour.
  if (existing) return existing.instructions === AGENT_V2 ? s : { ...s, agentVersions: s.agentVersions.map((a) => (a.id === V2_ID ? { ...a, instructions: AGENT_V2 } : a)) };
  const active = s.agentVersions.find((a) => a.id === s.activeAgentVersionId);
  const v2 = { id: V2_ID, label: "v2 — mode viral", instructions: AGENT_V2, createdAt: now() };
  return { ...s, agentVersions: [v2, ...s.agentVersions], activeAgentVersionId: !active || active.label === V1_LABEL ? V2_ID : s.activeAgentVersionId };
}

function initialStore(): Store {
  const agentId = uid();
  return {
    version: 1,
    influencers: [
      newInfluencer({
        name: "Giulia",
        aliases: "Roxane Giulia Baldi, Roxane",
        handle: "roxane.riposte",
        niche: "Humour, séduction face caméra",
        color: "#c8f31d",
        ...GIULIA,
      }),
    ],
    inspirations: [],
    contents: [],
    agentVersions: [
      { id: V2_ID, label: "v2 — mode viral", instructions: AGENT_V2, createdAt: now() },
      { id: agentId, label: V1_LABEL, instructions: AGENT_V1, createdAt: now() },
    ],
    activeAgentVersionId: V2_ID,
    metrics: [],
    settings: {
      model: "claude-opus-5",
      higgsfieldModel: "bytedance/seedance-2.0/image-to-video",
      pricePerSecond: null,
      budgetCap: null,
      spent: 0,
    },
  };
}

let cache: Store | null = null;
const listeners = new Set<() => void>();

function read(): Store {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      cache = withSeeds({ ...initialStore(), ...parsed, settings: { ...initialStore().settings, ...parsed.settings } });
      if (JSON.stringify(cache.agentVersions) !== JSON.stringify(parsed.agentVersions)) persist(cache);
      return cache;
    }
  } catch {
    // stockage indisponible : on repart d'un état neuf, gardé en mémoire
  }
  cache = initialStore();
  persist(cache);
  return cache;
}

// Synchronisation avec le stockage en ligne (Vercel Blob) quand il est configuré.
export type SyncStatus = "local" | "chargement" | "synchronisé" | "envoi" | "erreur";
let syncStatus: SyncStatus = "local";
let syncStarted = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function setSync(s: SyncStatus) {
  syncStatus = s;
  listeners.forEach((l) => l());
}

function startSync() {
  if (syncStarted || typeof window === "undefined") return;
  syncStarted = true;
  setTimeout(async () => {
    try {
      setSync("chargement");
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = (await res.json()) as { enabled: boolean; state: Store | null };
      if (!data.enabled) return setSync("local");
      const local = read();
      if (data.state && (data.state.savedAt ?? "") >= (local.savedAt ?? "")) {
        cache = withSeeds({ ...initialStore(), ...data.state, settings: { ...initialStore().settings, ...data.state.settings } });
        persist(cache);
        setSync("synchronisé");
      } else {
        schedulePush(0);
      }
    } catch {
      setSync("erreur");
    }
  }, 0);
}

function schedulePush(delay = 1200) {
  if ((syncStatus === "local" || syncStatus === "chargement") && delay) return; // hors ligne ou chargement en cours
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      setSync("envoi");
      const res = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(read()) });
      setSync(res.ok ? "synchronisé" : res.status === 501 ? "local" : "erreur");
    } catch {
      setSync("erreur");
    }
  }, delay);
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => syncStatus, () => "local" as SyncStatus);
}

function persist(s: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota dépassé ou navigation privée : l'état reste en mémoire
  }
}

export function update(fn: (s: Store) => Store) {
  cache = { ...fn(read()), savedAt: new Date().toISOString() };
  persist(cache);
  listeners.forEach((l) => l());
  schedulePush();
}

export function replaceStore(s: Store) {
  update(() => s);
}

export function resetStore() {
  update(() => initialStore());
}

function subscribe(l: () => void) {
  listeners.add(l);
  startSync();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot: Store | null = null;

/** Renvoie null pendant le rendu serveur, puis l'état local. */
export function useStore(): Store | null {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}

// Helpers de mise à jour
export function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export function saveContent(c: Content) {
  update((s) => ({ ...s, contents: upsert(s.contents, c) }));
}

export function saveInfluencer(i: Influencer) {
  update((s) => ({ ...s, influencers: upsert(s.influencers, i) }));
}

/** Page d'édition d'une création : studio vidéo ou carrousel. */
export function editHref(c: { id: string; kind?: string }): string {
  return c.kind === "carousel" ? `/carrousels?id=${c.id}` : `/studio?id=${c.id}`;
}

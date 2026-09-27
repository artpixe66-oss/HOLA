"use client";

import { useEffect } from "react";
import { syncInstagram } from "@/lib/igSync";
import { useStore } from "@/lib/store";

const EVERY_MS = 12 * 3600 * 1000;

/** Synchronise Instagram en arrière-plan à l'ouverture de l'app, au plus toutes les 12 h. */
export default function InstagramAutoSync() {
  const store = useStore();
  const last = store?.settings.lastIgSync;
  const ready = store != null;
  useEffect(() => {
    if (!ready) return;
    if (last && Date.now() - new Date(last).getTime() < EVERY_MS) return;
    const t = setTimeout(() => {
      syncInstagram().catch(() => undefined);
    }, 3000);
    return () => clearTimeout(t);
  }, [ready, last]);
  return null;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSyncStatus } from "@/lib/store";
import { RoundButton } from "./ui";

export const NAV = [
  { href: "/", icon: "home", label: "Tableau de bord", title: "Tableau de bord" },
  { href: "/influenceuses", icon: "user", label: "Influenceuses", title: "Influenceuses" },
  { href: "/inspirations", icon: "spark", label: "Inspirations", title: "Inspirations" },
  { href: "/studio", icon: "wand", label: "Studio de création", title: "Studio de création" },
  { href: "/carrousels", icon: "layers", label: "Carrousels", title: "Carrousels" },
  { href: "/bibliotheque", icon: "film", label: "Bibliothèque", title: "Bibliothèque" },
  { href: "/calendrier", icon: "calendar", label: "Calendrier", title: "Calendrier" },
  { href: "/performances", icon: "chart", label: "Performances", title: "Performances" },
  { href: "/agent", icon: "brain", label: "Agent & réglages", title: "Agent & réglages" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const sync = useSyncStatus();
  const current = NAV.find((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href))) ?? NAV[0];
  return (
    <div className="min-h-screen bg-ink p-0 md:p-4">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col overflow-hidden bg-ink md:min-h-[calc(100vh-2rem)] md:rounded-[36px] md:border md:border-line">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 md:px-8 md:py-6">
          <Link href="/" className="text-2xl font-bold tracking-tight text-lime md:text-3xl">
            STUDIO
          </Link>
          <p className="hidden truncate text-2xl font-semibold md:block md:text-4xl">Visual Content Planning</p>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-2 text-xs text-muted lg:flex" title="Où sont enregistrées tes données">
              <span className={`h-2 w-2 rounded-full ${sync === "synchronisé" ? "bg-lime" : sync === "erreur" ? "bg-danger" : sync === "local" ? "bg-muted" : "animate-pulse bg-white"}`} />
              {sync === "local" ? "Données sur cet appareil" : sync === "synchronisé" ? "Sauvegardé en ligne" : sync === "erreur" ? "Erreur de sauvegarde" : "Synchronisation…"}
            </span>
            <RoundButton icon="calendar" label="Calendrier" href="/calendrier" />
            <RoundButton icon="plus" label="Nouvelle création" href="/studio?new=1" active />
          </div>
        </header>
        <div className="flex flex-1 flex-col md:flex-row">
          <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-3 overflow-x-auto border-t border-line bg-ink px-4 py-3 md:static md:order-first md:flex-col md:items-center md:gap-5 md:overflow-visible md:border-r md:border-t-0 md:px-6 md:py-8">
            {NAV.map((n) => (
              <RoundButton key={n.href} icon={n.icon} label={n.label} href={n.href} active={n === current} />
            ))}
          </nav>
          <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:py-8">
            <p className="mb-4 text-sm font-medium text-muted md:hidden">{current.title}</p>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

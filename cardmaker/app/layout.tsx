import type { Metadata } from "next";
import Link from "next/link";
import { Cinzel, Inter } from "next/font/google";
import { BRAND, SITE_URL, TAGLINE } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} — ${TAGLINE}`, template: `%s · ${BRAND}` },
  description: "Crée des cartes à collectionner personnalisées avec l'IA : créatures, fantasy, animaux, cadeaux. Effet holo et export PNG HD.",
  openGraph: { siteName: BRAND, type: "website", locale: "fr_FR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="font-display text-xl font-bold tracking-wide text-gold">{BRAND}</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/generateur/carte-monstre-ia" className="hidden text-muted hover:text-white sm:inline">Monstres</Link>
            <Link href="/generateur/carte-fantasy-personnalisee" className="hidden text-muted hover:text-white sm:inline">Fantasy</Link>
            <Link href="/creer" className="btn-gold !py-2">Créer une carte</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
        <footer className="border-t border-line py-8 text-center text-xs text-muted">
          <p>© {new Date().getFullYear()} {BRAND}. Cadres, symboles et éléments de jeu originaux.</p>
          <p className="mt-1">Les cartes créées sont des créations personnelles, sans lien avec un jeu de cartes existant.</p>
        </footer>
      </body>
    </html>
  );
}

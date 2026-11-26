import Link from "next/link";
import HoloCard from "@/components/HoloCard";
import { SHOWCASE } from "@/lib/defaults";
import { NICHES } from "@/lib/niches";

const STEPS = [
  ["1", "Décris ou importe", "Une phrase suffit : l'IA dessine ta créature. Ou importe la photo de ton chat."],
  ["2", "Règle les stats", "PV, élément, attaques, rareté… ou coût en gemmes et ATQ/DEF pour la fantasy."],
  ["3", "Télécharge", "PNG HD au format carte, avec effet holo. Prêt à imprimer ou à poster."],
];

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet">Générateur de cartes IA</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Invente ta créature.<br />
            <span className="text-gold">On en fait une carte légendaire.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Décris-la en une phrase, l&apos;IA la dessine, tu choisis ses PV et ses attaques. Effet holo, export HD, prête à imprimer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/creer" className="btn-gold !px-6 !py-3 !text-base">Créer ma carte gratuitement</Link>
            <Link href="/creer?modele=arcane" className="btn-ghost !px-6 !py-3 !text-base">Carte fantasy</Link>
          </div>
          <p className="mt-3 text-xs text-muted">Sans inscription pour commencer.</p>
        </div>
        <div className="relative mx-auto grid w-full max-w-[520px] grid-cols-[1fr_1.15fr] items-center gap-4">
          <HoloCard state={SHOWCASE[2]} className="-rotate-6" />
          <HoloCard state={SHOWCASE[1]} className="rotate-3" />
        </div>
      </section>

      <section>
        <h2 className="text-center font-display text-3xl font-bold">3 étapes, 2 minutes</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map(([n, title, text]) => (
            <div key={n} className="rounded-2xl border border-line bg-panel p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold font-bold text-black">{n}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-center font-display text-3xl font-bold">Que veux-tu créer ?</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {NICHES.map((n) => (
            <Link key={n.slug} href={`/generateur/${n.slug}`} className="group rounded-2xl border border-line bg-panel p-6 transition hover:border-gold/60">
              <h3 className="text-lg font-semibold group-hover:text-gold">{n.h1}</h3>
              <p className="mt-1 text-sm text-muted">{n.intro}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HoloCard from "@/components/HoloCard";
import { SHOWCASE } from "@/lib/defaults";
import { NICHES, findNiche } from "@/lib/niches";

export function generateStaticParams() {
  return NICHES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const niche = findNiche((await params).slug);
  if (!niche) return {};
  return { title: niche.title, description: niche.description, alternates: { canonical: `/generateur/${niche.slug}` } };
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const niche = findNiche((await params).slug);
  if (!niche) notFound();
  const sample = niche.template === "arcane" ? SHOWCASE[2] : SHOWCASE[1];
  const href = `/creer?modele=${niche.template}&prompt=${encodeURIComponent(niche.prompt)}`;
  return (
    <div className="grid items-center gap-10 pt-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h1 className="font-display text-4xl font-bold leading-tight">{niche.h1}</h1>
        <p className="mt-4 text-lg text-muted">{niche.intro}</p>
        <ul className="mt-6 space-y-2">
          {niche.points.map((p) => (
            <li key={p} className="flex gap-2"><span className="text-gold">◆</span>{p}</li>
          ))}
        </ul>
        <div className="mt-8 rounded-2xl border border-line bg-panel p-5">
          <p className="label">Exemple de description</p>
          <p className="italic">« {niche.prompt} »</p>
          <Link href={href} className="btn-gold mt-4">Essayer avec cette idée</Link>
        </div>
      </div>
      <HoloCard state={sample} className="mx-auto w-full max-w-[380px]" />
    </div>
  );
}

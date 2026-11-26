import type { TemplateId } from "./types";

export interface Niche {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  template: TemplateId;
  prompt: string;
  points: string[];
}

// Une page par intention de recherche : c'est la base de l'acquisition SEO.
export const NICHES: Niche[] = [
  {
    slug: "carte-monstre-ia",
    title: "Créer une carte de monstre avec l'IA",
    description: "Invente ta créature, l'IA la dessine et la place dans une carte à collectionner avec PV, attaques et effet holo. Export PNG HD.",
    h1: "Crée ta carte de monstre avec l'IA",
    intro: "Décris une créature en une phrase : l'IA dessine l'illustration et tu règles ses PV, son élément et ses attaques.",
    template: "creature",
    prompt: "un petit dragon de cristal bleu qui crache des étincelles, dans une grotte lumineuse",
    points: ["9 éléments : Feu, Eau, Plante, Foudre, Psy…", "Stades d'évolution, pouvoir et 3 attaques", "Effet holo et export prêt à imprimer"],
  },
  {
    slug: "carte-fantasy-personnalisee",
    title: "Carte fantasy personnalisée : sorts, dragons, héros",
    description: "Crée une carte de jeu fantasy : coût en gemmes, ligne de type, capacités et ATQ/DEF. Illustration générée par IA.",
    h1: "Crée ta carte fantasy personnalisée",
    intro: "Dragons, sorciers, artefacts : compose ta carte avec un coût en gemmes, des capacités et une illustration épique.",
    template: "arcane",
    prompt: "une sorcière des glaces sur un pic enneigé, aurores boréales",
    points: ["6 arcanes et leurs couleurs de cadre", "Coût en gemmes, ATQ/DEF", "Idéal pour un jeu fait maison ou un prototype"],
  },
  {
    slug: "carte-animal-de-compagnie",
    title: "Transforme ton animal en carte à collectionner",
    description: "Importe la photo de ton chien ou ton chat et transforme-le en carte à collectionner légendaire. Cadeau original en 2 minutes.",
    h1: "Ton chien ou ton chat en carte légendaire",
    intro: "Importe une photo de ton animal, donne-lui des PV et une attaque signature : la carte est prête à imprimer ou à partager.",
    template: "creature",
    prompt: "un chat roux majestueux entouré d'une aura de feu, style illustration de jeu de cartes",
    points: ["Import de photo ou illustration IA", "Rareté légendaire et effet holo", "Parfait pour un cadeau ou un post Instagram"],
  },
  {
    slug: "carte-cadeau-personnalisee",
    title: "Carte à collectionner personnalisée : idée cadeau",
    description: "Une carte à collectionner à l'effigie d'un proche : anniversaire, fête des pères, EVJF. Crée-la en ligne et imprime-la.",
    h1: "Une carte à collectionner à offrir",
    intro: "Anniversaire, fête des pères, pot de départ : transforme un proche en créature légendaire avec ses vrais « pouvoirs ».",
    template: "creature",
    prompt: "un héros jovial en armure dorée qui tient une tasse de café fumante, ambiance épique",
    points: ["Attaques et pouvoirs inside-jokes", "Export HD au format carte 63 × 88 mm", "Prête en 2 minutes"],
  },
];

export const findNiche = (slug: string) => NICHES.find((n) => n.slug === slug);

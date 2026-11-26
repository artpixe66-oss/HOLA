import type { CardState, TemplateId } from "./types";

export const DEFAULT_CARD: CardState = {
  template: "creature",
  image: null,
  illustrator: "Toi + IA",
  setNumber: "001/150",
  rarity: "rare",
  holo: "illustration",
  creature: {
    name: "Braisillon",
    stage: "base",
    evolvesFrom: "",
    hp: 70,
    element: "feu",
    info: "Créature Étincelle · Taille 0,4 m · Poids 6,2 kg",
    power: null,
    attacks: [
      { cost: ["feu"], name: "Flammèche", damage: "20", text: "" },
      { cost: ["feu", "neutre"], name: "Queue ardente", damage: "50", text: "Lance une pièce. Si c'est face, la créature adverse est brûlée." },
    ],
    weakness: "eau",
    resistance: null,
    retreat: 1,
    flavor: "Sa queue s'allume quand il est content. Les nuits froides, il dort roulé autour de sa flamme.",
  },
  arcane: {
    name: "Wyrm des cendres",
    arcane: "braise",
    cost: "3BB",
    typeLine: "Créature — Dragon ancien",
    rules: "Vol\nQuand le Wyrm des cendres arrive en jeu, il inflige 2 blessures à chaque autre créature.",
    flavor: "« Il ne brûle pas les forêts. Il se souvient de l'époque où elles étaient des cendres. »",
    attack: "5",
    defense: "5",
  },
};

export function cardFor(template: TemplateId): CardState {
  return { ...structuredClone(DEFAULT_CARD), template };
}

/** Exemples montrés sur la page d'accueil. */
export const SHOWCASE: CardState[] = [
  { ...DEFAULT_CARD, holo: "carte" },
  {
    ...DEFAULT_CARD,
    rarity: "legendaire",
    setNumber: "042/150",
    creature: {
      ...DEFAULT_CARD.creature,
      name: "Abyssaure",
      stage: "evo2",
      evolvesFrom: "Marinelle",
      hp: 180,
      element: "eau",
      info: "Créature des Profondeurs · Taille 9,1 m · Poids 410 kg",
      power: { name: "Marée montante", text: "Une fois par tour, tu peux déplacer une énergie Eau de ton banc vers cette créature." },
      attacks: [{ cost: ["eau", "eau", "neutre"], name: "Vortex abyssal", damage: "150", text: "Défausse 2 énergies de cette créature." }],
      weakness: "foudre",
      resistance: "feu",
      retreat: 3,
      flavor: "Les marins jurent l'avoir vu soulever une vague plus haute qu'un phare.",
    },
  },
  { ...DEFAULT_CARD, template: "arcane", rarity: "legendaire", setNumber: "ARC · 007/250", holo: "illustration" },
];

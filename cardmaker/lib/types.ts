export type ElementId = "feu" | "eau" | "plante" | "foudre" | "psy" | "roche" | "ombre" | "acier" | "neutre";
export type ArcaneId = "solaire" | "abysse" | "neant" | "braise" | "sylve" | "artefact";
export type TemplateId = "creature" | "arcane";
export type HoloMode = "aucun" | "illustration" | "carte";
export type Rarity = "commune" | "peu-commune" | "rare" | "legendaire";
export type BorderId = "argent" | "or" | "noir" | "blanc" | "arc-en-ciel";

export interface Attack {
  cost: ElementId[];
  name: string;
  damage: string;
  text: string;
}

export interface CreatureData {
  name: string;
  stage: "base" | "evo1" | "evo2";
  evolvesFrom: string;
  hp: number;
  element: ElementId;
  info: string;
  power: { name: string; text: string } | null;
  attacks: Attack[];
  weakness: ElementId | null;
  resistance: ElementId | null;
  retreat: number;
  flavor: string;
  border: BorderId;
  /** Illustration sur toute la carte, textes posés sur un voile. */
  fullArt: boolean;
}

export interface ArcaneData {
  name: string;
  arcane: ArcaneId;
  /** Ex. "2SS" : chiffres = coût neutre, lettres = gemmes (S solaire, A abysse, N néant, B braise, V sylve). */
  cost: string;
  typeLine: string;
  rules: string;
  flavor: string;
  attack: string;
  defense: string;
  border: BorderId;
}

export interface CardState {
  template: TemplateId;
  image: string | null;
  illustrator: string;
  setNumber: string;
  rarity: Rarity;
  holo: HoloMode;
  creature: CreatureData;
  arcane: ArcaneData;
}

import type { ArcaneId, ElementId, Rarity } from "./types";

export interface ElementDef {
  label: string;
  color: string;
  light: string;
  dark: string;
  /** Pictogramme dessiné dans une boîte 24×24. */
  glyph: string;
}

export const ELEMENTS: Record<ElementId, ElementDef> = {
  feu: { label: "Feu", color: "#e8492f", light: "#ffd2b8", dark: "#8f2414", glyph: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 3 1 4 2 4 0-3-1-6 1-9z" },
  eau: { label: "Eau", color: "#2f8fe8", light: "#c6e3ff", dark: "#13508c", glyph: "M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" },
  plante: { label: "Plante", color: "#3fae4f", light: "#cdf0c8", dark: "#1d6628", glyph: "M4 20C4 10 10 4 20 4c0 10-6 16-16 16zM6 18l9-9" },
  foudre: { label: "Foudre", color: "#f2c230", light: "#fff1b8", dark: "#9a7409", glyph: "M13 2L4 14h7l-2 8 9-12h-7l2-8z" },
  psy: { label: "Psy", color: "#a24fd6", light: "#ead2fb", dark: "#5d2087", glyph: "M12 5c5 0 9 4 10 7-1 3-5 7-10 7S3 15 2 12c1-3 5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  roche: { label: "Roche", color: "#a0733f", light: "#ecd9bd", dark: "#5c3e1b", glyph: "M2 20l7-12 4 6 3-4 6 10z" },
  ombre: { label: "Ombre", color: "#4b4366", light: "#d4cfe6", dark: "#221d33", glyph: "M15 3a9 9 0 1 0 6 15A8 8 0 0 1 15 3z" },
  acier: { label: "Acier", color: "#7f8d9a", light: "#e1e7ec", dark: "#3d4852", glyph: "M12 2l8.7 5v10L12 22l-8.7-5V7zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  neutre: { label: "Neutre", color: "#b9a888", light: "#f2ecdf", dark: "#6c5f45", glyph: "M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" },
};

export const ELEMENT_IDS = Object.keys(ELEMENTS) as ElementId[];

export interface ArcaneDef {
  label: string;
  letter: string;
  frame: string;
  light: string;
  gem: string;
}

export const ARCANES: Record<ArcaneId, ArcaneDef> = {
  solaire: { label: "Solaire", letter: "S", frame: "#cfa94f", light: "#f6ecd0", gem: "#f4d774" },
  abysse: { label: "Abysse", letter: "A", frame: "#3f74b4", light: "#d9e6f4", gem: "#5aa2f0" },
  neant: { label: "Néant", letter: "N", frame: "#4a3b5c", light: "#ded6e6", gem: "#8e6bb8" },
  braise: { label: "Braise", letter: "B", frame: "#b8452f", light: "#f4dcd2", gem: "#f0714f" },
  sylve: { label: "Sylve", letter: "V", frame: "#47804a", light: "#dbead6", gem: "#6cc46a" },
  artefact: { label: "Artefact", letter: "", frame: "#8a9096", light: "#e6e8ea", gem: "#b8bec4" },
};

export const ARCANE_IDS = Object.keys(ARCANES) as ArcaneId[];

export const RARITIES: Record<Rarity, { label: string; color: string }> = {
  commune: { label: "Commune", color: "#2a2a2a" },
  "peu-commune": { label: "Peu commune", color: "#b9c2cc" },
  rare: { label: "Rare", color: "#e3b53c" },
  legendaire: { label: "Légendaire", color: "#ff6a3d" },
};

/** "2SS" -> { generic: 2, gems: ["solaire", "solaire"] } */
export function parseCost(cost: string): { generic: number; gems: ArcaneId[] } {
  const generic = Number((cost.match(/\d+/) ?? ["0"])[0]);
  const gems: ArcaneId[] = [];
  for (const ch of cost.toUpperCase().replace(/\d/g, "")) {
    const id = ARCANE_IDS.find((a) => ARCANES[a].letter === ch);
    if (id) gems.push(id);
  }
  return { generic: Math.min(generic, 99), gems: gems.slice(0, 6) };
}

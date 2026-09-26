import type { CreativeAttributes, Store } from "./types";

export type VocabKey = "topic" | "hookType" | "outfit" | "setting" | "format" | "editing";
export const VOCAB_KEYS: VocabKey[] = ["topic", "hookType", "format", "setting", "outfit", "editing"];

/** Clé de comparaison : casse, accents et espaces ignorés. */
export function vocabKey(v: string): string {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Valeurs utilisées pour un attribut, avec leur nombre d'utilisations, les plus fréquentes d'abord. */
export function vocabValues(store: Store, key: VocabKey): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of store.contents) {
    const v = String(c.attributes[key] ?? "").trim();
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Si une valeur équivalente existe déjà, on reprend son orthographe pour ne pas créer de doublon. */
export function canonicalValue(store: Store, key: VocabKey, value: string): string {
  const v = value.trim();
  if (!v) return "";
  const k = vocabKey(v);
  return vocabValues(store, key).find((x) => vocabKey(x.value) === k)?.value ?? v;
}

/** Groupes de valeurs qui ne diffèrent que par la casse, les accents ou la ponctuation. */
export function likelyDuplicates(store: Store, key: VocabKey): string[][] {
  const groups = new Map<string, string[]>();
  for (const { value } of vocabValues(store, key)) {
    const k = vocabKey(value);
    groups.set(k, [...(groups.get(k) ?? []), value]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

export function mergeValues(store: Store, key: VocabKey, from: string[], to: string): Store {
  const target = to.trim();
  const set = new Set(from);
  return {
    ...store,
    contents: store.contents.map((c) =>
      set.has(String(c.attributes[key] ?? "").trim()) ? { ...c, attributes: { ...c.attributes, [key]: target } as CreativeAttributes } : c,
    ),
  };
}

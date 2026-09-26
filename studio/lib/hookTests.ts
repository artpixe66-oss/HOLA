import { buildRows, fmtRel, type PostRow } from "./analytics";
import type { Content, HookTest, Store } from "./types";

export type TestState = "preparation" | "en_cours" | "attente_stats" | "gagnant" | "egalite";

export interface TestResult {
  test: HookTest;
  a: Content | null;
  b: Content | null;
  rowA: PostRow | null;
  rowB: PostRow | null;
  state: TestState;
  winner: "A" | "B" | null;
  summary: string;
}

const HOURS_48 = 48 * 3600 * 1000;

/**
 * Verdict d'un test A/B. Un écart de vues n'est retenu que s'il dépasse 20 %
 * et que la rétention ne dit pas le contraire : sinon on parle d'égalité.
 */
export function evaluateTest(store: Store, test: HookTest): TestResult {
  const [a, b] = test.contentIds.map((id) => store.contents.find((c) => c.id === id) ?? null);
  const rows = buildRows(store);
  const rowA = rows.find((r) => r.content?.id === a?.id) ?? null;
  const rowB = rows.find((r) => r.content?.id === b?.id) ?? null;
  const base = { test, a, b, rowA, rowB, winner: null };
  if (!a || !b) return { ...base, state: "preparation", summary: "Une des deux versions a été supprimée." };
  if (a.status !== "publie" || b.status !== "publie") {
    const pending = [a.status !== "publie" ? "A" : null, b.status !== "publie" ? "B" : null].filter(Boolean);
    const summary = pending.length > 1 ? "Versions A et B pas encore publiées." : `Version ${pending[0]} pas encore publiée.`;
    return { ...base, state: a.status === "publie" || b.status === "publie" ? "en_cours" : "preparation", summary };
  }
  const old = (c: Content) => c.publishedAt && Date.now() - new Date(c.publishedAt).getTime() >= HOURS_48;
  if (!rowA || !rowB || !old(a) || !old(b)) return { ...base, state: "attente_stats", summary: "Verdict quand les deux versions ont au moins 48 h de statistiques importées." };
  const ratio = rowB.views && rowA.views ? rowB.views / rowA.views : 1;
  const retA = rowA.retention;
  const retB = rowB.retention;
  let winner: "A" | "B" | null = null;
  if (ratio >= 1.2 && !(retA != null && retB != null && retB < retA * 0.9)) winner = "B";
  else if (ratio <= 1 / 1.2 && !(retA != null && retB != null && retA < retB * 0.9)) winner = "A";
  const retTxt = retA != null && retB != null ? ` · rétention ${Math.round(retA * 100)} % contre ${Math.round(retB * 100)} %` : "";
  return {
    ...base,
    state: winner ? "gagnant" : "egalite",
    winner,
    summary: winner ? `Version ${winner} devant : B fait ${fmtRel(ratio)} les vues de A${retTxt}.` : `Écart trop faible pour conclure (B = ${fmtRel(ratio)} A)${retTxt}.`,
  };
}

export function allTests(store: Store): TestResult[] {
  return (store.hookTests ?? []).map((t) => evaluateTest(store, t));
}

/** Cumul par type d'accroche : une tendance seulement à partir de 3 tests conclus. */
export function hookTypeTally(results: TestResult[]) {
  const tally = new Map<string, { wins: number; losses: number; ties: number }>();
  const bump = (type: string | undefined, key: "wins" | "losses" | "ties") => {
    const k = (type ?? "").trim();
    if (!k) return;
    const t = tally.get(k) ?? { wins: 0, losses: 0, ties: 0 };
    t[key]++;
    tally.set(k, t);
  };
  for (const r of results) {
    if (r.state === "gagnant") {
      bump((r.winner === "A" ? r.a : r.b)?.attributes.hookType, "wins");
      bump((r.winner === "A" ? r.b : r.a)?.attributes.hookType, "losses");
    } else if (r.state === "egalite") {
      bump(r.a?.attributes.hookType, "ties");
      bump(r.b?.attributes.hookType, "ties");
    }
  }
  return [...tally.entries()].map(([type, t]) => ({ type, ...t, played: t.wins + t.losses + t.ties, trend: t.wins + t.losses + t.ties >= 3 }));
}


"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Empty, Field, Loading, PageHeader, StatCard, Tabs } from "@/components/ui";
import { buildRows, DIMENSIONS, fmtNum, fmtPct, fmtRel, groupStats, median, recommendations, VERDICT_LABEL, type GroupStat, type PostRow, type Verdict } from "@/lib/analytics";
import { detectColumns, FIELD_LABELS, parseCsv, rowsToMetrics, type MetricField } from "@/lib/csv";
import { withDemo, withoutDemo } from "@/lib/demo";
import { uid, update, useStore } from "@/lib/store";
import type { PostMetrics, Store } from "@/lib/types";

type Tab = "synthese" | "comparer" | "publications" | "importer";

export default function PerformancesPage() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("synthese");
  const [influencerId, setInfluencerId] = useState("");
  const rows = useMemo(() => (store ? buildRows(store, influencerId || null) : []), [store, influencerId]);
  const stats = useMemo(() => groupStats(rows), [rows]);
  if (!store) return <Loading />;
  const hasDemo = store.metrics.some((m) => m.demo);

  return (
    <div>
      <PageHeader
        title="Performances"
        subtitle="Créer → publier → mesurer → améliorer. Chaque publication est comparée à la médiane du compte ; un écart ne devient une règle que s'il se répète."
        actions={<>
          <select className="input w-auto" value={influencerId} onChange={(e) => setInfluencerId(e.target.value)}>
            <option value="">Tout le compte</option>
            {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {hasDemo && <Button tone="danger" small onClick={() => update(withoutDemo)}>Retirer l&apos;exemple</Button>}
        </>}
      />
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} options={[{ id: "synthese", label: "Synthèse" }, { id: "comparer", label: "Comparer" }, { id: "publications", label: "Publications" }, { id: "importer", label: "Importer" }]} />
      </div>
      {tab !== "importer" && !rows.length ? (
        <Empty
          title="Aucune statistique pour l'instant"
          action={<div className="flex gap-2"><Button tone="lime" icon="upload" onClick={() => setTab("importer")}>Importer un export</Button><Button tone="ghost" onClick={() => update(withDemo)}>Charger un exemple</Button></div>}
        >
          Exporte les statistiques de tes Reels depuis Meta Business Suite (Insights → Contenu → Exporter) ou saisis-les à la main.
        </Empty>
      ) : tab === "synthese" ? (
        <Synthesis rows={rows} stats={stats} />
      ) : tab === "comparer" ? (
        <Compare stats={stats} />
      ) : tab === "publications" ? (
        <Posts rows={rows} store={store} />
      ) : (
        <Import store={store} onDone={() => setTab("publications")} />
      )}
    </div>
  );
}

function Synthesis({ rows, stats }: { rows: PostRow[]; stats: GroupStat[] }) {
  const recs = recommendations(rows, stats);
  const sorted = [...rows].filter((r) => r.metrics.publishedAt).sort((a, b) => (a.metrics.publishedAt! < b.metrics.publishedAt! ? -1 : 1));
  const med = median(rows.map((r) => r.views));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="lime" title="Vues médianes" value={fmtNum(med)} caption={`${rows.length} publications`} />
        <StatCard tone="white" title="Engagement médian" value={fmtPct(median(rows.map((r) => r.engagementRate ?? NaN)))} caption="interactions / portée" />
        <StatCard tone="dark" title="Enregistrements" value={fmtPct(median(rows.map((r) => r.saveRate ?? NaN)))} caption="médiane, le signal le plus fiable de valeur" />
        <StatCard tone="dark" title="Abonnements" value={fmtNum(rows.reduce((a, r) => a + (r.metrics.follows ?? 0), 0))} caption={`${median(rows.map((r) => r.followsPer1k ?? NaN))?.toFixed(1).replace(".", ",") ?? "—"} pour 1 000 comptes touchés`} />
      </div>

      {sorted.length > 1 && (
        <Card>
          <h3 className="font-semibold">Vues par publication</h3>
          <p className="mb-4 text-xs text-muted">La ligne pointillée est la médiane du compte. Survole une barre pour le détail.</p>
          <ViewsChart rows={sorted} median={med ?? 0} />
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-lg font-semibold">Recommandations</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {recs.map((r, i) => (
            <div key={i} className={`rounded-[24px] p-5 ${r.kind === "reproduire" ? "bg-lime text-black" : r.kind === "eviter" ? "bg-surface-2" : r.kind === "tester" ? "bg-white text-black" : "bg-surface"}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{{ reproduire: "Reproduire", tester: "Tester", eviter: "Retravailler", creneau: "Créneau", donnees: "Données" }[r.kind]}</p>
              <p className="mt-1 font-semibold">{r.title}</p>
              <p className="mt-1 text-sm opacity-75">{r.detail}</p>
            </div>
          ))}
          {!recs.length && <p className="text-sm text-muted">Rien de marquant : tes publications sont proches de la médiane. Varie un seul élément à la fois pour faire apparaître des écarts.</p>}
        </div>
        <p className="mt-4 text-sm text-muted">Ces enseignements sont transmis automatiquement à l&apos;agent quand tu lui demandes des idées ou un prompt dans le <Link href="/studio" className="text-lime">studio</Link>.</p>
      </div>
    </div>
  );
}

function ViewsChart({ rows, median }: { rows: PostRow[]; median: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...rows.map((r) => r.views), median, 1);
  const H = 220;
  return (
    <div className="relative">
      <div className="relative flex items-end gap-[2px] border-b border-surface-2" style={{ height: H }}>
        <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-white/40" style={{ bottom: (median / max) * H }}>
          <span className="absolute -top-5 left-0 text-xs text-muted">médiane {fmtNum(median)}</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.metrics.id} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className={`w-full rounded-t-[4px] transition ${hover === i ? "bg-white" : "bg-lime"}`} style={{ height: Math.max(2, (r.views / max) * H) }} />
          </div>
        ))}
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 w-56 rounded-2xl bg-white p-3 text-xs text-black shadow-lg" style={{ left: `min(calc(${((hover + 0.5) / rows.length) * 100}% - 7rem), calc(100% - 14rem))` }}>
          <p className="font-semibold">{rows[hover].content?.title ?? (rows[hover].metrics.caption.slice(0, 50) || "Publication")}</p>
          <p className="text-black/60">{new Date(rows[hover].metrics.publishedAt!).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          <p className="mt-1">{fmtNum(rows[hover].views)} vues · {fmtRel(rows[hover].relViews)} la médiane</p>
          <p>Enregistrements {fmtPct(rows[hover].saveRate)} · partages {fmtPct(rows[hover].shareRate)}</p>
        </div>
      )}
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{new Date(rows[0].metrics.publishedAt!).toLocaleDateString("fr-FR")}</span>
        <span>{new Date(rows[rows.length - 1].metrics.publishedAt!).toLocaleDateString("fr-FR")}</span>
      </div>
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, string> = {
  solide: "bg-lime text-black",
  prometteur: "bg-white text-black",
  neutre: "bg-surface-2 text-white",
  a_eviter: "bg-violet text-white",
  faible_negatif: "border border-violet text-white",
  insuffisant: "border border-surface-2 text-muted",
};

function Compare({ stats }: { stats: GroupStat[] }) {
  const [dim, setDim] = useState(DIMENSIONS[0].key);
  const list = stats.filter((s) => s.attribute === dim).sort((a, b) => (b.medianRelViews ?? 0) - (a.medianRelViews ?? 0));
  const max = Math.max(2, ...list.map((s) => s.medianRelViews ?? 0));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {DIMENSIONS.map((d) => (
          <button key={d.key} onClick={() => setDim(d.key)} className={`rounded-full px-4 py-2 text-sm font-medium ${dim === d.key ? "bg-white text-black" : "bg-surface text-muted hover:text-white"}`}>{d.label}</button>
        ))}
      </div>
      <Card>
        <p className="mb-5 text-sm text-muted">Vues médianes de chaque groupe, rapportées à la médiane du compte (×1). « Signal solide » : au moins 4 posts, dont assez au-dessus de la médiane pour que le hasard l&apos;explique mal (test de signe, p ≤ 0,11).</p>
        {!list.length && <p className="text-sm text-muted">Aucune donnée pour cet attribut. Remplis la fiche créative des contenus et relie-les à leurs publications.</p>}
        <div className="space-y-4">
          {list.map((s) => (
            <div key={s.value} className="grid items-center gap-3 md:grid-cols-[200px_1fr_200px]">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.value}</p>
                <p className="text-xs text-muted">{s.n} post(s) · {s.aboveMedian}/{s.n} au-dessus · engagement {fmtPct(s.medianEngagement)}</p>
              </div>
              <div className="relative h-8 rounded-full bg-surface-2">
                <div className="absolute inset-y-0 w-0.5 bg-white/50" style={{ left: `${(1 / max) * 100}%` }} title="médiane du compte" />
                <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, ((s.medianRelViews ?? 0) / max) * 100)}%` }} />
                <span className="absolute inset-y-0 right-3 grid place-items-center text-xs font-semibold">{fmtRel(s.medianRelViews)}</span>
              </div>
              <span className={`justify-self-start rounded-full px-3 py-1 text-xs font-semibold md:justify-self-end ${VERDICT_STYLE[s.verdict]}`}>{VERDICT_LABEL[s.verdict]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Posts({ rows, store }: { rows: PostRow[]; store: Store }) {
  const link = (m: PostMetrics, contentId: string) => {
    update((s) => ({
      ...s,
      metrics: s.metrics.map((x) => (x.id === m.id ? { ...x, contentId: contentId || null } : x)),
      contents: s.contents.map((c) => (c.id === contentId ? { ...c, status: "publie", permalink: c.permalink || m.permalink, publishedAt: c.publishedAt ?? m.publishedAt } : c)),
    }));
  };
  const sorted = [...rows].sort((a, b) => (b.metrics.publishedAt ?? "") > (a.metrics.publishedAt ?? "") ? 1 : -1);
  return (
    <div className="overflow-x-auto rounded-[28px] bg-surface">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="text-left text-xs uppercase text-muted">
          <tr>{["Publication", "Création liée", "Vues", "vs médiane", "Engagement", "Enreg.", "Partages", "Abonnés", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.metrics.id} className="border-t border-line">
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate font-medium">{r.metrics.caption || "Sans légende"}</p>
                <p className="text-xs text-muted">{r.metrics.publishedAt ? new Date(r.metrics.publishedAt).toLocaleDateString("fr-FR") : "—"} {r.metrics.permalink && <a className="text-lime" href={r.metrics.permalink} target="_blank" rel="noreferrer">voir</a>}</p>
              </td>
              <td className="px-4 py-3">
                <select className="input py-1.5 text-xs" value={r.content?.id ?? ""} onChange={(e) => link(r.metrics, e.target.value)}>
                  <option value="">— non reliée —</option>
                  {store.contents.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 font-semibold">{fmtNum(r.views)}</td>
              <td className={`px-4 py-3 ${r.relViews != null && r.relViews >= 1.2 ? "text-lime" : ""}`}>{fmtRel(r.relViews)}</td>
              <td className="px-4 py-3">{fmtPct(r.engagementRate)}</td>
              <td className="px-4 py-3">{fmtPct(r.saveRate)}</td>
              <td className="px-4 py-3">{fmtPct(r.shareRate)}</td>
              <td className="px-4 py-3">{fmtNum(r.metrics.follows)}</td>
              <td className="px-4 py-3"><Button small tone="danger" icon="trash" onClick={() => update((s) => ({ ...s, metrics: s.metrics.filter((x) => x.id !== r.metrics.id) }))} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Import({ store, onDone }: { store: Store; onDone: () => void }) {
  const [table, setTable] = useState<string[][] | null>(null);
  const [columns, setColumns] = useState<Partial<Record<MetricField, number>>>({});
  const [manual, setManual] = useState({ permalink: "", caption: "", publishedAt: "", views: "", reach: "", likes: "", comments: "", shares: "", saves: "", follows: "", contentId: "" });

  const onFile = async (file: File) => {
    const rows = parseCsv(await file.text());
    setTable(rows);
    setColumns(detectColumns(rows[0] ?? []));
  };

  const doImport = () => {
    if (!table) return;
    const incoming = rowsToMetrics(table.slice(1), columns, uid);
    update((s) => {
      // une publication déjà importée (même lien) est mise à jour, pas dupliquée
      const byLink = new Map(s.metrics.filter((m) => m.permalink).map((m) => [m.permalink, m]));
      const kept = s.metrics.filter((m) => !m.permalink || !incoming.some((x) => x.permalink === m.permalink));
      const merged = incoming.map((m) => ({ ...m, id: byLink.get(m.permalink)?.id ?? m.id, contentId: byLink.get(m.permalink)?.contentId ?? null }));
      return { ...s, metrics: [...merged, ...kept] };
    });
    setTable(null);
    onDone();
  };

  const num = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);
  const addManual = () => {
    const m: PostMetrics = {
      id: uid(),
      permalink: manual.permalink.trim(),
      caption: manual.caption.trim(),
      publishedAt: manual.publishedAt ? new Date(manual.publishedAt).toISOString() : null,
      views: num(manual.views), reach: num(manual.reach), likes: num(manual.likes), comments: num(manual.comments), shares: num(manual.shares), saves: num(manual.saves), follows: num(manual.follows),
      avgWatchSec: null,
      contentId: manual.contentId || null,
      importedAt: new Date().toISOString(),
    };
    update((s) => ({ ...s, metrics: [m, ...s.metrics] }));
    setManual({ ...manual, permalink: "", caption: "", views: "", reach: "", likes: "", comments: "", shares: "", saves: "", follows: "", contentId: "" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">Importer un export CSV</h3>
        <p className="text-sm text-muted">Meta Business Suite → Insights → Contenu → Exporter les données. Les colonnes (anglais ou français) sont reconnues automatiquement ; vérifie la correspondance avant d&apos;importer. Réimporter met à jour les publications existantes.</p>
        <input type="file" accept=".csv,text/csv" className="input" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {table && (
          <>
            <p className="text-sm">{table.length - 1} ligne(s) détectée(s).</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(FIELD_LABELS) as MetricField[]).map((f) => (
                <Field key={f} label={FIELD_LABELS[f]}>
                  <select className="input py-1.5 text-xs" value={columns[f] ?? ""} onChange={(e) => setColumns({ ...columns, [f]: e.target.value === "" ? undefined : Number(e.target.value) })}>
                    <option value="">— ignorer —</option>
                    {table[0].map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </Field>
              ))}
            </div>
            <Button tone="lime" icon="upload" disabled={columns.views == null && columns.reach == null} onClick={doImport}>Importer {table.length - 1} publication(s)</Button>
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Saisie manuelle</h3>
        <p className="text-sm text-muted">Pour une publication isolée, depuis les statistiques de l&apos;application Instagram.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Création" className="sm:col-span-2">
            <select className="input" value={manual.contentId} onChange={(e) => setManual({ ...manual, contentId: e.target.value })}>
              <option value="">— non reliée —</option>
              {store.contents.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="Lien" className="sm:col-span-2"><input className="input" value={manual.permalink} onChange={(e) => setManual({ ...manual, permalink: e.target.value })} /></Field>
          <Field label="Légende"><input className="input" value={manual.caption} onChange={(e) => setManual({ ...manual, caption: e.target.value })} /></Field>
          <Field label="Publiée le"><input className="input" type="datetime-local" value={manual.publishedAt} onChange={(e) => setManual({ ...manual, publishedAt: e.target.value })} /></Field>
          {(["views", "reach", "likes", "comments", "shares", "saves", "follows"] as const).map((k) => (
            <Field key={k} label={FIELD_LABELS[k]}><input className="input" inputMode="numeric" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} /></Field>
          ))}
        </div>
        <Button tone="white" icon="plus" disabled={!manual.views && !manual.reach} onClick={addManual}>Ajouter</Button>
      </Card>
    </div>
  );
}

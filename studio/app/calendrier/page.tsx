"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Loading, PageHeader } from "@/components/ui";
import { buildRows, fmtNum } from "@/lib/analytics";
import { saveContent, useStore, editHref } from "@/lib/store";
import { STATUSES, type Content } from "@/lib/types";

const WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const dateOf = (c: Content) => c.scheduledAt ?? c.publishedAt;

export default function CalendarPage() {
  const store = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [dragId, setDragId] = useState<string | null>(null);
  if (!store) return <Loading />;

  const rows = buildRows(store);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = new Date();

  const onDay = (d: number) => store.contents.filter((c) => { const iso = dateOf(c); if (!iso) return false; const x = new Date(iso); return x.getFullYear() === year && x.getMonth() === month && x.getDate() === d; });
  const unscheduled = store.contents.filter((c) => !dateOf(c) && c.status !== "publie");

  // Suggestion de créneau : l'heure des publications qui performent le mieux
  const best = [...rows].filter((r) => r.metrics.publishedAt && r.relViews != null).sort((a, b) => (b.relViews ?? 0) - (a.relViews ?? 0)).slice(0, 5);
  const bestHour = best.length ? Math.round(best.reduce((a, r) => a + new Date(r.metrics.publishedAt!).getHours(), 0) / best.length) : 19;

  const drop = (d: number) => {
    const c = store.contents.find((x) => x.id === dragId);
    if (!c || c.status === "publie") return;
    const prev = c.scheduledAt ? new Date(c.scheduledAt) : null;
    const date = new Date(year, month, d, prev?.getHours() ?? bestHour, prev?.getMinutes() ?? 0);
    saveContent({ ...c, scheduledAt: date.toISOString(), status: c.status === "idee" || c.status === "script" || c.status === "prompt" || c.status === "genere" ? "programme" : c.status });
    setDragId(null);
  };

  const Chip = ({ c }: { c: Content }) => {
    const st = STATUSES.find((s) => s.id === c.status)!;
    const r = rows.find((x) => x.content?.id === c.id);
    const dark = st.id === "script" || st.id === "prompt";
    return (
      <Link
        href={editHref(c)}
        draggable={c.status !== "publie"}
        onDragStart={() => setDragId(c.id)}
        className={`block truncate rounded-full px-2.5 py-1 text-[11px] font-semibold ${dark ? "text-white" : "text-black"}`}
        style={{ background: st.color }}
        title={c.title}
      >
        {c.title}{r ? ` · ${fmtNum(r.views)}` : ""}
      </Link>
    );
  };

  return (
    <div>
      <PageHeader
        title={cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        subtitle={`Glisse une création sur un jour pour la programmer. Heure proposée : ${bestHour} h${best.length ? ", d'après tes meilleures publications" : ""}.`}
        actions={<>
          <Button tone="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>←</Button>
          <Button tone="white" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Aujourd&apos;hui</Button>
          <Button tone="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>→</Button>
        </>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {WEEK.map((w) => <div key={w} className="px-2 text-xs font-medium uppercase text-muted">{w}</div>)}
            {cells.map((d, i) => {
              if (d == null) return <div key={i} />;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const items = onDay(d);
              return (
                <div key={i} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(d)} className={`min-h-[110px] rounded-[22px] p-2 ${isToday ? "bg-lime text-black" : "bg-surface"}`}>
                  <div className="mb-1.5 px-1 text-lg font-semibold">{d}</div>
                  <div className="space-y-1">{items.map((c) => <Chip key={c.id} c={c} />)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <aside>
          <h3 className="mb-3 font-semibold">À programmer</h3>
          <div className="space-y-2">
            {unscheduled.map((c) => <Chip key={c.id} c={c} />)}
            {!unscheduled.length && <p className="text-sm text-muted">Tout est programmé.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, Button, Empty, Loading, PageHeader, StatusPill } from "@/components/ui";
import { buildRows, fmtNum, fmtPct } from "@/lib/analytics";
import { useStore, editHref } from "@/lib/store";
import { STATUSES, type Status } from "@/lib/types";

export default function LibraryPage() {
  const store = useStore();
  const [status, setStatus] = useState<Status | "">("");
  const [influencerId, setInfluencerId] = useState("");
  const [q, setQ] = useState("");
  if (!store) return <Loading />;
  const rows = buildRows(store);
  const list = store.contents
    .filter((c) => !status || c.status === status)
    .filter((c) => !influencerId || c.influencerId === influencerId)
    .filter((c) => !q || [c.title, ...Object.values(c.attributes)].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Bibliothèque"
        subtitle="Toutes les créations, de l'idée à la publication, avec leur lien vers l'inspiration, les versions du prompt et les résultats."
        actions={<><Link href="/carrousels?new=1"><Button tone="white" icon="layers">Nouveau carrousel</Button></Link><Link href="/studio?new=1"><Button tone="lime" icon="plus">Nouvelle vidéo</Button></Link></>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[200px]" value={influencerId} onChange={(e) => setInfluencerId(e.target.value)}>
          <option value="">Toutes les influenceuses</option>
          {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
          {[{ id: "" as const, label: "Tous" }, ...STATUSES].map((s) => (
            <button key={s.id} onClick={() => setStatus(s.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === s.id ? "bg-white text-black" : "text-muted hover:text-white"}`}>{s.label}</button>
          ))}
        </div>
      </div>
      {!list.length ? (
        <Empty title="Rien ici pour l'instant">Crée un contenu dans le studio ou depuis une inspiration.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const infl = store.influencers.find((i) => i.id === c.influencerId);
            const r = rows.find((x) => x.content?.id === c.id);
            return (
              <Link key={c.id} href={editHref(c)} className="group flex flex-col rounded-[28px] bg-surface p-5 transition hover:bg-surface-2">
                <div className="flex items-center gap-3">
                  <Avatar influencer={infl} size={40} />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{infl?.name ?? "—"}</span>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-4 text-lg font-semibold">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{c.attributes.hook ? `« ${c.attributes.hook} »` : [c.attributes.topic, c.attributes.format].filter(Boolean).join(" · ") || "Fiche créative à compléter"}</p>
                <div className="mt-auto flex items-end justify-between pt-5 text-sm">
                  <span className="text-muted">{c.kind === "carousel" ? `Carrousel · ${c.carousel?.slides.length ?? 0} slide(s)` : `${c.prompts.length} prompt(s) · ${c.generations.length} génération(s)`}</span>
                  {r ? <span className="text-right"><span className="block text-xl font-semibold">{fmtNum(r.views)}</span><span className="text-xs text-muted">vues · {fmtPct(r.saveRate)} enreg.</span></span> : <Icon name="arrow" />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

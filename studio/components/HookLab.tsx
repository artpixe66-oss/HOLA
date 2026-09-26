"use client";

import Link from "next/link";
import { useState } from "react";
import AgentJson from "./AgentJson";
import { Button, Card } from "./ui";
import { buildContext } from "@/lib/agentContext";
import { evaluateTest } from "@/lib/hookTests";
import { editHref, newContent, now, uid, update } from "@/lib/store";
import { vocabValues } from "@/lib/vocab";
import type { Content, HookIdea, HookTest, Store } from "@/lib/types";

interface HooksAnswer {
  hooks: { image: string; on_screen_text: string; first_line: string; hook_type: string; why: string }[];
}

const hookText = (h: HookIdea) => (h.onScreen && h.firstLine && h.onScreen !== h.firstLine ? `${h.onScreen} / ${h.firstLine}` : h.firstLine || h.onScreen);

function nextSlot(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function HookLab({ content, store }: { content: Content; store: Store }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const ideas = content.hookIdeas ?? [];
  const agent = store.agentVersions.find((a) => a.id === store.activeAgentVersionId) ?? store.agentVersions[0];
  const test = (store.hookTests ?? []).find((t) => t.id === content.hookTestId);
  const result = test ? evaluateTest(store, test) : null;
  const partner = result ? (result.a?.id === content.id ? result.b : result.a) : null;
  const myLetter = result ? (result.a?.id === content.id ? "A" : "B") : null;

  const patch = (fn: (c: Content) => Content) => update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? fn(c) : c)) }));

  const onResult = (data: HooksAnswer) => {
    const list: HookIdea[] = (data.hooks ?? []).slice(0, 8).map((h) => ({ id: uid(), image: h.image, onScreen: h.on_screen_text, firstLine: h.first_line, hookType: h.hook_type, why: h.why }));
    patch((c) => ({ ...c, hookIdeas: list }));
    setPicked([]);
  };

  const applyIdea = (h: HookIdea) => patch((c) => ({ ...c, attributes: { ...c.attributes, hook: hookText(h), hookType: h.hookType || c.attributes.hookType }, checklist: { ...c.checklist, hook: true } }));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]));

  const createTest = () => {
    const [h1, h2] = picked.map((id) => ideas.find((h) => h.id === id)!);
    const testId = uid();
    const base = content.scheduledAt ? new Date(content.scheduledAt) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(19, 0, 0, 0); return d; })();
    const b = newContent({
      ...content,
      id: uid(),
      title: `${content.title} (B)`,
      attributes: { ...content.attributes, hook: hookText(h2), hookType: h2.hookType || content.attributes.hookType },
      prompts: content.prompts.map((p) => ({ ...p, id: uid(), note: `Copie de la version A : remplace l'accroche par « ${hookText(h2)} »` })),
      generations: [],
      chat: [],
      videoUrl: "",
      permalink: "",
      publishedAt: null,
      status: content.status === "publie" ? "prompt" : content.status,
      scheduledAt: nextSlot(base, 2),
      hookTestId: testId,
      checklist: { hook: true },
      createdAt: now(),
    });
    const t: HookTest = { id: testId, contentIds: [content.id, b.id], createdAt: now() };
    update((s) => ({
      ...s,
      hookTests: [...(s.hookTests ?? []), t],
      contents: [
        b,
        ...s.contents.map((c) =>
          c.id === content.id
            ? { ...c, hookTestId: testId, scheduledAt: base.toISOString(), status: (c.status === "publie" || c.status === "idee" || c.status === "script" ? c.status : "programme") as Content["status"], attributes: { ...c.attributes, hook: hookText(h1), hookType: h1.hookType || c.attributes.hookType }, checklist: { ...c.checklist, hook: true } }
            : c,
        ),
      ],
    }));
    setCreated(b.id);
    setPicked([]);
  };

  const existingTypes = vocabValues(store, "hookType").map((v) => v.value);

  return (
    <Card>
      <h3 className="text-lg font-semibold">Labo d&apos;accroches</h3>
      <p className="mb-4 text-xs text-muted">5 accroches sur les trois canaux des 2 premières secondes. Choisis-en une, ou deux pour un test A/B : deux versions identiques sauf l&apos;accroche, publiées à 2 jours d&apos;écart à la même heure.</p>

      {result && (
        <div className="mb-4 rounded-2xl bg-violet/20 p-4 text-sm">
          <p className="font-semibold">Test A/B en cours · cette création est la version {myLetter}</p>
          <p className="mt-1 text-white/80">{result.summary}</p>
          {partner && <Link href={editHref(partner)} className="mt-2 inline-block text-lime">Ouvrir la version {myLetter === "A" ? "B" : "A"} : {partner.title}</Link>}
        </div>
      )}
      {created && <p className="mb-4 rounded-2xl bg-lime/15 p-3 text-sm">Test créé. <Link href={`/studio?id=${created}`} className="text-lime">Ouvrir la version B</Link> pour adapter son prompt.</p>}

      {ideas.length > 0 && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {ideas.map((h, i) => {
            const on = picked.includes(h.id);
            return (
              <div key={h.id} className={`rounded-2xl p-4 text-sm transition ${on ? "bg-white text-black" : "bg-surface-2"}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold">Accroche {i + 1}</span>
                  {h.hookType && <span className={`rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-black/10" : "bg-black/40"}`}>{h.hookType}</span>}
                </div>
                <p><span className="opacity-60">Image · </span>{h.image}</p>
                <p className="mt-1"><span className="opacity-60">Texte à l&apos;écran · </span>{h.onScreen}</p>
                <p className="mt-1"><span className="opacity-60">1re phrase · </span>« {h.firstLine} »</p>
                <p className={`mt-2 text-xs ${on ? "text-black/60" : "text-muted"}`}>{h.why}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button small tone={on ? "dark" : "white"} onClick={() => toggle(h.id)}>{on ? "Retirée du test" : "Pour le test A/B"}</Button>
                  <Button small tone="ghost" className={on ? "!text-black !border-black/20" : ""} onClick={() => applyIdea(h)}>Utiliser seule</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {picked.length === 2 && !content.hookTestId && (
        <Button tone="lime" icon="check" className="mb-4" onClick={createTest}>Créer le test A/B avec ces 2 accroches</Button>
      )}

      <AgentJson<HooksAnswer>
        schema="hooks"
        label={ideas.length ? "Proposer 5 autres accroches" : "Proposer 5 accroches"}
        model={store.settings.model}
        build={() => ({
          instructions: agent?.instructions ?? "",
          context: buildContext(store, content),
          request: [
            "Propose exactement 5 accroches différentes pour cette création, pour les 2 premières secondes.",
            "Pour chacune : ce qu'on voit à l'image, le texte à l'écran (court), la première phrase dite, un type d'accroche court et réutilisable, et pourquoi elle devrait retenir.",
            existingTypes.length ? `Pour le type d'accroche, reprends de préférence un de ceux déjà utilisés : ${existingTypes.join(", ")}.` : "",
            "Appuie-toi sur les enseignements des performances quand ils existent, et varie les mécaniques (question, situation, promesse, contraste, action coupée).",
          ].filter(Boolean).join("\n"),
        })}
        onResult={onResult}
      />
    </Card>
  );
}

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import HoloCard from "./HoloCard";
import { BORDERS } from "./CardSvg";
import { ARCANES, ARCANE_IDS, ELEMENTS, ELEMENT_IDS, RARITIES } from "@/lib/elements";
import { DEFAULT_CARD } from "@/lib/defaults";
import { exportPng, toDataUrl } from "@/lib/image";
import type { ArcaneData, Attack, BorderId, CardState, CreatureData, ElementId, HoloMode, Rarity, TemplateId } from "@/lib/types";

const KEY = "holocarte:card:v2";
const noop = () => () => {};

function load(): CardState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<CardState>;
      return {
        ...DEFAULT_CARD,
        ...saved,
        creature: { ...DEFAULT_CARD.creature, ...saved.creature },
        arcane: { ...DEFAULT_CARD.arcane, ...saved.arcane },
      };
    }
  } catch {
    /* stockage indisponible : on repart de la carte d'exemple */
  }
  return structuredClone(DEFAULT_CARD);
}

export default function Editor({ initialTemplate, initialPrompt }: { initialTemplate?: TemplateId; initialPrompt?: string }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  if (!isClient) return <div className="py-32 text-center text-muted">Chargement de l&apos;éditeur…</div>;
  return <EditorInner initialTemplate={initialTemplate} initialPrompt={initialPrompt} />;
}

function EditorInner({ initialTemplate, initialPrompt }: { initialTemplate?: TemplateId; initialPrompt?: string }) {
  const [card, setCard] = useState<CardState>(() => {
    const c = load();
    return initialTemplate ? { ...c, template: initialTemplate } : c;
  });
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(card));
    } catch {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...card, image: null }));
      } catch {
        /* stockage plein ou bloqué : la carte reste en mémoire */
      }
    }
  }, [card]);

  const set = (patch: Partial<CardState>) => setCard((c) => ({ ...c, ...patch }));
  const setCr = (patch: Partial<CreatureData>) => setCard((c) => ({ ...c, creature: { ...c.creature, ...patch } }));
  const setAr = (patch: Partial<ArcaneData>) => setCard((c) => ({ ...c, arcane: { ...c.arcane, ...patch } }));
  const setAtk = (i: number, patch: Partial<Attack>) =>
    setCr({ attacks: card.creature.attacks.map((a, j) => (j === i ? { ...a, ...patch } : a)) });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    try {
      set({ image: await toDataUrl(f) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image illisible");
    }
  };

  const generate = async () => {
    setError(null);
    setBusy(true);
    setGenStatus("envoi");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, template: card.template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Génération impossible");
      const id: string = data.id;
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const st = await (await fetch(`/api/generate?id=${encodeURIComponent(id)}`)).json();
        setGenStatus(st.status ?? "…");
        if (st.status === "completed") {
          const img = await fetch(`/api/generate/image?id=${encodeURIComponent(id)}`);
          if (!img.ok) throw new Error("Image introuvable");
          set({ image: await toDataUrl(await img.blob()) });
          setGenStatus(null);
          return;
        }
        if (["failed", "nsfw", "canceled", "cancelled"].includes(st.status)) throw new Error(st.status === "nsfw" ? "Image refusée par le filtre de contenu." : "La génération a échoué.");
      }
      throw new Error("Délai dépassé");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setGenStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!svgRef.current) return;
    setError(null);
    try {
      await exportPng(svgRef.current, card.template === "creature" ? card.creature.name : card.arcane.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export impossible");
    }
  };

  const c = card.creature;
  const a = card.arcane;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div className="order-2 space-y-6 lg:order-1">
        <Section title="Modèle">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["creature", "Créature", "PV, élément, attaques, faiblesse"],
                ["arcane", "Arcane", "Fantasy : coût en gemmes, ATQ/DEF"],
              ] as const
            ).map(([id, label, hint]) => (
              <button key={id} onClick={() => set({ template: id })} className={`rounded-xl border p-3 text-left transition ${card.template === id ? "border-gold bg-gold/10" : "border-line hover:border-white/30"}`}>
                <div className="font-semibold">{label}</div>
                <div className="text-xs text-muted">{hint}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Illustration">
          <div className="space-y-3">
            <label className="block">
              <span className="label">Décris ta créature, l&apos;IA la dessine</span>
              <textarea className="input min-h-20" maxLength={400} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex. un petit renard de braise aux yeux dorés, assis sur un rocher volcanique" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn-gold" disabled={busy || prompt.trim().length < 3} onClick={generate}>
                {busy ? `Génération… ${genStatus ?? ""}` : "Générer l'illustration"}
              </button>
              <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Importer une photo</button>
              {card.image && <button className="btn-ghost" onClick={() => set({ image: null })}>Retirer l&apos;image</button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <p className="text-xs text-muted">Personnages et marques existants refusés : décris une créature à toi.</p>
          </div>
        </Section>

        {card.template === "creature" ? (
          <>
            <Section title="Identité">
              <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                <Field label="Nom"><input className="input" maxLength={28} value={c.name} onChange={(e) => setCr({ name: e.target.value })} /></Field>
                <Field label="PV"><input className="input" type="number" min={10} max={400} step={10} value={c.hp} onChange={(e) => setCr({ hp: Number(e.target.value) })} /></Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Stade">
                  <select className="input" value={c.stage} onChange={(e) => setCr({ stage: e.target.value as CreatureData["stage"] })}>
                    <option value="base">De base</option>
                    <option value="evo1">Évolution 1</option>
                    <option value="evo2">Évolution 2</option>
                  </select>
                </Field>
                {c.stage !== "base" && <Field label="Évolue de"><input className="input" maxLength={24} value={c.evolvesFrom} onChange={(e) => setCr({ evolvesFrom: e.target.value })} /></Field>}
              </div>
              <div className="mt-3"><span className="label">Élément</span><ElementPicker value={c.element} onChange={(element) => setCr({ element })} /></div>
              <div className="mt-3"><Field label="Bandeau d'infos"><input className="input" maxLength={70} value={c.info} onChange={(e) => setCr({ info: e.target.value })} /></Field></div>
            </Section>

            <Section title="Pouvoir (optionnel)">
              {c.power ? (
                <div className="space-y-3">
                  <Field label="Nom du pouvoir"><input className="input" maxLength={30} value={c.power.name} onChange={(e) => setCr({ power: { ...c.power!, name: e.target.value } })} /></Field>
                  <Field label="Effet"><textarea className="input min-h-16" maxLength={160} value={c.power.text} onChange={(e) => setCr({ power: { ...c.power!, text: e.target.value } })} /></Field>
                  <button className="btn-ghost" onClick={() => setCr({ power: null })}>Supprimer le pouvoir</button>
                </div>
              ) : (
                <button className="btn-ghost" onClick={() => setCr({ power: { name: "Nouveau pouvoir", text: "" } })}>+ Ajouter un pouvoir</button>
              )}
            </Section>

            <Section title="Attaques">
              <div className="space-y-4">
                {c.attacks.map((atk, i) => (
                  <div key={i} className="space-y-3 rounded-xl border border-line p-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
                      <Field label="Nom"><input className="input" maxLength={28} value={atk.name} onChange={(e) => setAtk(i, { name: e.target.value })} /></Field>
                      <Field label="Dégâts"><input className="input" maxLength={5} value={atk.damage} onChange={(e) => setAtk(i, { damage: e.target.value })} /></Field>
                    </div>
                    <div>
                      <span className="label">Coût (clique pour retirer)</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {atk.cost.map((e, j) => (
                          <button key={j} title="Retirer" onClick={() => setAtk(i, { cost: atk.cost.filter((_, k) => k !== j) })}>
                            <Dot el={e} />
                          </button>
                        ))}
                        {atk.cost.length < 5 && (
                          <select className="input !w-auto !py-1 text-xs" value="" onChange={(e) => e.target.value && setAtk(i, { cost: [...atk.cost, e.target.value as ElementId] })}>
                            <option value="">+ énergie</option>
                            {ELEMENT_IDS.map((id) => <option key={id} value={id}>{ELEMENTS[id].label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <Field label="Effet (optionnel)"><textarea className="input min-h-14" maxLength={160} value={atk.text} onChange={(e) => setAtk(i, { text: e.target.value })} /></Field>
                    <button className="text-xs text-muted hover:text-white" onClick={() => setCr({ attacks: c.attacks.filter((_, k) => k !== i) })}>Supprimer cette attaque</button>
                  </div>
                ))}
                {c.attacks.length < (c.power ? 2 : 3) && (
                  <button className="btn-ghost" onClick={() => setCr({ attacks: [...c.attacks, { cost: [c.element], name: "Nouvelle attaque", damage: "30", text: "" }] })}>+ Ajouter une attaque</button>
                )}
              </div>
            </Section>

            <Section title="Bas de carte">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Faiblesse"><ElementSelect value={c.weakness} onChange={(weakness) => setCr({ weakness })} /></Field>
                <Field label="Résistance"><ElementSelect value={c.resistance} onChange={(resistance) => setCr({ resistance })} /></Field>
                <Field label="Repli"><input className="input" type="number" min={0} max={4} value={c.retreat} onChange={(e) => setCr({ retreat: Number(e.target.value) })} /></Field>
              </div>
              <div className="mt-3"><Field label="Texte d'ambiance"><textarea className="input min-h-14" maxLength={150} value={c.flavor} onChange={(e) => setCr({ flavor: e.target.value })} /></Field></div>
            </Section>
          </>
        ) : (
          <>
            <Section title="Identité">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Field label="Nom"><input className="input" maxLength={32} value={a.name} onChange={(e) => setAr({ name: e.target.value })} /></Field>
                <Field label="Coût"><input className="input font-mono" maxLength={8} value={a.cost} onChange={(e) => setAr({ cost: e.target.value })} /></Field>
              </div>
              <p className="mt-2 text-xs text-muted">Coût : chiffre = neutre, puis une lettre par gemme ({ARCANE_IDS.filter((x) => ARCANES[x].letter).map((x) => `${ARCANES[x].letter} ${ARCANES[x].label}`).join(", ")}). Ex. 3BB.</p>
              <div className="mt-3">
                <span className="label">Arcane (couleur du cadre)</span>
                <div className="flex flex-wrap gap-2">
                  {ARCANE_IDS.map((id) => (
                    <button key={id} onClick={() => setAr({ arcane: id })} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${a.arcane === id ? "border-gold" : "border-line"}`}>
                      <span className="h-3 w-3 rotate-45" style={{ background: ARCANES[id].gem }} />
                      {ARCANES[id].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3"><Field label="Ligne de type"><input className="input" maxLength={44} value={a.typeLine} onChange={(e) => setAr({ typeLine: e.target.value })} /></Field></div>
            </Section>
            <Section title="Texte">
              <Field label="Capacités (une par ligne)"><textarea className="input min-h-28" maxLength={320} value={a.rules} onChange={(e) => setAr({ rules: e.target.value })} /></Field>
              <div className="mt-3"><Field label="Texte d'ambiance"><textarea className="input min-h-14" maxLength={140} value={a.flavor} onChange={(e) => setAr({ flavor: e.target.value })} /></Field></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Attaque"><input className="input" maxLength={3} value={a.attack} onChange={(e) => setAr({ attack: e.target.value })} /></Field>
                <Field label="Défense"><input className="input" maxLength={3} value={a.defense} onChange={(e) => setAr({ defense: e.target.value })} /></Field>
              </div>
              <p className="mt-2 text-xs text-muted">Laisse Attaque et Défense vides pour un sort ou un artefact.</p>
            </Section>
          </>
        )}

        <Section title="Finition">
          <div className="mb-4">
            <span className="label">Bordure</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(BORDERS) as BorderId[]).map((b) => {
                const current = card.template === "creature" ? c.border : a.border;
                return (
                  <button key={b} onClick={() => (card.template === "creature" ? setCr({ border: b }) : setAr({ border: b }))} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${current === b ? "border-gold bg-gold/10" : "border-line"}`}>
                    <span className="h-4 w-4 rounded-full border border-white/30" style={{ background: `linear-gradient(135deg, ${BORDERS[b].stops.join(",")})` }} />
                    {BORDERS[b].label}
                  </button>
                );
              })}
            </div>
          </div>
          {card.template === "creature" && (
            <label className="mb-4 flex items-center gap-3 rounded-xl border border-line p-3">
              <input type="checkbox" className="h-4 w-4 accent-[#f2c45a]" checked={c.fullArt} onChange={(e) => setCr({ fullArt: e.target.checked })} />
              <span>
                <span className="block text-sm font-semibold">Pleine illustration (full art)</span>
                <span className="block text-xs text-muted">L&apos;image couvre toute la carte, le texte passe sur un voile. Nécessite une illustration.</span>
              </span>
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Effet holo">
              <select className="input" value={card.holo} onChange={(e) => set({ holo: e.target.value as HoloMode })}>
                <option value="aucun">Aucun</option>
                <option value="illustration">Illustration holo</option>
                <option value="carte">Carte entière holo</option>
              </select>
            </Field>
            <Field label="Rareté">
              <select className="input" value={card.rarity} onChange={(e) => set({ rarity: e.target.value as Rarity })}>
                {(Object.keys(RARITIES) as Rarity[]).map((r) => <option key={r} value={r}>{RARITIES[r].label}</option>)}
              </select>
            </Field>
            <Field label="Numéro de série"><input className="input" maxLength={16} value={card.setNumber} onChange={(e) => set({ setNumber: e.target.value })} /></Field>
            <Field label="Illustrateur"><input className="input" maxLength={24} value={card.illustrator} onChange={(e) => set({ illustrator: e.target.value })} /></Field>
          </div>
        </Section>
      </div>

      <div className="order-1 lg:order-2">
        <div className="space-y-4 lg:sticky lg:top-6">
          <HoloCard state={card} svgRef={svgRef} className="mx-auto max-w-[380px] lg:max-w-none" />
          {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-gold flex-1" onClick={download}>Télécharger en PNG HD</button>
            <button className="btn-ghost" onClick={() => confirm("Repartir de la carte d'exemple ?") && setCard(structuredClone({ ...DEFAULT_CARD, template: card.template }))}>Réinitialiser</button>
          </div>
          <p className="text-center text-xs text-muted">1260 × 1760 px, format carte 63 × 88 mm. Survole la carte pour voir l&apos;effet holo.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Dot({ el }: { el: ElementId }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70" style={{ background: ELEMENTS[el].color }} title={ELEMENTS[el].label}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5"><path d={ELEMENTS[el].glyph} fill="#fff" fillRule="evenodd" /></svg>
    </span>
  );
}

function ElementPicker({ value, onChange }: { value: ElementId; onChange: (v: ElementId) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ELEMENT_IDS.map((id) => (
        <button key={id} onClick={() => onChange(id)} className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm ${value === id ? "border-gold bg-gold/10" : "border-line"}`}>
          <Dot el={id} />
          {ELEMENTS[id].label}
        </button>
      ))}
    </div>
  );
}

function ElementSelect({ value, onChange }: { value: ElementId | null; onChange: (v: ElementId | null) => void }) {
  return (
    <select className="input" value={value ?? ""} onChange={(e) => onChange((e.target.value || null) as ElementId | null)}>
      <option value="">Aucune</option>
      {ELEMENT_IDS.map((id) => <option key={id} value={id}>{ELEMENTS[id].label}</option>)}
    </select>
  );
}

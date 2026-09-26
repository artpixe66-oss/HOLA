"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Avatar, Button, Card, Empty, Field, Loading, PageHeader, StatusPill } from "@/components/ui";
import { applyStoryboard, buildCarouselContext, carouselRequest, carouselRequestForClaudeAi, newCarouselData, parseStoryboard } from "@/lib/carousel";
import { generateAndWait } from "@/lib/higgsfield";
import { isHostedUrl, uploadImage } from "@/lib/image";
import { CAROUSEL_GUIDE } from "@/lib/seed/carousel-guide";
import { emptyAttributes, newContent, now, saveContent, update, useStore } from "@/lib/store";
import { CAROUSEL_TYPES, STATUSES, type CarouselData, type Content, type Slide, type SlideCategory, type Status, type Store } from "@/lib/types";

const CATEGORY_STYLE: Record<SlideCategory, string> = {
  ELLE: "bg-lime text-black",
  POV: "bg-violet text-white",
  DECOR: "bg-white text-black",
};

export default function CarouselsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Carousels />
    </Suspense>
  );
}

function Carousels() {
  const store = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const wantsNew = params.get("new") === "1";
  const created = useRef(false);

  useEffect(() => {
    if (!store || !wantsNew || created.current) return;
    created.current = true;
    const c = newContent({
      kind: "carousel",
      title: "Nouveau carrousel",
      influencerId: store.influencers[0]?.id ?? null,
      attributes: { ...emptyAttributes(), format: "Carrousel · Photo dump" },
      carousel: newCarouselData(),
    });
    saveContent(c);
    router.replace(`/carrousels?id=${c.id}`);
  }, [store, wantsNew, router]);
  useEffect(() => {
    if (!wantsNew) created.current = false;
  }, [wantsNew]);

  if (!store) return <Loading />;
  const carousels = store.contents.filter((c) => c.kind === "carousel");
  const content = carousels.find((c) => c.id === id) ?? null;

  if (!content)
    return (
      <div>
        <PageHeader
          title="Carrousels"
          subtitle="À partir d'un brief (situation, idée, prompt) ou d'un carrousel Instagram existant : storyboard, prompt de chaque photo, légende, puis génération."
          actions={<Button tone="lime" icon="plus" onClick={() => router.push("/carrousels?new=1")}>Nouveau carrousel</Button>}
        />
        {!carousels.length ? (
          <Empty title="Aucun carrousel pour l'instant" action={<Button tone="lime" icon="plus" onClick={() => router.push("/carrousels?new=1")}>Créer le premier</Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {carousels.map((c) => {
              const infl = store.influencers.find((i) => i.id === c.influencerId);
              const imgs = c.carousel?.slides.filter((s) => s.imageUrl).slice(0, 3) ?? [];
              return (
                <button key={c.id} onClick={() => router.push(`/carrousels?id=${c.id}`)} className="flex flex-col rounded-[28px] bg-surface p-5 text-left transition hover:bg-surface-2">
                  <div className="flex items-center gap-3">
                    <Avatar influencer={infl} size={36} />
                    <span className="flex-1 truncate text-sm text-muted">{infl?.name ?? "—"}</span>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="mt-4 text-lg font-semibold">{c.title}</p>
                  <p className="text-sm text-muted">{c.carousel?.type} · {c.carousel?.slides.length || c.carousel?.slideCount} photos</p>
                  {imgs.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {imgs.map((s) => <img key={s.id} src={s.imageUrl} alt="" className="aspect-[4/5] w-1/3 rounded-xl object-cover" />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );

  return <Editor key={content.id} content={content} store={store} />;
}

function Editor({ content, store }: { content: Content; store: Store }) {
  const router = useRouter();
  const car = content.carousel ?? newCarouselData();
  const influencer = store.influencers.find((i) => i.id === content.influencerId) ?? null;
  const guide = store.carouselInstructions || CAROUSEL_GUIDE;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = (patch: Partial<Content>) => saveContent({ ...content, ...patch });
  // Toujours repartir de l'état le plus récent : les générations d'images se terminent en parallèle.
  const setCar = (fn: (c: CarouselData) => CarouselData) =>
    update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, carousel: fn(c.carousel ?? newCarouselData()) } : c)) }));
  const setSlide = (slideId: string, patch: Partial<Slide>) => setCar((c) => ({ ...c, slides: c.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)) }));

  const setType = (type: string) => {
    save({ carousel: { ...car, type }, attributes: { ...content.attributes, format: `Carrousel · ${type}` } });
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: store.settings.model,
          instructions: guide,
          context: buildCarouselContext(store, content),
          request: carouselRequest(car),
          images: car.source === "inspiration" ? car.refImages : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setCar((c) => applyStoryboard(c, data));
      if (content.status === "idee") save({ status: "script" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  };

  const copyForClaude = async () => {
    await navigator.clipboard.writeText(carouselRequestForClaudeAi(store, content, guide));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importPasted = () => {
    try {
      const sb = parseStoryboard(paste);
      setCar((c) => applyStoryboard(c, sb));
      if (content.status === "idee") update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, status: "script" } : c)) }));
      setPaste("");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? `Réponse illisible : ${e.message}` : "Réponse illisible");
    }
  };

  const addRefImages = async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push((await uploadImage(f)).url);
      setCar((c) => ({ ...c, refImages: [...c.refImages, ...urls] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setUploading(false);
    }
  };

  const genSlide = async (slide: Slide) => {
    const model = store.settings.imageModel || "higgsfield-ai/soul/v2/standard";
    const price = store.settings.pricePerImage ?? null;
    if (!confirm(price != null ? `Générer la photo ? Coût estimé : ${price.toFixed(2)} (une image ratée est facturée).` : "Générer la photo ? Aucun tarif par image renseigné dans les réglages.")) return;
    setSlide(slide.id, { genStatus: "envoi" });
    try {
      const url = await generateAndWait(model, { prompt: slide.prompt, aspect_ratio: "4:5" }, (st) => setSlide(slide.id, { genStatus: st }));
      setSlide(slide.id, url ? { imageUrl: url, genStatus: "terminé" } : { genStatus: "échec" });
      if (price) update((s) => ({ ...s, settings: { ...s.settings, spent: s.settings.spent + price } }));
    } catch (e) {
      setSlide(slide.id, { genStatus: e instanceof Error ? e.message.slice(0, 80) : "erreur" });
    }
  };

  const allPrompts = car.slides.map((s, i) => `--- Slide ${i + 1} (${s.category}) ---\n${s.prompt}`).join("\n\n");
  const counts = (["ELLE", "POV", "DECOR"] as SlideCategory[]).map((k) => `${car.slides.filter((s) => s.category === k).length} ${k}`).join(" · ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button tone="ghost" onClick={() => router.push("/carrousels")}>← Tous les carrousels</Button>
        <Button tone="lime" icon="plus" onClick={() => router.push("/carrousels?new=1")}>Nouveau carrousel</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card tone="white" className="space-y-4 [&_.input]:border-black/10 [&_.input]:bg-black/5 [&_.input]:text-black [&_label>span:first-child]:text-black/50">
            <div className="flex items-center gap-3">
              <Avatar influencer={influencer} size={52} />
              <input className="input !border-transparent !bg-transparent px-0 text-xl font-semibold" value={content.title} onChange={(e) => save({ title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Influenceuse">
                <select className="input" value={content.influencerId ?? ""} onChange={(e) => save({ influencerId: e.target.value || null })}>
                  <option value="">—</option>
                  {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </Field>
              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-black/50">Nombre de photos</span>
                <div className="flex items-center gap-2">
                  <button aria-label="Une photo de moins" className="h-10 w-10 rounded-full bg-black text-white" onClick={() => save({ carousel: { ...car, slideCount: Math.max(2, car.slideCount - 1) } })}>−</button>
                  <span className="w-8 text-center text-xl font-semibold">{car.slideCount}</span>
                  <button aria-label="Une photo de plus" className="h-10 w-10 rounded-full bg-black text-white" onClick={() => save({ carousel: { ...car, slideCount: Math.min(20, car.slideCount + 1) } })}>+</button>
                </div>
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-black/50">Type</span>
              <div className="flex flex-wrap gap-1.5">
                {CAROUSEL_TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${car.type === t ? "bg-black text-white" : "bg-black/5 text-black"}`}>{t}</button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="inline-flex rounded-full bg-surface-2 p-1">
              {(["brief", "inspiration"] as const).map((s) => (
                <button key={s} onClick={() => save({ carousel: { ...car, source: s } })} className={`rounded-full px-4 py-2 text-sm font-medium ${car.source === s ? "bg-white text-black" : "text-muted"}`}>
                  {s === "brief" ? "Brief / idée" : "Carrousel existant"}
                </button>
              ))}
            </div>
            {car.source === "brief" ? (
              <Field label="Situation, idée ou prompt" hint="Ex. dimanche matin chez elle, lumière douce, café et vinyles, elle se prépare pour un brunch.">
                <textarea className="input" rows={6} value={car.brief} onChange={(e) => save({ carousel: { ...car, brief: e.target.value } })} />
              </Field>
            ) : (
              <>
                <Field label="Lien du carrousel Instagram">
                  <input className="input" placeholder="https://www.instagram.com/p/…" value={car.inspirationUrl} onChange={(e) => save({ carousel: { ...car, inspirationUrl: e.target.value } })} />
                </Field>
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Captures des slides, dans l&apos;ordre</p>
                  <p className="mb-2 text-xs text-muted">Instagram ne laisse pas lire un carrousel depuis son lien : fais des captures d&apos;écran de chaque slide et ajoute-les ici, l&apos;agent les analyse.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {car.refImages.map((u, i) => (
                      <div key={u + i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
                        <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 text-[10px]">{i + 1}</span>
                        <button onClick={() => setCar((c) => ({ ...c, refImages: c.refImages.filter((_, j) => j !== i) }))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-danger" aria-label="Retirer"><Icon name="x" size={12} /></button>
                      </div>
                    ))}
                    <label className={`grid aspect-[4/5] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-surface-2 text-muted hover:border-lime ${uploading ? "opacity-50" : ""}`}>
                      <Icon name={uploading ? "clock" : "upload"} />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addRefImages(Array.from(e.target.files)); e.target.value = ""; }} />
                    </label>
                  </div>
                </div>
                <Field label="Ce que tu veux garder" hint="Ex. la structure avant/après, le texte sur la slide 1, l'ambiance.">
                  <textarea className="input" rows={3} value={car.inspirationNotes} onChange={(e) => save({ carousel: { ...car, inspirationNotes: e.target.value } })} />
                </Field>
              </>
            )}

            <Button tone="lime" icon="wand" disabled={busy} onClick={generate} className="w-full">
              {busy ? "L'agent prépare le storyboard…" : car.slides.length ? "Régénérer le storyboard" : "Générer le storyboard"}
            </Button>
            {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-xs text-muted">Sans clé API, avec ton abonnement Claude : copie la demande, colle-la dans Claude.ai{car.source === "inspiration" && car.refImages.length ? " avec tes captures" : ""}, puis recolle sa réponse ici.</p>
              <Button small tone="white" icon={copied ? "check" : "copy"} className="mt-2" onClick={copyForClaude}>{copied ? "Copié" : "Copier pour Claude.ai"}</Button>
              <textarea className="input mt-3 font-mono text-xs" rows={3} placeholder="Colle ici la réponse de Claude.ai" value={paste} onChange={(e) => setPaste(e.target.value)} />
              <Button small tone="ghost" className="mt-2" disabled={!paste.trim()} onClick={importPasted}>Importer la réponse</Button>
            </div>
          </Card>

          <Card className="space-y-3">
            <h3 className="font-semibold">Publication</h3>
            <Field label="Statut">
              <select className="input" value={content.status} onChange={(e) => save({ status: e.target.value as Status })}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Programmé le">
              <input className="input" type="datetime-local" value={toLocalInput(content.scheduledAt)} onChange={(e) => save({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null, status: e.target.value && content.status !== "publie" ? "programme" : content.status })} />
            </Field>
            <Field label="Lien de la publication Instagram" hint="Relie automatiquement les statistiques importées.">
              <input className="input" value={content.permalink} onChange={(e) => save({ permalink: e.target.value, status: e.target.value ? "publie" : content.status, publishedAt: e.target.value ? content.publishedAt ?? content.scheduledAt ?? now() : content.publishedAt })} />
            </Field>
            <div className="flex justify-end">
              <Button tone="danger" icon="trash" small onClick={() => { if (confirm("Supprimer ce carrousel ?")) { update((s) => ({ ...s, contents: s.contents.filter((c) => c.id !== content.id) })); router.push("/carrousels"); } }}>Supprimer</Button>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          {!car.slides.length ? (
            <Card className="grid min-h-[300px] place-items-center text-center">
              <div>
                <Icon name="layers" size={40} className="mx-auto text-muted" />
                <p className="mt-3 text-lg font-semibold">Le storyboard apparaîtra ici</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted">Une slide par photo : catégorie (elle, POV, décor), cadrage, lumière et prompt complet. Slide 1 = l&apos;accroche, dernière = le moment vrai.</p>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-lime">{car.type} · {car.slides.length} photos · {counts}</p>
                    <p className="mt-1 text-xl font-semibold">{car.concept || "Concept"}</p>
                    {car.styleNotes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{car.styleNotes}</p>}
                  </div>
                  <Button small icon="copy" onClick={() => navigator.clipboard.writeText(allPrompts)}>Copier tous les prompts</Button>
                </div>
                <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2">
                  {car.slides.map((s, i) => (
                    <div key={s.id} className="relative w-28 shrink-0 snap-start">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.imageUrl} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
                      ) : (
                        <div className="grid aspect-[4/5] w-full place-items-center rounded-xl bg-surface-2 p-2 text-center text-[10px] text-muted">{s.description.slice(0, 60)}</div>
                      )}
                      <span className={`absolute left-1 top-1 rounded-full px-1.5 text-[10px] font-semibold ${CATEGORY_STYLE[s.category]}`}>{i + 1}</span>
                    </div>
                  ))}
                </div>
                <Field label="Légende Instagram">
                  <textarea className="input" rows={3} value={car.caption} onChange={(e) => setCar((c) => ({ ...c, caption: e.target.value }))} />
                </Field>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                {car.slides.map((s, i) => (
                  <SlideCard key={s.id} slide={s} index={i} onChange={(patch) => setSlide(s.id, patch)} onGenerate={() => genSlide(s)} onRemove={() => setCar((c) => ({ ...c, slides: c.slides.filter((x) => x.id !== s.id) }))} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideCard({ slide, index, onChange, onGenerate, onRemove }: { slide: Slide; index: number; onChange: (p: Partial<Slide>) => void; onGenerate: () => Promise<void>; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [working, setWorking] = useState(false);
  const run = async () => {
    setWorking(true);
    try {
      await onGenerate();
    } finally {
      setWorking(false);
    }
  };
  return (
    <Card className="flex gap-4 !p-4">
      <div className="w-32 shrink-0 space-y-2">
        <label className="relative block cursor-pointer">
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
          ) : (
            <div className="grid aspect-[4/5] w-full place-items-center rounded-xl border-2 border-dashed border-surface-2 text-center text-[11px] text-muted">
              <span><Icon name="upload" className="mx-auto mb-1" />{uploading ? "Envoi…" : "Ajouter la photo"}</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setUploading(true); try { onChange({ imageUrl: (await uploadImage(f)).url }); } finally { setUploading(false); } }} />
        </label>
        <Button small tone="lime" icon="play" className="w-full" disabled={working || !slide.prompt} onClick={run}>{working ? "…" : "Générer"}</Button>
        {slide.genStatus && <p className="text-center text-[10px] text-muted">{slide.genStatus}</p>}
        {slide.imageUrl && !isHostedUrl(slide.imageUrl) && <p className="text-center text-[10px] text-muted">image locale</p>}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{index + 1}</span>
          <select className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[slide.category]}`} value={slide.category} onChange={(e) => onChange({ category: e.target.value as SlideCategory })}>
            <option>ELLE</option><option>POV</option><option value="DECOR">DÉCOR</option>
          </select>
          <span className="flex-1" />
          <button onClick={onRemove} className="text-muted hover:text-danger" aria-label="Supprimer la slide"><Icon name="trash" size={16} /></button>
        </div>
        <p className="text-sm">{slide.description}</p>
        <p className="text-xs text-muted">{[slide.framing, slide.light].filter(Boolean).join(" · ")}</p>
        <div className="flex gap-2">
          <Button small tone="ghost" onClick={() => setOpen(!open)}>{open ? "Masquer le prompt" : "Voir le prompt"}</Button>
          <Button small tone="ghost" icon="copy" onClick={() => navigator.clipboard.writeText(slide.prompt)}>Copier</Button>
        </div>
        {open && <textarea className="input font-mono text-[11px]" rows={10} value={slide.prompt} onChange={(e) => onChange({ prompt: e.target.value })} />}
      </div>
    </Card>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

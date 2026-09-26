"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Markdown from "@/components/Markdown";
import { Avatar, Button, Card, Field, Loading, StatusPill } from "@/components/ui";
import { buildContext, extractCodeBlock } from "@/lib/agentContext";
import { newContent, now, saveContent, uid, update, useStore } from "@/lib/store";
import { ATTRIBUTE_LABELS, STATUSES, type AgentMessage, type Content, type CreativeAttributes, type Generation, type Status, type Store } from "@/lib/types";

export default function StudioPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Studio />
    </Suspense>
  );
}

function Studio() {
  const store = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const wantsNew = params.get("new") === "1";

  const created = useRef(false);
  useEffect(() => {
    if (!store || !wantsNew || created.current) return;
    created.current = true;
    const c = newContent({ influencerId: store.influencers[0]?.id ?? null });
    saveContent(c);
    router.replace(`/studio?id=${c.id}`);
  }, [store, wantsNew, router]);
  useEffect(() => {
    if (!wantsNew) created.current = false;
  }, [wantsNew]);

  if (!store) return <Loading />;
  const content = store.contents.find((c) => c.id === id) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select className="input max-w-md" value={content?.id ?? ""} onChange={(e) => router.push(e.target.value ? `/studio?id=${e.target.value}` : "/studio")}>
          <option value="">Choisir une création…</option>
          {store.contents.filter((c) => c.kind !== "carousel").map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — {STATUSES.find((s) => s.id === c.status)?.label}
            </option>
          ))}
        </select>
        <Button tone="lime" icon="plus" onClick={() => router.push("/studio?new=1")}>Nouvelle création</Button>
      </div>
      {content ? (
        <Editor key={content.id} content={content} store={store} />
      ) : (
        <Card className="text-center">
          <p className="text-lg font-semibold">Choisis une création ou démarre-en une.</p>
          <p className="mt-2 text-sm text-muted">Tu peux aussi partir d&apos;une inspiration : bouton « Créer » dans Inspirations.</p>
        </Card>
      )}
    </div>
  );
}

const QUICK = [
  { label: "3 idées", prompt: "Propose-moi 3 idées de contenus pour cette influenceuse, en t'appuyant sur l'inspiration et sur les enseignements des performances. Pour chacune : sujet, accroche des 2 premières secondes, tenue, décor, durée, et pourquoi." },
  { label: "Scénario", prompt: "Écris le scénario de ce contenu : le tableau d'action en secondes réelles (corps, regard, mains, secondaire) et les répliques adaptées au personnage." },
  { label: "Prompt complet", prompt: "Écris le prompt vidéo complet, tous les blocs, avec les blocs fixes de la fiche mot pour mot, puis les réglages et les points de contrôle qualité." },
  { label: "Variante d'accroche", prompt: "Garde tout le prompt mais propose une variante de l'accroche des 2 premières secondes à tester contre l'actuelle. Redonne le prompt complet." },
];

function Editor({ content, store }: { content: Content; store: Store }) {
  const influencer = store.influencers.find((i) => i.id === content.influencerId) ?? null;
  const save = (patch: Partial<Content>) => saveContent({ ...content, ...patch });
  const setAttr = <K extends keyof CreativeAttributes>(k: K, v: CreativeAttributes[K]) => save({ attributes: { ...content.attributes, [k]: v } });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card tone="white" className="space-y-4 [&_.input]:border-black/10 [&_.input]:bg-black/5 [&_.input]:text-black [&_label>span:first-child]:text-black/50">
          <div className="flex items-center gap-3">
            <Avatar influencer={influencer} size={52} />
            <input className="input !bg-transparent !border-transparent px-0 text-xl font-semibold" value={content.title} onChange={(e) => save({ title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Influenceuse">
              <select className="input" value={content.influencerId ?? ""} onChange={(e) => save({ influencerId: e.target.value || null })}>
                <option value="">—</option>
                {store.influencers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Field>
            <Field label="Statut">
              <select className="input" value={content.status} onChange={(e) => save({ status: e.target.value as Status })}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Inspiration" className="col-span-2">
              <select className="input" value={content.inspirationId ?? ""} onChange={(e) => save({ inspirationId: e.target.value || null })}>
                <option value="">Aucune</option>
                {store.inspirations.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </Field>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold">Fiche créative</h3>
          <p className="text-xs text-muted">Ces champs servent à comparer les publications entre elles. Reste constant dans tes intitulés (« Vanne à chute », pas une formulation différente à chaque fois).</p>
          <div className="grid grid-cols-2 gap-3">
            {(["topic", "hookType", "outfit", "setting", "format", "editing"] as const).map((k) => (
              <Field key={k} label={ATTRIBUTE_LABELS[k]}>
                <input className="input" list={`list-${k}`} value={content.attributes[k]} onChange={(e) => setAttr(k, e.target.value)} />
                <datalist id={`list-${k}`}>
                  {[...new Set(store.contents.map((c) => c.attributes[k]).filter(Boolean))].map((v) => <option key={v} value={v} />)}
                </datalist>
              </Field>
            ))}
            <Field label="Accroche" className="col-span-2"><input className="input" placeholder="Première phrase ou texte à l'écran" value={content.attributes.hook} onChange={(e) => setAttr("hook", e.target.value)} /></Field>
            <Field label="Durée (s)"><input className="input" type="number" min={1} value={content.attributes.durationSec ?? ""} onChange={(e) => setAttr("durationSec", e.target.value ? Number(e.target.value) : null)} /></Field>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold">Publication</h3>
          <Field label="Programmée le"><input className="input" type="datetime-local" value={toLocalInput(content.scheduledAt)} onChange={(e) => save({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null, status: e.target.value && content.status !== "publie" ? "programme" : content.status })} /></Field>
          <Field label="Vidéo finale (URL)"><input className="input" value={content.videoUrl} onChange={(e) => save({ videoUrl: e.target.value })} /></Field>
          <Field label="Lien de la publication Instagram" hint="Sert à relier automatiquement les statistiques importées."><input className="input" value={content.permalink} onChange={(e) => save({ permalink: e.target.value, status: e.target.value ? "publie" : content.status, publishedAt: e.target.value ? content.publishedAt ?? content.scheduledAt ?? now() : content.publishedAt })} /></Field>
          <Field label="Scénario"><textarea className="input" rows={6} value={content.script} onChange={(e) => save({ script: e.target.value })} /></Field>
          <div className="flex justify-between pt-2">
            <StatusPill status={content.status} />
            <Button tone="danger" icon="trash" small onClick={() => { if (confirm("Supprimer cette création ?")) { update((s) => ({ ...s, contents: s.contents.filter((c) => c.id !== content.id) })); location.href = "/bibliotheque"; } }}>Supprimer</Button>
          </div>
        </Card>
      </div>

      <div className="min-w-0 space-y-5">
        <AgentChat content={content} store={store} />
        <PromptVersions content={content} store={store} />
        <GenerationPanel content={content} store={store} />
      </div>
    </div>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AgentChat({ content, store }: { content: Content; store: Store }) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const chat = content.chat ?? [];
  const agent = store.agentVersions.find((a) => a.id === store.activeAgentVersionId) ?? store.agentVersions[0];

  useEffect(() => bottom.current?.scrollIntoView({ block: "nearest" }), [chat.length, streaming]);

  const send = async (text: string) => {
    if (!text.trim() || streaming != null) return;
    setError(null);
    const messages: AgentMessage[] = [...chat, { role: "user", content: text.trim() }];
    saveContent({ ...content, chat: messages });
    setInput("");
    setStreaming("");
    let acc = "";
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: store.settings.model, instructions: agent?.instructions ?? "", context: buildContext(store, content), messages }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      update((s) => ({
        ...s,
        contents: s.contents.map((c) => (c.id === content.id ? { ...c, chat: [...messages, { role: "assistant", content: acc }] } : c)),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      if (acc) update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, chat: [...messages, { role: "assistant", content: acc }] } : c)) }));
      else {
        // rien reçu : on retire la question pour pouvoir la renvoyer telle quelle
        update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, chat } : c)) }));
        setInput(text);
      }
    } finally {
      setStreaming(null);
    }
  };

  const savePrompt = (text: string) => {
    const code = extractCodeBlock(text) ?? text;
    update((s) => ({
      ...s,
      contents: s.contents.map((c) =>
        c.id === content.id
          ? { ...c, status: c.status === "idee" || c.status === "script" ? "prompt" : c.status, prompts: [{ id: uid(), text: code, note: "", agentVersionId: agent?.id ?? null, createdAt: now() }, ...c.prompts] }
          : c,
      ),
    }));
  };

  const [copied, setCopied] = useState<string | null>(null);
  const copyForClaude = async (label: string, request: string) => {
    const text = `${buildContext(store, content)}\n\n# Demande\n\n${request}\n\nRéponds en suivant ta méthode habituelle (skill reverse-video-prompt).`;
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const saveScript = (text: string) => saveContent({ ...content, script: text, status: content.status === "idee" ? "script" : content.status });

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Agent créatif</h3>
          <p className="text-xs text-muted">{agent?.label} · fiche, inspiration et stats envoyées automatiquement</p>
        </div>
        {chat.length > 0 && <Button tone="ghost" small onClick={() => confirm("Effacer la conversation ?") && saveContent({ ...content, chat: [] })}>Effacer</Button>}
      </div>

      <div className="max-h-[560px] min-h-[160px] space-y-4 overflow-y-auto pr-1">
        {!chat.length && streaming == null && <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">Demande des idées, un scénario ou le prompt complet. Les boutons ci-dessous envoient les demandes les plus courantes.</p>}
        {chat.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-white px-4 py-3 text-sm text-black whitespace-pre-wrap">{m.content}</div>
          ) : (
            <div key={i} className="rounded-3xl rounded-bl-md bg-surface-2 p-4">
              <Markdown text={m.content} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button small tone="lime" icon="check" onClick={() => savePrompt(m.content)}>{extractCodeBlock(m.content) ? "Enregistrer le prompt" : "Enregistrer comme prompt"}</Button>
                <Button small tone="ghost" onClick={() => saveScript(m.content)}>Utiliser comme scénario</Button>
                <Button small tone="ghost" icon="copy" onClick={() => navigator.clipboard.writeText(extractCodeBlock(m.content) ?? m.content)}>Copier</Button>
              </div>
            </div>
          ),
        )}
        {streaming != null && (
          <div className="rounded-3xl rounded-bl-md bg-surface-2 p-4">
            {streaming ? <Markdown text={streaming} /> : <p className="animate-pulse text-sm text-muted">L&apos;agent réfléchit…</p>}
          </div>
        )}
        <div ref={bottom} />
      </div>

      {error && <p className="mt-3 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK.map((q) => <Button key={q.label} small tone="ghost" disabled={streaming != null} onClick={() => send(q.prompt)}>{q.label}</Button>)}
      </div>
      <div className="mt-3 rounded-2xl bg-surface-2 p-3">
        <p className="text-xs text-muted">Avec ton abonnement Claude, sans clé API : copie la demande avec tout le contexte, colle-la dans Claude.ai, puis colle le prompt obtenu dans « Versions du prompt ».</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <Button key={q.label} small tone="white" icon={copied === q.label ? "check" : "copy"} onClick={() => copyForClaude(q.label, q.prompt)}>{q.label}</Button>
          ))}
        </div>
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea className="input flex-1" rows={2} placeholder="Ex. la sortie a perdu les taches de rousseur, corrige le prompt" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <Button type="submit" tone="lime" icon="send" disabled={!input.trim() || streaming != null} className="self-end">Envoyer</Button>
      </form>
    </Card>
  );
}

function PromptVersions({ content, store }: { content: Content; store: Store }) {
  const [open, setOpen] = useState<string | null>(content.prompts[0]?.id ?? null);
  const [manual, setManual] = useState("");
  const setNote = (id: string, note: string) => saveContent({ ...content, prompts: content.prompts.map((p) => (p.id === id ? { ...p, note } : p)) });
  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold">Versions du prompt</h3>
      <p className="mb-4 text-xs text-muted">Chaque version garde la trace de l&apos;agent utilisé. Note ce qui a changé et ce que la génération a donné.</p>
      <div className="space-y-3">
        {content.prompts.map((p, i) => (
          <div key={p.id} className="rounded-2xl bg-surface-2">
            <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <span className="font-semibold">v{content.prompts.length - i}</span>
              <span className="flex-1 truncate text-sm text-muted">{p.note || new Date(p.createdAt).toLocaleString("fr-FR")}</span>
              <span className="text-xs text-muted">{store.agentVersions.find((a) => a.id === p.agentVersionId)?.label.split(" ")[0] ?? ""}</span>
            </button>
            {open === p.id && (
              <div className="space-y-3 px-4 pb-4">
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl bg-black p-3 text-xs leading-relaxed">{p.text}</pre>
                <input className="input" placeholder="Note : ce qui change, ce que ça a donné…" value={p.note} onChange={(e) => setNote(p.id, e.target.value)} />
                <div className="flex gap-2">
                  <Button small icon="copy" onClick={() => navigator.clipboard.writeText(p.text)}>Copier</Button>
                  <Button small tone="danger" icon="trash" onClick={() => saveContent({ ...content, prompts: content.prompts.filter((x) => x.id !== p.id) })} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted">Coller une version écrite à la main</summary>
        <textarea className="input mt-3 font-mono text-xs" rows={5} value={manual} onChange={(e) => setManual(e.target.value)} />
        <Button small tone="white" className="mt-2" disabled={!manual.trim()} onClick={() => { saveContent({ ...content, prompts: [{ id: uid(), text: manual.trim(), note: "Version manuelle", agentVersionId: null, createdAt: now() }, ...content.prompts] }); setManual(""); }}>Ajouter</Button>
      </details>
    </Card>
  );
}

function GenerationPanel({ content, store }: { content: Content; store: Store }) {
  const influencer = store.influencers.find((i) => i.id === content.influencerId);
  const [model, setModel] = useState(store.settings.higgsfieldModel);
  const [duration, setDuration] = useState(content.attributes.durationSec ?? 7);
  const [resolution, setResolution] = useState("720p");
  const [ratio, setRatio] = useState("9:16");
  const [image, setImage] = useState(influencer?.references[0]?.url ?? "");
  const [seed, setSeed] = useState("42");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prompt = content.prompts[0];
  const price = store.settings.pricePerSecond;
  const cost = price != null ? price * duration : null;
  const cap = store.settings.budgetCap;
  const overCap = cap != null && cost != null && store.settings.spent + cost > cap;

  const patchGen = (genId: string, patch: Partial<Generation>) =>
    update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, generations: c.generations.map((g) => (g.id === genId ? { ...g, ...patch } : g)) } : c)) }));

  const poll = async (genId: string, requestId: string) => {
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const res = await fetch(`/api/higgsfield?id=${encodeURIComponent(requestId)}`);
      const data = await res.json();
      if (!res.ok) {
        patchGen(genId, { status: data.error ?? "erreur" });
        return;
      }
      const status = String(data.status ?? "");
      const url = findUrl(data);
      patchGen(genId, { status, videoUrl: url ?? "" });
      if (["completed", "failed", "nsfw", "canceled", "cancelled"].includes(status)) {
        if (status === "completed" && url) update((s) => ({ ...s, contents: s.contents.map((c) => (c.id === content.id ? { ...c, status: c.status === "prompt" ? "genere" : c.status, videoUrl: c.videoUrl || url } : c)) }));
        return;
      }
    }
  };

  const launch = async () => {
    if (!prompt) return;
    const msg = cost != null ? `Lancer une génération de ${duration} s en ${resolution} ? Coût estimé : ${cost.toFixed(2)} (une sortie ratée est facturée).` : `Lancer une génération de ${duration} s en ${resolution} ? Aucun tarif renseigné dans les réglages, le coût n'est pas estimé.`;
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { prompt: prompt.text, duration, resolution, aspect_ratio: ratio };
      if (image) payload.image_url = image;
      if (seed) payload.seed = Number(seed);
      const res = await fetch("/api/higgsfield", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, payload }) });
      const data = await res.json();
      if (!res.ok) throw new Error(`${data.error ?? "Erreur"} ${data.detail ? JSON.stringify(data.detail).slice(0, 200) : ""}`);
      const requestId = String(data.request_id ?? data.id ?? "");
      const gen: Generation = { id: uid(), requestId, model, status: String(data.status ?? "queued"), videoUrl: "", promptVersionId: prompt.id, estimatedCost: cost, createdAt: now() };
      update((s) => ({
        ...s,
        settings: { ...s.settings, spent: s.settings.spent + (cost ?? 0) },
        contents: s.contents.map((c) => (c.id === content.id ? { ...c, generations: [gen, ...c.generations] } : c)),
      }));
      if (requestId) poll(gen.id, requestId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold">Générer avec Higgsfield</h3>
      <p className="mb-4 text-xs text-muted">Envoie la dernière version du prompt. Itère en 720p, monte en résolution une fois le plan validé. Vérifie la page du modèle pour les paramètres acceptés.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Modèle" className="sm:col-span-2 lg:col-span-3"><input className="input font-mono text-xs" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
        <Field label="Durée (s)"><input className="input" type="number" min={1} max={15} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 5)} /></Field>
        <Field label="Résolution"><select className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}><option>480p</option><option>720p</option><option>1080p</option></select></Field>
        <Field label="Format"><select className="input" value={ratio} onChange={(e) => setRatio(e.target.value)}><option>9:16</option><option>1:1</option><option>16:9</option></select></Field>
        <Field label="Image de départ (URL)" className="sm:col-span-2"><input className="input" list="refs" value={image} onChange={(e) => setImage(e.target.value)} /><datalist id="refs">{influencer?.references.map((r) => <option key={r.url} value={r.url}>{r.label}</option>)}</datalist></Field>
        <Field label="Seed"><input className="input" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ""))} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button tone="lime" icon="play" disabled={!prompt || busy || overCap} onClick={launch}>{busy ? "Envoi…" : "Lancer la génération"}</Button>
        <span className="text-sm text-muted">
          {!prompt ? "Enregistre d'abord une version du prompt." : cost != null ? `Coût estimé ${cost.toFixed(2)} · dépensé ${store.settings.spent.toFixed(2)}${cap != null ? ` / ${cap}` : ""}` : "Renseigne le tarif dans Agent & réglages pour estimer le coût."}
        </span>
      </div>
      {image && !/^https?:\/\//.test(image) && <p className="mt-2 text-sm text-muted">Cette image n&apos;est pas accessible publiquement : Higgsfield ne pourra pas la lire. Colle un lien public (par exemple l&apos;URL de l&apos;image sur Higgsfield) ou utilise un stockage Blob public.</p>}
      {overCap && <p className="mt-2 text-sm text-danger">Ce lancement dépasserait ton plafond de budget.</p>}
      {error && <p className="mt-3 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {content.generations.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {content.generations.map((g) => (
            <div key={g.id} className="rounded-2xl bg-surface-2 p-3 text-sm">
              {g.videoUrl ? <video src={g.videoUrl} controls className="mb-2 aspect-[9/16] w-full rounded-xl bg-black object-cover" /> : <div className="mb-2 grid aspect-[9/16] place-items-center rounded-xl bg-black text-muted"><Icon name="clock" /></div>}
              <p className="font-medium">{g.status}</p>
              <p className="text-xs text-muted">{new Date(g.createdAt).toLocaleString("fr-FR")} · v{content.prompts.length - content.prompts.findIndex((p) => p.id === g.promptVersionId)}</p>
              {g.videoUrl && <Button small tone="ghost" className="mt-2" onClick={() => saveContent({ ...content, videoUrl: g.videoUrl })}>Choisir comme vidéo finale</Button>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function findUrl(data: Record<string, unknown>): string | null {
  for (const key of ["video", "videos", "outputs", "results", "images"]) {
    const v = data[key];
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    for (const item of arr) {
      const u = typeof item === "string" ? item : (item as { url?: string })?.url;
      if (u) return u;
    }
  }
  for (const key of ["video_url", "url", "output"]) {
    const v = data[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

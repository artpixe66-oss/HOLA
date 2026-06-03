'use client';

import { useState, useMemo } from 'react';
import { useProspects } from '@/lib/useProspects';
import { generateMessage } from '@/lib/messages';
import type { ProspectType, ProspectStatus } from '@/lib/types';

const STATUSES: ProspectStatus[] = ['À contacter', 'Contacté', 'Intéressé', 'Client', 'Perdu', 'Pas intéressé'];

export default function CampagnePage() {
  const { prospects } = useProspects();
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | ''>('À contacter');
  const [filterType, setFilterType] = useState<ProspectType | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<{ id: string; name: string; company: string; phone: string; message: string }[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const { updateProspect } = useProspects();

  const filtered = useMemo(() => prospects.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterType && p.type !== filterType) return false;
    return !!p.phone;
  }), [prospects, filterStatus, filterType]);

  function toggleAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  }

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function startCampaign() {
    const items = prospects
      .filter(p => selected.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        company: p.company,
        phone: p.phone,
        message: generateMessage(p.type as ProspectType, 'whatsapp', p.name, p.company, p.city).body,
      }));
    setQueue(items);
    setQueueIndex(0);
    setSent(new Set());
  }

  function openWhatsApp() {
    if (!queue) return;
    const item = queue[queueIndex];
    const phone = item.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(item.message)}`;
    window.open(url, '_blank');
    updateProspect(item.id, { status: 'Contacté' });
    setSent(prev => new Set([...prev, item.id]));
  }

  function next() {
    setQueueIndex(i => i + 1);
    setCopied(false);
  }

  function copyMessage() {
    if (!queue) return;
    navigator.clipboard.writeText(queue[queueIndex].message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setQueue(null);
    setSelected(new Set());
    setQueueIndex(0);
    setSent(new Set());
  }

  const current = queue?.[queueIndex];
  const progress = queue ? Math.round((queueIndex / queue.length) * 100) : 0;

  // ── Campaign mode ──
  if (queue) {
    if (queueIndex >= queue.length) {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold text-white mb-2">Campagne terminée !</h1>
          <p className="text-brand-muted mb-6">{sent.size} message{sent.size > 1 ? 's' : ''} envoyé{sent.size > 1 ? 's' : ''} sur {queue.length}</p>
          <button onClick={reset} className="px-6 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors">
            Nouvelle campagne
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-white">Campagne WhatsApp</h1>
          <span className="text-sm text-brand-muted">{queueIndex + 1} / {queue.length}</span>
        </div>
        <div className="h-2 bg-brand-bg rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Current prospect */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{current!.company}</h2>
              {current!.name && <p className="text-sm text-brand-muted">{current!.name}</p>}
              <p className="text-sm text-brand-muted mt-0.5">📞 {current!.phone}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800">
              WhatsApp
            </span>
          </div>

          {/* Message preview */}
          <div className="bg-brand-bg rounded-xl p-4 mb-4 text-sm text-white whitespace-pre-wrap leading-relaxed border border-brand-border/50 max-h-72 overflow-y-auto">
            {current!.message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={openWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors text-sm"
            >
              <span>💬</span> Ouvrir WhatsApp
            </button>
            <button
              onClick={copyMessage}
              className="px-4 py-3 rounded-xl border border-brand-border text-brand-muted hover:text-white hover:bg-brand-surface transition-colors text-sm"
            >
              {copied ? '✓ Copié' : '📋 Copier'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={next}
            className="flex-1 px-5 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-white hover:bg-brand-surface transition-colors text-sm">
            Passer → Suivant
          </button>
          <button onClick={reset}
            className="px-4 py-2.5 rounded-xl border border-red-900 text-red-400 hover:bg-red-900/20 transition-colors text-sm">
            Arrêter
          </button>
        </div>

        {/* Remaining list */}
        {queue.length > 1 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-brand-muted mb-2">File d&apos;attente</p>
            <div className="space-y-1">
              {queue.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                  i === queueIndex ? 'bg-brand-blue/10 border border-brand-blue/30 text-white' :
                  sent.has(item.id) ? 'text-brand-muted/40 line-through' : 'text-brand-muted'
                }`}>
                  <span>{sent.has(item.id) ? '✓' : i === queueIndex ? '▶' : `${i + 1}.`}</span>
                  <span className="font-medium">{item.company}</span>
                  <span className="text-brand-muted/60">{item.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Selection mode ──
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campagne WhatsApp</h1>
          <p className="text-brand-muted text-sm mt-0.5">Sélectionne les prospects et envoie les messages un par un</p>
        </div>
        {selected.size > 0 && (
          <button onClick={startCampaign}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors text-sm flex items-center gap-2">
            💬 Lancer ({selected.size} message{selected.size > 1 ? 's' : ''})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ProspectStatus | '')}
          className="bg-brand-surface border border-brand-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as ProspectType | '')}
          className="bg-brand-surface border border-brand-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
          <option value="">Tous les types</option>
          <option value="commerçant">Commerçant</option>
          <option value="producteur">Producteur</option>
          <option value="artisan">Artisan</option>
        </select>
        <span className="text-xs text-brand-muted">
          {filtered.length} prospect{filtered.length !== 1 ? 's' : ''} avec numéro
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-4xl mb-3">📵</p>
          <p className="text-sm">Aucun prospect avec un numéro de téléphone pour ce filtre</p>
        </div>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="accent-brand-blue" />
                </th>
                {['Entreprise', 'Téléphone', 'Ville', 'Statut', 'Type'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-brand-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-brand-bg/50 transition-colors cursor-pointer ${selected.has(p.id) ? 'bg-brand-blue/5' : ''}`}
                  onClick={() => toggle(p.id)}>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-brand-blue" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{p.company || p.name}</div>
                    {p.name && p.company && <div className="text-xs text-brand-muted">{p.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-brand-muted whitespace-nowrap">{p.phone}</td>
                  <td className="px-4 py-3 text-brand-muted">{p.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'À contacter' ? 'bg-[#1e2d4a] text-brand-muted' :
                      p.status === 'Contacté' ? 'bg-[#1a2d5a] text-brand-blue' :
                      p.status === 'Intéressé' ? 'bg-[#2d2500] text-amber-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-muted">{p.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

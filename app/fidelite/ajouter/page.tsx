'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addCard, CATEGORIES, COULEURS } from '@/lib/fidelite';

export default function AjouterCartePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    commercant: '',
    categorie: 'Café',
    emoji: '☕',
    couleur: '#3b7bff',
    points: 0,
    pointsMax: 10,
    recompense: '',
  });

  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.commercant.trim() || !form.recompense.trim()) return;
    addCard(form);
    router.push('/fidelite');
  }

  const preview_pct = Math.min(100, (form.points / (form.pointsMax || 1)) * 100);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/fidelite" className="text-brand-muted hover:text-white transition-colors text-sm">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-white">Nouvelle carte fidélité</h1>
      </div>

      {/* Preview */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl mb-8"
        style={{
          background: `linear-gradient(135deg, ${form.couleur}22 0%, ${form.couleur}44 100%)`,
          border: `1.5px solid ${form.couleur}55`,
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
          style={{ background: form.couleur }}
        />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-3xl mb-1">{form.emoji || '🏪'}</div>
              <h3 className="text-white font-bold text-lg">{form.commercant || 'Nom du commerce'}</h3>
              <p className="text-white/50 text-xs">{form.categorie}</p>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-2xl">{form.points}</div>
              <div className="text-white/50 text-xs">/ {form.pointsMax} pts</div>
            </div>
          </div>
          <div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${preview_pct}%`, background: form.couleur }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-white/40 text-xs">{Math.round(preview_pct)}%</span>
              <span className="text-white/70 text-xs font-medium">{form.recompense || 'Votre récompense'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Nom du commerce *</label>
          <input
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-blue"
            placeholder="ex: Café Lumière"
            value={form.commercant}
            onChange={(e) => set('commercant', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Catégorie & Emoji</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(({ label, emoji }) => (
              <button
                key={label}
                type="button"
                onClick={() => { set('categorie', label); set('emoji', emoji); }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-colors ${
                  form.categorie === label
                    ? 'border-brand-blue bg-brand-blue/10 text-white'
                    : 'border-brand-border text-brand-muted hover:border-brand-muted'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Couleur de la carte</label>
          <div className="flex gap-2 flex-wrap">
            {COULEURS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => set('couleur', value)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  form.couleur === value ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ background: value }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-brand-muted mb-1.5">Points actuels</label>
            <input
              type="number"
              min={0}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-blue"
              value={form.points}
              onChange={(e) => set('points', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm text-brand-muted mb-1.5">Objectif (max)</label>
            <input
              type="number"
              min={1}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-blue"
              value={form.pointsMax}
              onChange={(e) => set('pointsMax', Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-brand-muted mb-1.5">Récompense *</label>
          <input
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-blue"
            placeholder="ex: 1 café offert, -20% sur votre achat..."
            value={form.recompense}
            onChange={(e) => set('recompense', e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
        >
          Ajouter la carte
        </button>
      </form>
    </div>
  );
}

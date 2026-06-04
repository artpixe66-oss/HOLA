'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Programme } from '@/lib/types';
import { COULEURS, CATEGORIES } from '@/lib/types';

export default function CommercantPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: '', description: '', emoji: '☕', couleur: '#3b7bff',
    points_par_visite: 1, points_objectif: 10, recompense: ''
  });

  async function charger() {
    const { data } = await supabase.from('programmes').select('*').order('created_at', { ascending: false });
    setProgrammes(data ?? []);
  }

  useEffect(() => { charger(); }, []);

  function set(k: string, v: string | number) { setForm((f) => ({ ...f, [k]: v })); }

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from('programmes').insert({ ...form, commercant_id: 'demo' });
    await charger();
    setShowForm(false);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Espace Commerçant</h1>
          <p className="text-[#8b9fc4] text-sm mt-1">{programmes.length} programme{programmes.length > 1 ? 's' : ''} actif{programmes.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#3b7bff] hover:bg-[#2563eb] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          + Nouveau programme
        </button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="bg-[#0f1729] border border-[#1e2d4a] rounded-2xl p-6 mb-8 flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Créer un programme fidélité</h2>
          <div>
            <label className="block text-sm text-[#8b9fc4] mb-1.5">Nom du commerce *</label>
            <input className="w-full bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]" placeholder="ex: Café Lumière" value={form.nom} onChange={(e) => set('nom', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-[#8b9fc4] mb-1.5">Description</label>
            <input className="w-full bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]" placeholder="ex: Gagnez un café offert tous les 10 visites" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#8b9fc4] mb-1.5">Catégorie & Emoji</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(({ label, emoji }) => (
                <button key={label} type="button" onClick={() => set('emoji', emoji)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-colors ${form.emoji === emoji ? 'border-[#3b7bff] bg-[#3b7bff]/10 text-white' : 'border-[#1e2d4a] text-[#8b9fc4]'}`}>
                  <span className="text-xl">{emoji}</span><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#8b9fc4] mb-1.5">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {COULEURS.map((c) => (
                <button key={c} type="button" onClick={() => set('couleur', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${form.couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8b9fc4] mb-1.5">Points par visite</label>
              <input type="number" min={1} className="w-full bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]" value={form.points_par_visite} onChange={(e) => set('points_par_visite', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-[#8b9fc4] mb-1.5">Objectif (points)</label>
              <input type="number" min={1} className="w-full bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]" value={form.points_objectif} onChange={(e) => set('points_objectif', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#8b9fc4] mb-1.5">Récompense *</label>
            <input className="w-full bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]" placeholder="ex: 1 café offert" value={form.recompense} onChange={(e) => set('recompense', e.target.value)} required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[#1e2d4a] text-[#8b9fc4] text-sm">Annuler</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: form.couleur }}>
              {loading ? 'Création...' : 'Créer le programme'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {programmes.map((p) => (
          <Link key={p.id} href={`/commercant/${p.id}`} className="bg-[#0f1729] border border-[#1e2d4a] hover:border-[#3b7bff] rounded-2xl p-5 flex items-center gap-4 transition-colors group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: p.couleur + '22' }}>{p.emoji}</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{p.nom}</h3>
              <p className="text-[#8b9fc4] text-xs">{p.recompense} · {p.points_objectif} pts</p>
            </div>
            <span className="text-[#3b7bff] text-sm group-hover:underline">Gérer →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

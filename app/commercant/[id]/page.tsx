'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Programme, Carte } from '@/lib/types';

function genNumero() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join(' ');
}

export default function GererProgrammePage() {
  const { id } = useParams<{ id: string }>();
  const [prog, setProg] = useState<Programme | null>(null);
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [pts, setPts] = useState('');
  const [selectedCarte, setSelectedCarte] = useState<string | null>(null);

  async function charger() {
    const { data: p } = await supabase.from('programmes').select('*').eq('id', id).single();
    setProg(p);
    const { data: c } = await supabase.from('cartes').select('*').eq('programme_id', id).order('created_at', { ascending: false });
    setCartes(c ?? []);
  }

  useEffect(() => { charger(); }, [id]);

  async function inscrireClient(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const { data: exist } = await supabase.from('cartes').select('id').eq('programme_id', id).eq('client_email', email.toLowerCase()).single();
    if (!exist) {
      await supabase.from('cartes').insert({ programme_id: id, client_nom: nom, client_email: email.toLowerCase(), points: 0, numero: genNumero() });
    }
    await charger();
    setNom(''); setEmail('');
    setAdding(false);
  }

  async function ajouterPoints(carteId: string, points: number) {
    const carte = cartes.find((c) => c.id === carteId);
    if (!carte || !prog) return;
    const newPoints = Math.max(0, carte.points + points);
    await supabase.from('cartes').update({ points: newPoints }).eq('id', carteId);
    await supabase.from('transactions').insert({ carte_id: carteId, points, description: points > 0 ? `+${points} pt${points > 1 ? 's' : ''} — visite` : `${points} pts` });
    await charger();
    setSelectedCarte(null);
    setPts('');
  }

  if (!prog) return <div className="text-center py-20 text-[#8b9fc4]">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/commercant" className="text-[#8b9fc4] hover:text-white text-sm mb-8 inline-block">← Retour</Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: prog.couleur + '33' }}>{prog.emoji}</div>
        <div>
          <h1 className="text-2xl font-bold">{prog.nom}</h1>
          <p className="text-[#8b9fc4] text-sm">Objectif : {prog.points_objectif} pts → {prog.recompense}</p>
        </div>
      </div>

      {/* Inscrire un client */}
      <div className="bg-[#0f1729] border border-[#1e2d4a] rounded-2xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-4">Inscrire un client</h2>
        <form onSubmit={inscrireClient} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b7bff]" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <input type="email" className="bg-[#080d1a] border border-[#1e2d4a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b7bff]" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors" style={{ background: prog.couleur }}>
            {adding ? 'Inscription...' : 'Inscrire le client'}
          </button>
        </form>
      </div>

      {/* Liste des clients */}
      <div className="bg-[#0f1729] border border-[#1e2d4a] rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">{cartes.length} client{cartes.length > 1 ? 's' : ''}</h2>
        {cartes.length === 0 ? (
          <p className="text-[#8b9fc4] text-sm">Aucun client encore inscrit.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cartes.map((c) => {
              const pct = Math.min(100, (c.points / prog.points_objectif) * 100);
              return (
                <div key={c.id} className="border border-[#1e2d4a] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{c.client_nom}</p>
                      <p className="text-[#8b9fc4] text-xs">{c.client_email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{c.points}</span>
                      <span className="text-[#8b9fc4] text-xs"> / {prog.points_objectif} pts</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: prog.couleur }} />
                  </div>
                  {selectedCarte === c.id ? (
                    <div className="flex gap-2">
                      <input type="number" placeholder="pts (ex: +1 ou -1)" className="flex-1 bg-[#080d1a] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#3b7bff]" value={pts} onChange={(e) => setPts(e.target.value)} />
                      <button onClick={() => ajouterPoints(c.id, parseInt(pts))} className="px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ background: prog.couleur }}>OK</button>
                      <button onClick={() => { setSelectedCarte(null); setPts(''); }} className="px-3 py-1.5 rounded-lg text-[#8b9fc4] text-sm border border-[#1e2d4a]">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => ajouterPoints(c.id, prog.points_par_visite)} className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: prog.couleur }}>+{prog.points_par_visite} pt visite</button>
                      <button onClick={() => { setSelectedCarte(c.id); setPts(''); }} className="px-3 py-1.5 rounded-lg text-[#8b9fc4] text-xs border border-[#1e2d4a]">Autre</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

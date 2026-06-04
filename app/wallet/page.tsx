'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Carte } from '@/lib/types';

export default function WalletPage() {
  const [email, setEmail] = useState('');
  const [input, setInput] = useState('');
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [loading, setLoading] = useState(false);

  async function charger(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase
      .from('cartes')
      .select('*, programme:programmes(*)')
      .eq('client_email', input.trim().toLowerCase());
    setCartes(data ?? []);
    setEmail(input.trim().toLowerCase());
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Mon Wallet</h1>
      <p className="text-[#8b9fc4] text-sm mb-8">Entrez votre email pour retrouver vos cartes fidélité.</p>

      <form onSubmit={charger} className="flex gap-3 mb-8">
        <input
          type="email"
          placeholder="votre@email.com"
          className="flex-1 bg-[#0f1729] border border-[#1e2d4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3b7bff]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <button type="submit" className="bg-[#3b7bff] hover:bg-[#2563eb] text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors">
          {loading ? '...' : 'Voir mes cartes'}
        </button>
      </form>

      {email && cartes.length === 0 && (
        <div className="text-center py-16 text-[#8b9fc4]">
          <div className="text-4xl mb-3">🎴</div>
          <p>Aucune carte trouvée pour <strong className="text-white">{email}</strong></p>
          <p className="text-sm mt-1">Demandez à votre commerçant de vous inscrire.</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {cartes.map((carte) => {
          const prog = carte.programme;
          if (!prog) return null;
          const pct = Math.min(100, (carte.points / prog.points_objectif) * 100);
          return (
            <Link key={carte.id} href={`/wallet/${carte.id}`} className="block group">
              <div className="relative rounded-2xl overflow-hidden shadow-xl transition-transform group-hover:scale-[1.01]"
                style={{ background: `linear-gradient(135deg, ${prog.couleur}22, ${prog.couleur}44)`, border: `1.5px solid ${prog.couleur}55` }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: prog.couleur }} />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl mb-1">{prog.emoji}</div>
                      <h3 className="text-white font-bold text-lg">{prog.nom}</h3>
                      <p className="text-white/50 text-xs">{carte.client_nom}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-2xl">{carte.points}</div>
                      <div className="text-white/50 text-xs">/ {prog.points_objectif} pts</div>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: prog.couleur }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">{Math.round(pct)}%</span>
                    <span className="text-white/70 text-xs font-medium">{prog.recompense}</span>
                  </div>
                  <div className="mt-3 text-white/20 text-xs font-mono tracking-widest">{carte.numero}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

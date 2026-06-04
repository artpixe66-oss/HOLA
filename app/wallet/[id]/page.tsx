'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import type { Carte, Transaction } from '@/lib/types';

export default function CarteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [carte, setCarte] = useState<Carte | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase.from('cartes').select('*, programme:programmes(*)').eq('id', id).single()
      .then(({ data }) => setCarte(data));
    supabase.from('transactions').select('*').eq('carte_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setTransactions(data ?? []));
  }, [id]);

  useEffect(() => {
    if (showQR && canvasRef.current && carte) {
      QRCode.toCanvas(canvasRef.current, `FIDELITE:${carte.id}`, {
        width: 220, color: { dark: '#ffffff', light: '#00000000' },
      });
    }
  }, [showQR, carte]);

  if (!carte || !carte.programme) return <div className="text-center py-20 text-[#8b9fc4]">Chargement...</div>;

  const prog = carte.programme!;
  const pct = Math.min(100, (carte.points / prog.points_objectif) * 100);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/wallet" className="text-[#8b9fc4] hover:text-white text-sm mb-8 inline-block">← Retour au wallet</Link>

      <div className="relative rounded-2xl overflow-hidden shadow-xl mb-6"
        style={{ background: `linear-gradient(135deg, ${prog.couleur}22, ${prog.couleur}44)`, border: `1.5px solid ${prog.couleur}55` }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: prog.couleur }} />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-4xl mb-1">{prog.emoji}</div>
              <h2 className="text-white font-bold text-xl">{prog.nom}</h2>
              <p className="text-white/50 text-xs">{carte.client_nom}</p>
            </div>
            <button onClick={() => setShowQR(!showQR)} className="flex flex-col items-center text-white/50 hover:text-white transition-colors">
              <span className="text-2xl">⬛</span>
              <span className="text-xs">QR Code</span>
            </button>
          </div>

          {showQR && (
            <div className="flex justify-center mb-4 bg-black/30 rounded-xl p-4">
              <canvas ref={canvasRef} />
              <p className="text-white/40 text-xs text-center mt-2">Montrez ce QR au commerçant</p>
            </div>
          )}

          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-white font-bold text-4xl">{carte.points}</span>
              <span className="text-white/40 text-lg ml-1">/ {prog.points_objectif} pts</span>
            </div>
            {pct >= 100 && <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full animate-pulse">🎉 Récompense dispo !</span>}
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: prog.couleur }} />
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-white/40 text-xs">{Math.round(pct)}% — {prog.recompense}</span>
          </div>
          <div className="text-white/20 text-xs font-mono tracking-widest">{carte.numero}</div>
        </div>
      </div>

      <div className="bg-[#0f1729] border border-[#1e2d4a] rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Historique</h3>
        {transactions.length === 0 ? (
          <p className="text-[#8b9fc4] text-sm">Aucune transaction</p>
        ) : (
          <div className="flex flex-col">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[#1e2d4a] last:border-0">
                <div>
                  <p className="text-white text-sm">{t.description}</p>
                  <p className="text-[#8b9fc4] text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-sm font-bold ${t.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.points > 0 ? '+' : ''}{t.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

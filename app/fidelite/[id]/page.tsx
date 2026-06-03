'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getCards, addPoints, deleteCard, type LoyaltyCard } from '@/lib/fidelite';

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [addPts, setAddPts] = useState('');
  const [desc, setDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function reload() {
    const c = getCards().find((c) => c.id === id);
    setCard(c ?? null);
  }

  useEffect(() => { reload(); }, [id]);

  useEffect(() => {
    if (showQR && canvasRef.current && card) {
      QRCode.toCanvas(canvasRef.current, `FIDELITE:${card.id}:${card.commercant}:${card.numero}`, {
        width: 200,
        color: { dark: '#ffffff', light: '#00000000' },
      });
    }
  }, [showQR, card]);

  if (!card) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-brand-muted">
        <p>Carte introuvable.</p>
        <Link href="/fidelite" className="text-brand-blue hover:underline text-sm mt-2 inline-block">← Retour au wallet</Link>
      </div>
    );
  }

  const pct = Math.min(100, (card.points / card.pointsMax) * 100);

  function handleAddPoints(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(addPts);
    if (!pts || !desc.trim()) return;
    addPoints(card!.id, pts, desc);
    setAddPts('');
    setDesc('');
    reload();
  }

  function handleDelete() {
    deleteCard(card!.id);
    router.push('/fidelite');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/fidelite" className="text-brand-muted hover:text-white transition-colors text-sm">← Retour</Link>
      </div>

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl mb-6"
        style={{
          background: `linear-gradient(135deg, ${card.couleur}22 0%, ${card.couleur}44 100%)`,
          border: `1.5px solid ${card.couleur}55`,
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: card.couleur }} />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-4xl mb-1">{card.emoji}</div>
              <h2 className="text-white font-bold text-xl">{card.commercant}</h2>
              <p className="text-white/50 text-xs">{card.categorie}</p>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
              title="Afficher le QR code"
            >
              <span className="text-2xl">⬛</span>
              <span className="text-xs">QR Code</span>
            </button>
          </div>

          {showQR && (
            <div className="flex justify-center mb-4 bg-black/30 rounded-xl p-4">
              <canvas ref={canvasRef} />
            </div>
          )}

          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-white font-bold text-4xl">{card.points}</span>
              <span className="text-white/40 text-lg ml-1">/ {card.pointsMax} pts</span>
            </div>
            {pct >= 100 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                🎉 Récompense disponible !
              </span>
            )}
          </div>

          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: card.couleur }} />
          </div>
          <div className="flex justify-between">
            <span className="text-white/40 text-xs">{Math.round(pct)}% complété</span>
            <span className="text-white/70 text-xs font-medium">{card.recompense}</span>
          </div>

          <div className="mt-4 text-white/20 text-xs font-mono tracking-widest">{card.numero}</div>
        </div>
      </div>

      {/* Add points form */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">Ajouter / Retirer des points</h3>
        <form onSubmit={handleAddPoints} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="ex: +5 ou -2"
              className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue"
              value={addPts}
              onChange={(e) => setAddPts(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description (ex: Achat)"
              className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: card.couleur }}
          >
            Valider
          </button>
        </form>
      </div>

      {/* Transactions */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">Historique</h3>
        {card.transactions.length === 0 ? (
          <p className="text-brand-muted text-sm">Aucune transaction</p>
        ) : (
          <div className="flex flex-col gap-2">
            {card.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-brand-border last:border-0">
                <div>
                  <p className="text-white text-sm">{t.description}</p>
                  <p className="text-brand-muted text-xs">{new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                {t.points !== 0 && (
                  <span className={`text-sm font-bold ${t.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.points > 0 ? '+' : ''}{t.points} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
        >
          Supprimer la carte
        </button>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-red-400 text-sm">Confirmer la suppression ?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="text-brand-muted text-sm hover:text-white px-3 py-1.5">Annuler</button>
            <button onClick={handleDelete} className="bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg">Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}

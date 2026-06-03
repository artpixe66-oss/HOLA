'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCards, addCard, getSeedCards, type LoyaltyCard } from '@/lib/fidelite';
import CardVisual from '@/components/fidelite/CardVisual';

export default function WalletPage() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let c = getCards();
    if (c.length === 0) {
      getSeedCards().forEach((s) => addCard(s));
      c = getCards();
    }
    setCards(c);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Wallet</h1>
          <p className="text-brand-muted text-sm mt-1">{cards.length} carte{cards.length > 1 ? 's' : ''} fidélité</p>
        </div>
        <Link
          href="/fidelite/ajouter"
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Ajouter une carte
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-brand-muted">
          <div className="text-5xl mb-4">🎴</div>
          <p className="text-lg font-medium text-white">Aucune carte fidélité</p>
          <p className="mt-1 text-sm">Ajoutez votre première carte pour commencer</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {cards.map((card) => (
            <Link key={card.id} href={`/fidelite/${card.id}`} className="block group">
              <CardVisual card={card} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

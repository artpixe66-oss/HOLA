'use client';

import { type LoyaltyCard } from '@/lib/fidelite';

type Props = {
  card: LoyaltyCard;
  compact?: boolean;
};

export default function CardVisual({ card, compact }: Props) {
  const pct = Math.min(100, (card.points / card.pointsMax) * 100);

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl transition-transform group-hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, ${card.couleur}22 0%, ${card.couleur}44 100%)`,
        border: `1.5px solid ${card.couleur}55`,
      }}
    >
      {/* Gradient orb */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
        style={{ background: card.couleur }}
      />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-3xl mb-1">{card.emoji}</div>
            <h3 className="text-white font-bold text-lg leading-tight">{card.commercant}</h3>
            <p className="text-white/50 text-xs">{card.categorie}</p>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-2xl">{card.points}</div>
            <div className="text-white/50 text-xs">/ {card.pointsMax} pts</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: card.couleur }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/40 text-xs">{Math.round(pct)}% vers la récompense</span>
            <span className="text-white/70 text-xs font-medium">{card.recompense}</span>
          </div>
        </div>

        {!compact && (
          <div className="text-white/30 text-xs font-mono tracking-widest">{card.numero}</div>
        )}
      </div>
    </div>
  );
}

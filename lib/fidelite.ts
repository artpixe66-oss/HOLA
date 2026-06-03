export type LoyaltyCard = {
  id: string;
  commercant: string;
  categorie: string;
  couleur: string;
  emoji: string;
  points: number;
  pointsMax: number;
  recompense: string;
  dateAjout: string;
  transactions: Transaction[];
  numero: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  points: number;
};

const STORAGE_KEY = 'fidelite_cards';

export const CATEGORIES = [
  { label: 'Restauration', emoji: '🍽️' },
  { label: 'Mode', emoji: '👗' },
  { label: 'Beauté', emoji: '💄' },
  { label: 'Sport', emoji: '🏋️' },
  { label: 'Épicerie', emoji: '🛒' },
  { label: 'Librairie', emoji: '📚' },
  { label: 'Café', emoji: '☕' },
  { label: 'Autre', emoji: '🏪' },
];

export const COULEURS = [
  { label: 'Bleu', value: '#3b7bff' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rose', value: '#ec4899' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Vert', value: '#10b981' },
  { label: 'Rouge', value: '#ef4444' },
  { label: 'Or', value: '#f59e0b' },
  { label: 'Cyan', value: '#06b6d4' },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function getCards(): LoyaltyCard[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCards(cards: LoyaltyCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addCard(data: Omit<LoyaltyCard, 'id' | 'dateAjout' | 'transactions' | 'numero'>): LoyaltyCard {
  const cards = getCards();
  const card: LoyaltyCard = {
    ...data,
    id: genId(),
    numero: Array.from({ length: 4 }, () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join(' '),
    dateAjout: new Date().toISOString(),
    transactions: [
      {
        id: genId(),
        date: new Date().toISOString(),
        description: 'Carte ajoutée',
        points: 0,
      },
    ],
  };
  saveCards([...cards, card]);
  return card;
}

export function addPoints(cardId: string, points: number, description: string) {
  const cards = getCards();
  const updated = cards.map((c) => {
    if (c.id !== cardId) return c;
    return {
      ...c,
      points: Math.max(0, c.points + points),
      transactions: [
        {
          id: genId(),
          date: new Date().toISOString(),
          description,
          points,
        },
        ...c.transactions,
      ],
    };
  });
  saveCards(updated);
}

export function deleteCard(id: string) {
  saveCards(getCards().filter((c) => c.id !== id));
}

export function getSeedCards(): Omit<LoyaltyCard, 'id' | 'dateAjout' | 'transactions' | 'numero'>[] {
  return [
    { commercant: 'Café Lumière', categorie: 'Café', emoji: '☕', couleur: '#f59e0b', points: 7, pointsMax: 10, recompense: '1 café offert' },
    { commercant: 'Boulangerie Martin', categorie: 'Épicerie', emoji: '🥐', couleur: '#f97316', points: 3, pointsMax: 8, recompense: 'Croissant offert' },
    { commercant: 'Sport Plus', categorie: 'Sport', emoji: '🏋️', couleur: '#10b981', points: 120, pointsMax: 200, recompense: '-20% sur ta prochaine commande' },
  ];
}

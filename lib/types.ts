export type Programme = {
  id: string;
  commercant_id: string;
  nom: string;
  description: string;
  emoji: string;
  couleur: string;
  points_par_visite: number;
  points_objectif: number;
  recompense: string;
  created_at: string;
};

export type Carte = {
  id: string;
  programme_id: string;
  client_nom: string;
  client_email: string;
  points: number;
  numero: string;
  created_at: string;
  programme?: Programme;
};

export type Transaction = {
  id: string;
  carte_id: string;
  points: number;
  description: string;
  created_at: string;
};

export const CATEGORIES = [
  { label: 'Restauration', emoji: '🍽️' },
  { label: 'Mode', emoji: '👗' },
  { label: 'Beauté', emoji: '💄' },
  { label: 'Sport', emoji: '🏋️' },
  { label: 'Épicerie', emoji: '🛒' },
  { label: 'Café', emoji: '☕' },
  { label: 'Librairie', emoji: '📚' },
  { label: 'Autre', emoji: '🏪' },
];

export const COULEURS = [
  '#3b7bff', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#ef4444', '#f59e0b', '#06b6d4',
];

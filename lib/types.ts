export type ProspectStatus = 'À contacter' | 'Contacté' | 'Intéressé' | 'Client' | 'Perdu' | 'Pas intéressé';
export type ProspectType = 'producteur' | 'commerçant' | 'artisan';

export interface Prospect {
  id: string;
  name: string;
  company: string;
  type: ProspectType;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  city: string;
  status: ProspectStatus;
  notes: string;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<ProspectStatus, number>;
  byType: Record<ProspectType, number>;
  conversionRate: number;
  topCities: { city: string; count: number }[];
}

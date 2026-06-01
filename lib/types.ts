export type ProspectStatus = 'À contacter' | 'Contacté' | 'Intéressé' | 'Client' | 'Perdu';
export type ProspectType = 'producteur' | 'commerçant';

export interface Prospect {
  id: number;
  name: string;
  company: string;
  type: ProspectType;
  email: string;
  phone: string;
  city: string;
  status: ProspectStatus;
  notes: string;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectInput {
  name: string;
  company: string;
  type: ProspectType;
  email: string;
  phone: string;
  city: string;
  status?: ProspectStatus;
  notes?: string;
  follow_up_date?: string | null;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<ProspectStatus, number>;
  byType: Record<ProspectType, number>;
  conversionRate: number;
  topCities: { city: string; count: number }[];
}

export interface MessageTemplate {
  type: 'email' | 'sms';
  prospectType: ProspectType;
  subject?: string;
  body: string;
}

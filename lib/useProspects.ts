'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Prospect, ProspectStatus, ProspectType } from './types';

const STORAGE_KEY = 'helpme_prospects';

function readStorage(): Prospect[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeStorage(prospects: Prospect[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
}

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProspects(readStorage());
    setLoaded(true);
  }, []);

  const addProspect = useCallback((input: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newProspect: Prospect = {
      ...input,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    setProspects(prev => {
      const next = [newProspect, ...prev];
      writeStorage(next);
      return next;
    });
    return newProspect;
  }, []);

  const updateProspect = useCallback((id: string, updates: Partial<Omit<Prospect, 'id' | 'created_at'>>) => {
    setProspects(prev => {
      const next = prev.map(p =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      );
      writeStorage(next);
      return next;
    });
  }, []);

  const deleteProspect = useCallback((id: string) => {
    setProspects(prev => {
      const next = prev.filter(p => p.id !== id);
      writeStorage(next);
      return next;
    });
  }, []);

  const importProspects = useCallback((rows: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]) => {
    const now = new Date().toISOString();
    const newProspects: Prospect[] = rows.map(row => ({
      ...row,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }));
    setProspects(prev => {
      const next = [...newProspects, ...prev];
      writeStorage(next);
      return next;
    });
    return newProspects.length;
  }, []);

  return { prospects, loaded, addProspect, updateProspect, deleteProspect, importProspects };
}

export function computeStats(prospects: Prospect[]) {
  const byStatus: Record<string, number> = {
    'À contacter': 0, 'Contacté': 0, 'Intéressé': 0, 'Client': 0, 'Perdu': 0,
  };
  const byType: Record<string, number> = { producteur: 0, 'commerçant': 0 };
  const cityMap: Record<string, number> = {};

  for (const p of prospects) {
    if (p.status in byStatus) byStatus[p.status]++;
    if (p.type in byType) byType[p.type]++;
    if (p.city) cityMap[p.city] = (cityMap[p.city] || 0) + 1;
  }

  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  const total = prospects.length;
  const clients = byStatus['Client'];

  return {
    total,
    byStatus: byStatus as Record<ProspectStatus, number>,
    byType: byType as Record<ProspectType, number>,
    conversionRate: total > 0 ? Math.round((clients / total) * 100) : 0,
    topCities,
  };
}

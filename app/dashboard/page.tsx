'use client';

import { useProspects, computeStats } from '@/lib/useProspects';
import type { ProspectStatus } from '@/lib/types';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  'À contacter': 'bg-brand-muted/40',
  'Contacté':    'bg-brand-blue',
  'Intéressé':   'bg-amber-400',
  'Client':      'bg-emerald-500',
  'Perdu':       'bg-red-500',
};

export default function DashboardPage() {
  const { prospects, loaded } = useProspects();
  const stats = computeStats(prospects);

  const statusEntries = Object.entries(stats.byStatus) as [ProspectStatus, number][];
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  if (!loaded) {
    return <div className="text-center py-12 text-brand-muted">Chargement...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Tableau de bord</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-brand-muted mt-1">Total prospects</div>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="text-3xl font-bold text-emerald-400">{stats.byStatus['Client']}</div>
          <div className="text-sm text-brand-muted mt-1">Clients</div>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="text-3xl font-bold text-brand-blue">{stats.conversionRate}%</div>
          <div className="text-sm text-brand-muted mt-1">Taux de conversion</div>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <div className="text-3xl font-bold text-amber-400">{stats.byStatus['Intéressé']}</div>
          <div className="text-sm text-brand-muted mt-1">Intéressés</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Par statut */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <h2 className="text-base font-semibold text-white mb-4">Par statut</h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-brand-muted">{status}</span>
                  <span className="font-medium text-white">{count}</span>
                </div>
                <div className="w-full bg-brand-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${STATUS_COLORS[status]}`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Par type */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <h2 className="text-base font-semibold text-white mb-4">Par type</h2>
          <div className="flex items-end gap-6 h-32">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-white">{count}</span>
                <div
                  className={`w-full rounded-t-lg ${type === 'producteur' ? 'bg-purple-500' : 'bg-orange-400'}`}
                  style={{ height: `${Math.max((count / (stats.total || 1)) * 80, 4)}px` }}
                />
                <span className="text-xs text-brand-muted capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top villes */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <h2 className="text-base font-semibold text-white mb-4">Top villes</h2>
          {stats.topCities.length === 0 ? (
            <p className="text-sm text-brand-muted">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {stats.topCities.map(({ city, count }, i) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-muted w-4">{i + 1}</span>
                  <span className="text-sm flex-1 text-brand-muted">{city}</span>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-5">
          <h2 className="text-base font-semibold text-white mb-4">Pipeline</h2>
          {stats.total === 0 ? (
            <p className="text-sm text-brand-muted">Aucun prospect</p>
          ) : (
            <div className="space-y-2 text-sm">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-brand-muted">{status}</span>
                  <span className="font-medium text-white">{stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

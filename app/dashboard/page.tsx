import { getDashboardStats } from '@/lib/db';
import type { ProspectStatus } from '@/lib/types';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  'À contacter': 'bg-gray-200',
  'Contacté':    'bg-blue-400',
  'Intéressé':   'bg-yellow-400',
  'Client':      'bg-green-500',
  'Perdu':       'bg-red-400',
};

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const stats = getDashboardStats();

  const statusEntries = Object.entries(stats.byStatus) as [ProspectStatus, number][];
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total prospects</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-green-600">{stats.byStatus['Client']}</div>
          <div className="text-sm text-gray-500 mt-1">Clients</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-blue-600">{stats.conversionRate}%</div>
          <div className="text-sm text-gray-500 mt-1">Taux de conversion</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-yellow-600">{stats.byStatus['Intéressé']}</div>
          <div className="text-sm text-gray-500 mt-1">Intéressés</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Par statut */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Par statut</h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Par type</h2>
          <div className="flex items-end gap-6 h-32">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{count}</span>
                <div
                  className={`w-full rounded-t-lg ${type === 'producteur' ? 'bg-purple-400' : 'bg-orange-400'}`}
                  style={{ height: `${Math.max((count / (stats.total || 1)) * 80, 4)}px` }}
                />
                <span className="text-xs text-gray-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top villes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top villes</h2>
          {stats.topCities.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {stats.topCities.map(({ city, count }, i) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm flex-1 text-gray-700">{city}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Pipeline</h2>
          {stats.total === 0 ? (
            <p className="text-sm text-gray-400">Aucun prospect</p>
          ) : (
            <div className="space-y-2 text-sm">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-medium">{stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

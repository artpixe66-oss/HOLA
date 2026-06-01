'use client';

import { useEffect, useState, useRef } from 'react';
import type { Prospect, ProspectStatus, ProspectType } from '@/lib/types';
import Link from 'next/link';

const STATUSES: ProspectStatus[] = ['À contacter', 'Contacté', 'Intéressé', 'Client', 'Perdu'];
const STATUS_COLORS: Record<ProspectStatus, string> = {
  'À contacter': 'bg-gray-100 text-gray-700',
  'Contacté':    'bg-blue-100 text-blue-700',
  'Intéressé':   'bg-yellow-100 text-yellow-700',
  'Client':      'bg-green-100 text-green-700',
  'Perdu':       'bg-red-100 text-red-700',
};

const EMPTY: Partial<Prospect> = { name: '', company: '', type: 'commerçant', email: '', phone: '', city: '', status: 'À contacter', notes: '' };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | ''>('');
  const [filterType, setFilterType] = useState<ProspectType | ''>('');
  const [editing, setEditing] = useState<Partial<Prospect> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch('/api/prospects');
    setProspects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = prospects.filter(p => {
    const matchSearch = !search || [p.name, p.company, p.city, p.email, p.phone].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchType = !filterType || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  async function saveProspect() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    await fetch('/api/prospects', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function deleteProspect(id: number) {
    if (!confirm('Supprimer ce prospect ?')) return;
    await fetch(`/api/prospects?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function updateStatus(id: number, status: ProspectStatus) {
    await fetch('/api/prospects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Import en cours...');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.error) { setImportStatus(`Erreur : ${data.error}`); return; }
    setImportStatus(`${data.inserted} prospects importés avec succès.`);
    load();
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
        <div className="flex gap-3">
          <label className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            Importer CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => { setEditing({ ...EMPTY }); setShowForm(true); }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nouveau prospect
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${importStatus.startsWith('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {importStatus}
          <button onClick={() => setImportStatus('')} className="ml-3 font-bold">×</button>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ProspectStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as ProspectType | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les types</option>
          <option value="producteur">Producteur</option>
          <option value="commerçant">Commerçant</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nom', 'Entreprise', 'Type', 'Ville', 'Contact', 'Statut', 'Relance', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun prospect trouvé</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.company}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'producteur' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.city}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.email && <div>{p.email}</div>}
                    {p.phone && <div>{p.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value as ProspectStatus)}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[p.status]}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.follow_up_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/generator?name=${encodeURIComponent(p.name)}&company=${encodeURIComponent(p.company)}&city=${encodeURIComponent(p.city)}&type=${p.type}`}
                        className="text-blue-600 hover:underline text-xs">Message</Link>
                      <button onClick={() => { setEditing({ ...p }); setShowForm(true); }} className="text-gray-500 hover:text-gray-800 text-xs">Éditer</button>
                      <button onClick={() => deleteProspect(p.id)} className="text-red-500 hover:text-red-700 text-xs">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">{editing.id ? 'Modifier le prospect' : 'Nouveau prospect'}</h2>
            <div className="grid grid-cols-2 gap-3">
              {([['name','Nom *'], ['company','Entreprise'], ['email','Email'], ['phone','Téléphone'], ['city','Ville']] as [keyof Prospect, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text" value={(editing[field] as string) || ''}
                    onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as ProspectType })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="commerçant">Commerçant</option>
                  <option value="producteur">Producteur</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as ProspectStatus })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de relance</label>
                <input type="date" value={editing.follow_up_date || ''}
                  onChange={e => setEditing({ ...editing, follow_up_date: e.target.value || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })}
                rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Annuler</button>
              <button onClick={saveProspect}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

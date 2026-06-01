'use client';

import { useRef, useState } from 'react';
import type { Prospect, ProspectStatus, ProspectType } from '@/lib/types';
import { useProspects } from '@/lib/useProspects';
import Link from 'next/link';

const STATUSES: ProspectStatus[] = ['À contacter', 'Contacté', 'Intéressé', 'Client', 'Perdu'];
const STATUS_COLORS: Record<ProspectStatus, string> = {
  'À contacter': 'bg-[#1e2d4a] text-brand-muted',
  'Contacté':    'bg-[#1a2d5a] text-brand-blue',
  'Intéressé':   'bg-[#2d2500] text-amber-400',
  'Client':      'bg-[#012a1a] text-emerald-400',
  'Perdu':       'bg-[#2d0a0a] text-red-400',
};

type EditState = Omit<Prospect, 'id' | 'created_at' | 'updated_at'> & { id?: string };

const EMPTY: EditState = {
  name: '', company: '', type: 'commerçant', email: '', phone: '',
  city: '', status: 'À contacter', notes: '', follow_up_date: null,
};

function parseCSV(text: string): EditState[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return {
      name: row['name'] || row['nom'] || 'Inconnu',
      company: row['company'] || row['entreprise'] || '',
      type: (['producteur', 'commerçant'].includes(row['type']) ? row['type'] : 'commerçant') as ProspectType,
      email: row['email'] || '',
      phone: row['phone'] || row['téléphone'] || row['telephone'] || '',
      city: row['city'] || row['ville'] || '',
      status: (STATUSES.includes(row['status'] as ProspectStatus) ? row['status'] : 'À contacter') as ProspectStatus,
      notes: row['notes'] || '',
      follow_up_date: row['follow_up_date'] || row['relance'] || null,
    };
  });
}

export default function ProspectsPage() {
  const { prospects, loaded, addProspect, updateProspect, deleteProspect, importProspects } = useProspects();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | ''>('');
  const [filterType, setFilterType] = useState<ProspectType | ''>('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = prospects.filter(p => {
    const matchSearch = !search || [p.name, p.company, p.city, p.email, p.phone].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchType = !filterType || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  function saveProspect() {
    if (!editing) return;
    if (editing.id) {
      const { id, ...updates } = editing;
      updateProspect(id, updates);
    } else {
      addProspect(editing);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return;
    deleteProspect(id);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Import en cours...');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { setImportStatus('Aucune ligne valide trouvée dans le CSV.'); return; }
      const count = importProspects(rows);
      setImportStatus(`${count} prospects importés avec succès.`);
    } catch (err) {
      setImportStatus(`Erreur : ${err}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const inputClass = "bg-brand-surface border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue";
  const labelClass = "block text-xs font-medium text-brand-muted mb-1";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Prospects</h1>
        <div className="flex gap-3">
          <label className="cursor-pointer px-4 py-2 rounded-lg border border-brand-border text-sm font-medium text-white hover:bg-brand-surface transition-colors">
            Importer CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => { setEditing({ ...EMPTY }); setShowForm(true); }}
            className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors"
          >
            + Nouveau prospect
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${importStatus.startsWith('Erreur') ? 'bg-[#2d0a0a] text-red-400 border border-red-900' : 'bg-[#012a1a] text-emerald-400 border border-emerald-900'}`}>
          {importStatus}
          <button onClick={() => setImportStatus('')} className="ml-3 font-bold">×</button>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className={`flex-1 max-w-xs ${inputClass}`}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ProspectStatus | '')}
          className={inputClass}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as ProspectType | '')}
          className={inputClass}>
          <option value="">Tous les types</option>
          <option value="producteur">Producteur</option>
          <option value="commerçant">Commerçant</option>
        </select>
        <span className="text-sm text-brand-muted self-center">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {!loaded ? (
        <div className="text-center py-12 text-brand-muted">Chargement...</div>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                {['Nom', 'Entreprise', 'Type', 'Ville', 'Contact', 'Statut', 'Relance', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-brand-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-brand-muted">Aucun prospect trouvé</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-brand-muted">{p.company}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'producteur' ? 'bg-purple-900/50 text-purple-300' : 'bg-orange-900/50 text-orange-300'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{p.city}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {p.email && <div>{p.email}</div>}
                    {p.phone && <div>{p.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={e => updateProspect(p.id, { status: e.target.value as ProspectStatus })}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[p.status]}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-brand-muted text-xs">{p.follow_up_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/generator?name=${encodeURIComponent(p.name)}&company=${encodeURIComponent(p.company)}&city=${encodeURIComponent(p.city)}&type=${p.type}`}
                        className="text-brand-blue hover:underline text-xs">Message</Link>
                      <button onClick={() => { setEditing({ ...p }); setShowForm(true); }} className="text-brand-muted hover:text-white text-xs">Éditer</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-xl shadow-2xl border border-brand-border w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editing.id ? 'Modifier le prospect' : 'Nouveau prospect'}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['name', 'company', 'email', 'phone', 'city'] as const).map(field => (
                <div key={field}>
                  <label className={labelClass}>
                    {field === 'name' ? 'Nom *' : field === 'company' ? 'Entreprise' : field === 'email' ? 'Email' : field === 'phone' ? 'Téléphone' : 'Ville'}
                  </label>
                  <input
                    type="text" value={editing[field] || ''}
                    onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    className={`w-full ${inputClass}`}
                  />
                </div>
              ))}
              <div>
                <label className={labelClass}>Type</label>
                <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as ProspectType })}
                  className={`w-full ${inputClass}`}>
                  <option value="commerçant">Commerçant</option>
                  <option value="producteur">Producteur</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as ProspectStatus })}
                  className={`w-full ${inputClass}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date de relance</label>
                <input type="date" value={editing.follow_up_date || ''}
                  onChange={e => setEditing({ ...editing, follow_up_date: e.target.value || null })}
                  className={`w-full ${inputClass}`}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass}>Notes</label>
              <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })}
                rows={3} className={`w-full ${inputClass} resize-none`} />
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 text-sm rounded-lg border border-brand-border text-white hover:bg-brand-bg transition-colors">Annuler</button>
              <button onClick={saveProspect}
                className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

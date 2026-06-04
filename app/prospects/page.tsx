'use client';

import { useRef, useState } from 'react';
import type { Prospect, ProspectStatus, ProspectType } from '@/lib/types';
import { useProspects } from '@/lib/useProspects';
import Link from 'next/link';

const STATUSES: ProspectStatus[] = ['À contacter', 'Contacté', 'Intéressé', 'Client', 'Perdu', 'Pas intéressé'];
const STATUS_COLORS: Record<ProspectStatus, string> = {
  'À contacter':   'bg-[#1e2d4a] text-brand-muted',
  'Contacté':      'bg-[#1a2d5a] text-brand-blue',
  'Intéressé':     'bg-[#2d2500] text-amber-400',
  'Client':        'bg-[#012a1a] text-emerald-400',
  'Perdu':         'bg-[#2d0a0a] text-red-400',
  'Pas intéressé': 'bg-[#1a1a1a] text-zinc-500',
};

type EditState = Omit<Prospect, 'id' | 'created_at' | 'updated_at'> & { id?: string };

const EMPTY: EditState = {
  name: '', company: '', type: 'commerçant', email: '', phone: '',
  website: '', facebook: '', instagram: '',
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
      type: (['producteur', 'commerçant', 'artisan'].includes(row['type']) ? row['type'] : 'commerçant') as ProspectType,
      email: row['email'] || '',
      phone: row['phone'] || row['téléphone'] || row['telephone'] || '',
      website: row['website'] || row['site'] || '',
      facebook: row['facebook'] || '',
      instagram: row['instagram'] || '',
      city: row['city'] || row['ville'] || '',
      status: (STATUSES.includes(row['status'] as ProspectStatus) ? row['status'] : 'À contacter') as ProspectStatus,
      notes: row['notes'] || '',
      follow_up_date: row['follow_up_date'] || row['relance'] || null,
    };
  });
}

function DigitalLinks({ p }: { p: Prospect }) {
  const phone = p.phone?.replace(/\s/g, '');
  const wa = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : '33' + phone.replace(/^0/, '')}` : null;

  const links = [
    p.phone && { href: `tel:${p.phone}`, icon: '📞', label: p.phone, color: 'text-emerald-400 hover:text-emerald-300' },
    wa && { href: wa, icon: '💬', label: 'WhatsApp', color: 'text-[#25D366] hover:text-[#1ebe5d]' },
    p.email && { href: `mailto:${p.email}`, icon: '✉️', label: p.email, color: 'text-brand-blue hover:text-blue-300' },
    p.website && { href: p.website.startsWith('http') ? p.website : `https://${p.website}`, icon: '🌐', label: 'Site web', color: 'text-sky-400 hover:text-sky-300' },
    p.instagram && { href: p.instagram.startsWith('http') ? p.instagram : `https://instagram.com/${p.instagram.replace('@', '')}`, icon: '📸', label: 'Instagram', color: 'text-pink-400 hover:text-pink-300' },
    p.facebook && { href: p.facebook.startsWith('http') ? p.facebook : `https://facebook.com/${p.facebook}`, icon: '👥', label: 'Facebook', color: 'text-blue-400 hover:text-blue-300' },
  ].filter(Boolean) as { href: string; icon: string; label: string; color: string }[];

  if (!links.length) return <span className="text-brand-muted text-xs">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map(l => (
        <a key={l.href} href={l.href} target={l.href.startsWith('tel:') || l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
          title={l.label}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-bg border border-brand-border text-xs font-medium transition-colors ${l.color}`}>
          <span>{l.icon}</span>
          <span className="hidden xl:inline max-w-[100px] truncate">{l.label}</span>
        </a>
      ))}
    </div>
  );
}

export default function ProspectsPage() {
  const { prospects, loaded, addProspect, updateProspect, deleteProspect, importProspects } = useProspects();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | ''>('');
  const [filterType, setFilterType] = useState<ProspectType | ''>('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [hideNotInterested, setHideNotInterested] = useState(false);
  const [callNoteId, setCallNoteId] = useState<string | null>(null);
  const [callNoteText, setCallNoteText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = prospects.filter(p => {
    const matchSearch = !search || [p.name, p.company, p.city, p.email, p.phone, p.website].some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchType = !filterType || p.type === filterType;
    const matchInterest = !hideNotInterested || p.status !== 'Pas intéressé';
    return matchSearch && matchStatus && matchType && matchInterest;
  });

  function saveCallNote(id: string) {
    if (!callNoteText.trim()) { setCallNoteId(null); return; }
    const p = prospects.find(x => x.id === id);
    if (!p) return;
    const stamp = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newNote = `[${stamp}] ${callNoteText.trim()}`;
    updateProspect(id, { notes: p.notes ? `${newNote}\n${p.notes}` : newNote });
    setCallNoteId(null);
    setCallNoteText('');
  }

  function cleanAddressFromNotes() {
    prospects.forEach(p => {
      if (!p.notes) return;
      const cleaned = p.notes
        .split('\n')
        .filter(line => !line.startsWith('Adresse :'))
        .join('\n')
        .trim();
      if (cleaned !== p.notes) updateProspect(p.id, { notes: cleaned });
    });
    setImportStatus(`Notes nettoyées sur ${prospects.length} prospects.`);
  }

  function saveProspect() {
    if (!editing) return;
    if (editing.id) {
      const { id, ...updates } = editing;
      updateProspect(id, updates);
    } else {      addProspect(editing);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return;
    deleteProspect(id);
  }

  function handleExport() {
    const data = JSON.stringify(prospects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helpme-prospects-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Import en cours...');
    try {
      const text = await file.text();
      let rows: EditState[];
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text) as EditState[];
        rows = Array.isArray(parsed) ? parsed : [];
      } else {
        rows = parseCSV(text);
      }
      if (rows.length === 0) { setImportStatus('Aucune ligne valide trouvée.'); return; }
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
          <button onClick={cleanAddressFromNotes} disabled={prospects.length === 0}
            className="px-4 py-2 rounded-lg border border-brand-border text-xs font-medium text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-40 transition-colors">
            🧹 Nettoyer notes
          </button>
          <button onClick={handleExport} disabled={prospects.length === 0}
            className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium text-white hover:bg-brand-surface disabled:opacity-40 transition-colors">
            ⬇ Exporter ({prospects.length})
          </button>
          <label className="cursor-pointer px-4 py-2 rounded-lg border border-brand-border text-sm font-medium text-white hover:bg-brand-surface transition-colors">
            Importer CSV
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImport} />
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

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className={`flex-1 min-w-[180px] max-w-xs ${inputClass}`}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ProspectStatus | '')} className={inputClass}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as ProspectType | '')} className={inputClass}>
          <option value="">Tous les types</option>
          <option value="producteur">Producteur</option>
          <option value="commerçant">Commerçant</option>
          <option value="artisan">Artisan</option>
        </select>
        <button
          onClick={() => setHideNotInterested(v => !v)}
          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${hideNotInterested ? 'bg-zinc-700 border-zinc-600 text-white' : 'border-brand-border text-brand-muted hover:text-white hover:border-zinc-500'}`}>
          {hideNotInterested ? '✓ Sans "Pas intéressé"' : 'Masquer "Pas intéressé"'}
        </button>
        <span className="text-sm text-brand-muted self-center">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {!loaded ? (
        <div className="text-center py-12 text-brand-muted">Chargement...</div>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                {['Entreprise', 'Type', 'Ville', 'Présence digitale', 'Statut', 'Relance', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-brand-muted whitespace-nowrap">{h}</th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-brand-muted whitespace-nowrap">Notes appel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-brand-muted">Aucun prospect trouvé</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{p.company || '—'}</div>
                    <div className="text-xs text-brand-muted">{p.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.type === 'producteur' ? 'bg-purple-900/50 text-purple-300' :
                      p.type === 'artisan' ? 'bg-teal-900/50 text-teal-300' :
                      'bg-orange-900/50 text-orange-300'
                    }`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted whitespace-nowrap">{p.city || '—'}</td>
                  <td className="px-4 py-3">
                    <DigitalLinks p={p} />
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
                  <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">{p.follow_up_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <Link href={`/generator?name=${encodeURIComponent(p.name)}&company=${encodeURIComponent(p.company)}&city=${encodeURIComponent(p.city)}&type=${p.type}&email=${encodeURIComponent(p.email||'')}&phone=${encodeURIComponent(p.phone||'')}&website=${encodeURIComponent(p.website||'')}&instagram=${encodeURIComponent(p.instagram||'')}&facebook=${encodeURIComponent(p.facebook||'')}`}
                        className="px-2 py-1 rounded-lg bg-brand-blue/20 border border-brand-blue/30 text-xs font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition-colors whitespace-nowrap">
                        ✉️ Message
                      </Link>
                      <button onClick={() => { setEditing({ ...p }); setShowForm(true); }} className="text-brand-muted hover:text-white text-xs">Éditer</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {callNoteId === p.id ? (
                      <div className="flex flex-col gap-1.5 min-w-[220px]">
                        <textarea
                          autoFocus
                          value={callNoteText}
                          onChange={e => setCallNoteText(e.target.value)}
                          placeholder="Note suite à l'appel..."
                          rows={3}
                          className="w-full bg-brand-bg border border-brand-blue/50 text-white placeholder-brand-muted rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => saveCallNote(p.id)} className="px-2 py-1 rounded bg-brand-blue text-white text-xs hover:bg-brand-blue-hover transition-colors">Sauver</button>
                          <button onClick={() => { setCallNoteId(null); setCallNoteText(''); }} className="px-2 py-1 rounded border border-brand-border text-brand-muted text-xs hover:text-white transition-colors">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {p.notes && (
                          <p className="text-[11px] text-brand-muted line-clamp-2 max-w-[200px]">{p.notes}</p>
                        )}
                        <button
                          onClick={() => { setCallNoteId(p.id); setCallNoteText(''); }}
                          className="text-[11px] text-brand-blue hover:underline text-left whitespace-nowrap">
                          + Note d&apos;appel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>
          <div className="bg-brand-surface rounded-xl shadow-2xl border border-brand-border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editing.id ? 'Modifier le prospect' : 'Nouveau prospect'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nom *</label>
                <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>Entreprise</label>
                <input type="text" value={editing.company} onChange={e => setEditing({ ...editing, company: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="+33 6 00 00 00 00" className={`w-full ${inputClass}`} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Site web</label>
                <input type="text" value={editing.website || ''} onChange={e => setEditing({ ...editing, website: e.target.value })} placeholder="https://..." className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>📸 Instagram</label>
                <input type="text" value={editing.instagram || ''} onChange={e => setEditing({ ...editing, instagram: e.target.value })} placeholder="@ou URL" className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>👥 Facebook</label>
                <input type="text" value={editing.facebook || ''} onChange={e => setEditing({ ...editing, facebook: e.target.value })} placeholder="nom ou URL" className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>Ville</label>
                <input type="text" value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} className={`w-full ${inputClass}`} />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as ProspectType })} className={`w-full ${inputClass}`}>
                  <option value="commerçant">Commerçant</option>
                  <option value="producteur">Producteur</option>
                  <option value="artisan">Artisan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as ProspectStatus })} className={`w-full ${inputClass}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date de relance</label>
                <input type="date" value={editing.follow_up_date || ''} onChange={e => setEditing({ ...editing, follow_up_date: e.target.value || null })} className={`w-full ${inputClass}`} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass}>Notes</label>
              <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={3} className={`w-full ${inputClass} resize-none`} />
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm rounded-lg border border-brand-border text-white hover:bg-brand-bg transition-colors">Annuler</button>
              <button onClick={saveProspect} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white hover:bg-brand-blue-hover transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import type { BodaccAnnonce } from '@/app/api/bodacc/route';
import { useProspects } from '@/lib/useProspects';
import type { ProspectType } from '@/lib/types';
import Link from 'next/link';

const DEPT_PRESETS = [
  { label: 'Haute-Garonne (31)', value: '31' },
  { label: 'Ariège (09)', value: '09' },
  { label: 'Tarn (81)', value: '81' },
  { label: 'Tarn-et-Garonne (82)', value: '82' },
  { label: 'Lot (46)', value: '46' },
  { label: 'Gers (32)', value: '32' },
  { label: 'Hérault (34)', value: '34' },
  { label: 'Aveyron (12)', value: '12' },
];

const KEYWORD_PRESETS = [
  'restaurant', 'boulangerie', 'brasserie', 'bar', 'coiffeur', 'artisan',
  'commerce', 'boutique', 'salon', 'esthétique', 'pressing', 'épicerie',
  'fleuriste', 'tatouage', 'yoga', 'sport', 'bien-être',
];

function guessType(activite: string): ProspectType {
  const a = activite.toLowerCase();
  if (/maraîch|vigneron|élevage|apicult|arboricult|producteur|agricult/.test(a)) return 'producteur';
  if (/plombier|électric|menuisier|maçon|peintre|charpent|carreleur|serrurier|couvreur|chauffagiste|artisan|bâtiment/.test(a)) return 'artisan';
  return 'commerçant';
}

export default function BodaccPage() {
  const { addProspects } = useProspects();
  const [dept, setDept] = useState('31');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BodaccAnnonce[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const fetchPage = useCallback(async (pageIndex: number, deptVal: string, kwVal: string) => {
    setLoading(true);
    setResults([]);
    setError('');
    setSelected(new Set());

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageIndex * PAGE_SIZE) });
      if (deptVal) params.set('dept', deptVal);
      if (kwVal) params.set('keyword', kwVal);

      const res = await fetch(`/api/bodacc?${params}`);
      const json = await res.json() as { results: BodaccAnnonce[]; total: number; error?: string };

      if (json.error) throw new Error(json.error);
      setResults(json.results);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    fetchPage(0, dept, keyword);
  }

  function goToPage(p: number) {
    setPage(p);
    fetchPage(p, dept, keyword);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => prev.size === results.length ? new Set() : new Set(results.map(r => r.id)));
  }

  function importSelected() {
    const toImport = results.filter(r => selected.has(r.id));
    if (!toImport.length) return;
    const count = addProspects(toImport.map(r => ({
      name: r.dirigeant || '',
      company: r.company,
      type: guessType(r.activite),
      email: '',
      phone: '',
      website: '',
      facebook: '',
      instagram: '',
      city: r.ville,
      status: 'À contacter' as const,
      notes: [
        r.activite && `Activité : ${r.activite}`,
        r.formeJuridique && `Forme : ${r.formeJuridique}`,
        r.siren && `SIREN : ${r.siren}`,
        r.dateParution && `Immatriculation : ${r.dateParution}`,
        r.papersUrl && `Pappers : ${r.papersUrl}`,
      ].filter(Boolean).join('\n'),
      follow_up_date: null,
    })));
    setSelected(new Set());
    showToast(`${count} prospect${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} ✓`);
  }

  const daysSince = (date: string) => {
    if (!date) return null;
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 border border-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Nouvelles ouvertures — BODACC</h1>
        <p className="text-brand-muted text-sm">
          Entreprises fraîchement immatriculées — aucune présence digitale, besoin immédiat 🎯
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Département</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEPT_PRESETS.map(d => (
                <button key={d.value} type="button" onClick={() => setDept(d.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dept === d.value ? 'bg-brand-blue text-white border-brand-blue' : 'border-brand-border text-brand-muted hover:text-white hover:border-brand-blue/40'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
            <input type="text" value={dept} onChange={e => setDept(e.target.value)} placeholder="Code département (ex: 31)"
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Secteur d&apos;activité (optionnel)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {KEYWORD_PRESETS.map(k => (
                <button key={k} type="button" onClick={() => setKeyword(keyword === k ? '' : k)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword === k ? 'bg-violet-600 text-white border-violet-600' : 'border-brand-border text-brand-muted hover:text-white hover:border-violet-500/40'
                  }`}>
                  {k}
                </button>
              ))}
            </div>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="ex: restaurant, salon..."
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="px-6 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover disabled:opacity-50 transition-colors">
          {loading ? '⏳ Chargement...' : '🔍 Chercher les nouvelles immatriculations'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-brand-muted">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total.toLocaleString('fr-FR')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-900/40 text-violet-300">BODACC officiel</span>
            </div>
            {selected.size > 0 && (
              <button onClick={importSelected}
                className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors">
                ➕ Importer {selected.size} prospect{selected.size > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-bg border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selected.size === results.length && results.length > 0} onChange={toggleAll}
                      className="accent-brand-blue" />
                  </th>
                  {['Entreprise', 'Activité', 'Ville', 'Immatriculation', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-brand-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {results.map(r => {
                  const days = daysSince(r.dateParution);
                  return (
                    <tr key={r.id} className={`hover:bg-brand-bg/50 transition-colors ${selected.has(r.id) ? 'bg-brand-blue/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                          className="accent-brand-blue" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{r.company}</div>
                        {r.dirigeant && <div className="text-xs text-brand-muted">{r.dirigeant}</div>}
                        {r.formeJuridique && <div className="text-xs text-brand-muted/60">{r.formeJuridique}</div>}
                      </td>
                      <td className="px-4 py-3 text-brand-muted max-w-[200px]">
                        <p className="line-clamp-2 text-xs">{r.activite || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-muted whitespace-nowrap text-xs">
                        {r.codePostal} {r.ville}
                      </td>
                      <td className="px-4 py-3">
                        {r.dateParution && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-brand-muted">{r.dateParution}</span>
                            {days !== null && (
                              <span className={`text-[10px] font-medium ${days <= 7 ? 'text-emerald-400' : days <= 30 ? 'text-amber-400' : 'text-brand-muted'}`}>
                                {days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days}j`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.papersUrl && (
                            <a href={r.papersUrl} target="_blank" rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg border border-brand-border text-xs text-brand-muted hover:text-white hover:bg-brand-bg transition-colors whitespace-nowrap">
                              📋 Pappers
                            </a>
                          )}
                          <Link href={`/generator?company=${encodeURIComponent(r.company)}&name=${encodeURIComponent(r.dirigeant)}&city=${encodeURIComponent(r.ville)}&type=${guessType(r.activite)}&category=${encodeURIComponent(r.activite)}`}
                            className="px-2 py-1 rounded-lg bg-brand-blue/20 border border-brand-blue/30 text-xs text-brand-blue hover:bg-brand-blue hover:text-white transition-colors whitespace-nowrap">
                            ✉️ Contacter
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button onClick={() => goToPage(0)} disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-colors">
                «
              </button>
              <button onClick={() => goToPage(page - 1)} disabled={page === 0 || loading}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-colors">
                ‹ Précédent
              </button>
              <span className="px-4 py-1.5 rounded-lg bg-brand-blue/10 border border-brand-blue/30 text-xs text-brand-blue font-medium">
                Page {page + 1} / {Math.ceil(total / PAGE_SIZE).toLocaleString('fr-FR')}
              </span>
              <button onClick={() => goToPage(page + 1)} disabled={(page + 1) * PAGE_SIZE >= total || loading}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-colors">
                Suivant ›
              </button>
              <button onClick={() => goToPage(Math.ceil(total / PAGE_SIZE) - 1)} disabled={(page + 1) * PAGE_SIZE >= total || loading}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-colors">
                »
              </button>
            </div>
          )}
        </>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Lance une recherche pour voir les nouvelles immatriculations</p>
          <p className="text-xs mt-1">Source officielle : Bulletin Officiel des Annonces Civiles et Commerciales</p>
        </div>
      )}
    </div>
  );
}

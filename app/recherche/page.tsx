'use client';

import { useState, useCallback } from 'react';
import { useProspects } from '@/lib/useProspects';
import type { SearchResult } from '@/app/api/search/route';
import type { ProspectType } from '@/lib/types';

const PRODUCTEUR_PRESETS = ['Vigneron', 'Maraîcher', 'Éleveur', 'Arboriculteur', 'Apiculteur'];
const COMMERCANT_PRESETS = ['Boulanger', 'Boucher', 'Épicerie', 'Restaurant', 'Fleuriste', 'Coiffeur'];

const SCORE_BADGE: Record<SearchResult['qualificationLabel'], string> = {
  'Très qualifié': 'bg-green-100 text-green-700',
  'Qualifié': 'bg-yellow-100 text-yellow-700',
  'Peu qualifié': 'bg-gray-100 text-gray-600',
};

export default function RecherchePage() {
  const { importProspects } = useProspects();

  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'producteur' | 'commercant'>('commercant');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(new Set());

    try {
      const res = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword.trim())}&city=${encodeURIComponent(city.trim())}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults(data.results || []);
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      setError(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!results) return;
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map(r => r.id)));
    }
  }

  function handleImport() {
    if (!results) return;
    const toImport = results.filter(r => selected.has(r.id));
    if (toImport.length === 0) return;

    const rows = toImport.map(r => ({
      name: r.name,
      company: r.company,
      type: (r.type === 'producteur' ? 'producteur' : 'commerçant') as ProspectType,
      email: '',
      phone: r.phone || '',
      city: r.city,
      status: 'À contacter' as const,
      notes: [
        r.address ? `Adresse : ${r.address}` : '',
        r.website ? `Site web : ${r.website}` : '',
        r.rating != null ? `Note : ${r.rating}/5` : '',
        r.reviewCount != null ? `Avis : ${r.reviewCount}` : '',
        `Score qualification : ${r.qualificationScore}/10 (${r.qualificationLabel})`,
      ].filter(Boolean).join('\n'),
      follow_up_date: null,
    }));

    const count = importProspects(rows);
    setSelected(new Set());
    showToast(`${count} prospect${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} avec succès !`);
  }

  const allSelected = results !== null && results.length > 0 && selected.size === results.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recherche de Prospects</h1>
        <p className="text-sm text-gray-500">Recherche sur PagesJaunes</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville *</label>
              <input
                type="text"
                placeholder="ex: Lyon"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie / métier *</label>
              <input
                type="text"
                placeholder="ex: boulanger, vigneron..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'producteur' | 'commercant')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="commercant">Commerçant</option>
                <option value="producteur">Producteur</option>
              </select>
            </div>
          </div>

          {/* Preset chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 font-medium w-20">Producteurs :</span>
              {PRODUCTEUR_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('producteur'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'producteur'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 font-medium w-20">Commerçants :</span>
              {COMMERCANT_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('commercant'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'commercant'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Recherche en cours...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Récupération des données sur PagesJaunes...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-4">
          <p className="text-red-700 text-sm font-medium mb-1">Erreur lors de la récupération</p>
          <p className="text-red-600 text-sm">{error}</p>
          {results && results.length === 0 && (
            <p className="text-red-500 text-xs mt-2">
              PagesJaunes peut bloquer les requêtes automatiques. Essayez une autre recherche ou réessayez dans quelques instants.
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && results !== null && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              {results.length === 0
                ? 'Aucun résultat trouvé.'
                : `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
            </p>
            {results.length > 0 && selected.size > 0 && (
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Importer les sélectionnés ({selected.size})
              </button>
            )}
          </div>

          {results.length === 0 && !error && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-1">Aucun résultat</p>
              <p className="text-sm">Essayez avec une autre ville ou catégorie.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Tout sélectionner"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nom / Entreprise</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ville</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Téléphone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Site web</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Avis</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Score qualification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map(r => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selected.has(r.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        {r.address && <div className="text-xs text-gray-400 mt-0.5">{r.address}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.city}</td>
                      <td className="px-4 py-3 text-gray-600">{r.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {r.website ? (
                          <a
                            href={r.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            ✓
                          </a>
                        ) : (
                          <span className="text-gray-400">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.reviewCount != null ? r.reviewCount : '—'}
                        {r.rating != null && (
                          <span className="text-xs text-gray-400 ml-1">({r.rating}/5)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SCORE_BADGE[r.qualificationLabel]}`}>
                          {r.qualificationLabel}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{r.qualificationScore}/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.length > 0 && selected.size > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Importer les sélectionnés ({selected.size})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

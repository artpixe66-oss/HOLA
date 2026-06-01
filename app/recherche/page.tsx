'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProspects } from '@/lib/useProspects';
import type { SearchResult } from '@/app/api/search/route';
import type { ProspectType } from '@/lib/types';

const PRODUCTEUR_PRESETS = ['Vigneron', 'Maraîcher', 'Éleveur', 'Arboriculteur', 'Apiculteur'];
const COMMERCANT_PRESETS = ['Boulanger', 'Boucher', 'Épicerie', 'Restaurant', 'Fleuriste', 'Coiffeur'];
const ARTISAN_PRESETS = ['Plombier', 'Électricien', 'Menuisier', 'Maçon', 'Peintre', 'Charpentier', 'Carreleur', 'Serrurier'];

const SCORE_BADGE: Record<SearchResult['qualificationLabel'], string> = {
  'Très qualifié': 'bg-green-100 text-green-700',
  'Qualifié': 'bg-yellow-100 text-yellow-700',
  'Peu qualifié': 'bg-gray-100 text-gray-600',
};

const GOOGLE_API_KEY_STORAGE = 'helpme_google_api_key';

export default function RecherchePage() {
  const { importProspects } = useProspects();

  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'producteur' | 'commercant' | 'artisan'>('commercant');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [source, setSource] = useState<'google' | 'osm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(GOOGLE_API_KEY_STORAGE) || '';
    setGoogleApiKey(saved);
  }, []);

  function saveApiKey() {
    localStorage.setItem(GOOGLE_API_KEY_STORAGE, googleApiKey);
    setShowApiSettings(false);
    showToast('Clé API Google sauvegardée !');
  }

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
    setSource(null);
    setSelected(new Set());

    try {
      const params = new URLSearchParams({
        keyword: keyword.trim(),
        city: city.trim(),
        type,
      });
      if (googleApiKey) params.set('googleApiKey', googleApiKey);

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults(data.results || []);
      } else {
        setResults(data.results || []);
        setSource(data.source || null);
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
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map(r => r.id)));
  }

  function handleImport() {
    if (!results) return;
    const toImport = results.filter(r => selected.has(r.id));
    if (toImport.length === 0) return;

    const rows = toImport.map(r => ({
      name: r.name,
      company: r.company,
      type: (r.type === 'producteur' ? 'producteur' : r.type === 'artisan' ? 'artisan' : 'commerçant') as ProspectType,
      email: '',
      phone: r.phone || '',
      city: r.city,
      status: 'À contacter' as const,
      notes: [
        r.address ? `Adresse : ${r.address}` : '',
        r.website ? `Site web : ${r.website}` : '',
        r.rating != null ? `Note Google : ${r.rating}/5` : '',
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
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recherche de Prospects</h1>
        <button
          onClick={() => setShowApiSettings(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
        >
          ⚙️ {googleApiKey ? <span className="text-green-600 font-medium">Google Places actif</span> : 'Configurer Google API'}
        </button>
      </div>

      {/* API Key Settings */}
      {showApiSettings && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-blue-800 mb-1">Clé API Google Places</h2>
          <p className="text-xs text-blue-600 mb-3">
            Avec Google Places, vous obtenez les vraies notes, avis, sites web et coordonnées.
            Créez votre clé sur <strong>console.cloud.google.com</strong> → APIs → Places API (New).
            Gratuit jusqu&apos;à $200/mois de crédit.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={e => setGoogleApiKey(e.target.value)}
                className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showApiKey ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <button
              onClick={saveApiKey}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Sauvegarder
            </button>
            {googleApiKey && (
              <button
                onClick={() => { setGoogleApiKey(''); localStorage.removeItem(GOOGLE_API_KEY_STORAGE); }}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50"
              >
                Supprimer
              </button>
            )}
          </div>
          {!googleApiKey && (
            <p className="text-xs text-blue-500 mt-2">Sans clé : données OpenStreetMap (moins complètes mais 100% gratuit).</p>
          )}
        </div>
      )}

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
                <option value="artisan">Artisan</option>
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
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 font-medium w-20">Artisans :</span>
              {ARTISAN_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('artisan'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'artisan'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
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
            {loading ? 'Recherche en cours...' : '🔍 Rechercher'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">
            {googleApiKey ? 'Recherche via Google Places...' : 'Recherche via OpenStreetMap...'}
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-4">
          <p className="text-red-700 text-sm font-medium mb-1">Erreur lors de la récupération</p>
          <p className="text-red-600 text-sm">{error}</p>
          {!googleApiKey && (
            <p className="text-red-500 text-xs mt-2">
              Conseil : configurez une clé API Google Places pour des résultats plus fiables.
            </p>
          )}
        </div>
      )}

      {/* Source badge */}
      {!loading && results !== null && source && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            source === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {source === 'google' ? '🌐 Google Places' : '🗺️ OpenStreetMap'}
          </span>
          <span className="text-sm text-gray-600">
            {results.length === 0
              ? 'Aucun résultat trouvé.'
              : `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
          </span>
          {results.length > 0 && selected.size > 0 && (
            <button
              onClick={handleImport}
              className="ml-auto px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Importer les sélectionnés ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && results !== null && results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nom / Entreprise</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ville</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Avis</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Présence digitale</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Qualification</th>
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
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      onClick={e => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.address && <div className="text-xs text-gray-400 mt-0.5">{r.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.city}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {r.phone ? (
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${r.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-800 hover:text-blue-600">
                          📞 {r.phone}
                        </a>
                        <a href={`https://wa.me/${r.phone.replace(/[\s\-().+]/g, '').replace(/^0/, '33')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                          💬 WhatsApp
                        </a>
                        {r.website && (
                          <a href={`https://www.google.com/search?q=email+contact+site:${new URL(r.website).hostname}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline">
                            ✉️ Trouver email
                          </a>
                        )}
                        {!r.website && (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + r.city + ' email contact')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline">
                            ✉️ Trouver email
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-400">Tél. non renseigné</span>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + r.city + ' téléphone email contact')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline">
                          🔍 Trouver contact
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.reviewCount != null ? (
                      <span>{r.reviewCount} {r.rating != null && <span className="text-xs text-yellow-500">★{r.rating}</span>}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      {/* Fiche Google */}
                      <a href={r.googleMapsUri!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                        <span>📍</span> Fiche Google
                      </a>
                      {/* Site web */}
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:underline">
                          <span>🌐</span> Site web ✓
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <span>🌐</span> Pas de site ✗
                        </span>
                      )}
                      {/* Facebook */}
                      <a href={r.facebookSearchUrl!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <span>📘</span> Chercher Facebook
                      </a>
                      {/* Instagram */}
                      <a href={r.instagramSearchUrl!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-pink-500 hover:underline">
                        <span>📸</span> Chercher Instagram
                      </a>
                    </div>
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

          {selected.size > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button onClick={handleImport}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                Importer les sélectionnés ({selected.size})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProspects } from '@/lib/useProspects';
import type { SearchResult } from '@/app/api/search/route';
import type { ProspectType } from '@/lib/types';

const PRODUCTEUR_PRESETS = [
  'Vigneron', 'Maraîcher', 'Éleveur', 'Arboriculteur', 'Apiculteur',
  'Fromager', 'Céréalier', 'Horticulteur', 'Ostréiculteur', 'Pisciculteur',
  'Champignonnier', 'Herboriste', 'Brasseur', 'Distillateur', 'Oléiculteur',
];
const COMMERCANT_PRESETS = [
  'Boulanger', 'Boucher', 'Épicerie', 'Restaurant', 'Fleuriste', 'Coiffeur',
  'Pâtissier', 'Traiteur', 'Poissonnier', 'Charcutier', 'Primeur', 'Caviste',
  'Chocolatier', 'Glacier', 'Barbier', 'Esthéticienne', 'Pressing', 'Opticien',
  'Pharmacie', 'Librairie', 'Bijouterie', 'Tabac', 'Bar', 'Brasserie',
];
const ARTISAN_PRESETS = [
  'Plombier', 'Électricien', 'Menuisier', 'Maçon', 'Peintre', 'Charpentier',
  'Carreleur', 'Serrurier', 'Couvreur', 'Chauffagiste', 'Vitrier', 'Jardinier',
  'Cuisiniste', 'Photographe', 'Imprimeur', 'Cordonnier', 'Tailleur', 'Horloger',
  'Ébéniste', 'Céramiste', 'Forgeron', 'Tapissier', 'Graphiste', 'Tatoueur',
];

const SCORE_BADGE: Record<SearchResult['qualificationLabel'], string> = {
  'Très qualifié': 'bg-emerald-900/50 text-emerald-400',
  'Qualifié': 'bg-amber-900/50 text-amber-400',
  'Peu qualifié': 'bg-[#1e2d4a] text-brand-muted',
};

const GOOGLE_API_KEY_STORAGE = 'helpme_google_api_key';
const APOLLO_API_KEY_STORAGE = 'helpme_apollo_key';

type SearchSource = 'geo' | 'apollo';

export default function RecherchePage() {
  const { importProspects } = useProspects();

  const [searchSource, setSearchSource] = useState<SearchSource>('geo');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'producteur' | 'commercant' | 'artisan'>('commercant');
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [source, setSource] = useState<'google' | 'osm' | 'apollo' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apolloApiKey, setApolloApiKey] = useState('');
  const [showApolloKey, setShowApolloKey] = useState(false);
  const [apolloPage, setApolloPage] = useState(1);
  const [lastApolloParams, setLastApolloParams] = useState<{ keyword: string; city: string; type: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(GOOGLE_API_KEY_STORAGE) || '';
    setGoogleApiKey(saved);
    const savedApollo = localStorage.getItem(APOLLO_API_KEY_STORAGE) || '';
    setApolloApiKey(savedApollo);
  }, []);

  function saveApiKey() {
    localStorage.setItem(GOOGLE_API_KEY_STORAGE, googleApiKey);
    setShowApiSettings(false);
    showToast('Clé API Google sauvegardée !');
  }

  function saveApolloKey() {
    localStorage.setItem(APOLLO_API_KEY_STORAGE, apolloApiKey);
    showToast('Clé API Apollo.io sauvegardée !');
  }

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setApolloPage(1);
    setLastApolloParams({ keyword: keyword.trim(), city: city.trim(), type });
    await doSearch(keyword.trim(), city.trim(), type, 1);
  }

  async function doSearch(kw: string, c: string, t: string, page: number) {
    setLoading(true);
    setError(null);
    setResults(null);
    setSource(null);
    setSelected(new Set());

    try {
      if (searchSource === 'apollo') {
        const params = new URLSearchParams({
          keyword: kw,
          city: c,
          type: t,
          apolloKey: apolloApiKey,
          page: String(page),
        });
        const res = await fetch(`/api/apollo?${params}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setResults(data.results || []);
        } else {
          setResults(data.results || []);
          setSource('apollo');
        }
      } else {
        const params = new URLSearchParams({
          keyword: kw,
          city: c,
          type: t,
          radius: String(radius),
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
      }
    } catch (err) {
      setError(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleNextPage() {
    if (!lastApolloParams) return;
    const nextPage = apolloPage + 1;
    setApolloPage(nextPage);
    await doSearch(lastApolloParams.keyword, lastApolloParams.city, lastApolloParams.type, nextPage);
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
      email: r.email || '',
      phone: r.phone || '',
      city: r.city,
      status: 'À contacter' as const,
      notes: [
        r.address ? `Adresse : ${r.address}` : '',
        r.website ? `Site web : ${r.website}` : '',
        r.rating != null ? `Note Google : ${r.rating}/5` : '',
        r.reviewCount != null ? `Avis : ${r.reviewCount}` : '',
        r.linkedinUrl ? `LinkedIn : ${r.linkedinUrl}` : '',
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
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 border border-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Recherche de Prospects</h1>
        {searchSource === 'geo' && (
          <button
            onClick={() => setShowApiSettings(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border text-sm text-brand-muted hover:bg-brand-surface hover:text-white transition-colors"
          >
            ⚙️ {googleApiKey ? <span className="text-emerald-400 font-medium">Google Places actif</span> : 'Configurer Google API'}
          </button>
        )}
      </div>

      {/* Source toggle */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => { setSearchSource('geo'); setResults(null); setSource(null); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            searchSource === 'geo'
              ? 'bg-brand-blue text-white border-brand-blue'
              : 'bg-brand-surface text-brand-muted border-brand-border hover:text-white hover:bg-brand-surface/80'
          }`}
        >
          🗺️ Google / OpenStreetMap
        </button>
        <button
          onClick={() => { setSearchSource('apollo'); setResults(null); setSource(null); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            searchSource === 'apollo'
              ? 'bg-brand-blue text-white border-brand-blue'
              : 'bg-brand-surface text-brand-muted border-brand-border hover:text-white hover:bg-brand-surface/80'
          }`}
        >
          🔍 Apollo.io (B2B)
        </button>
      </div>

      {/* Google API Key Settings */}
      {searchSource === 'geo' && showApiSettings && (
        <div className="bg-brand-surface border border-brand-blue/30 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1">Clé API Google Places</h2>
          <p className="text-xs text-brand-muted mb-3">
            Avec Google Places, vous obtenez les vraies notes, avis, sites web et coordonnées.
            Créez votre clé sur <strong className="text-white">console.cloud.google.com</strong> → APIs → Places API (New).
            Gratuit jusqu&apos;à $200/mois de crédit.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={e => setGoogleApiKey(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-xs"
              >
                {showApiKey ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <button
              onClick={saveApiKey}
              className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors"
            >
              Sauvegarder
            </button>
            {googleApiKey && (
              <button
                onClick={() => { setGoogleApiKey(''); localStorage.removeItem(GOOGLE_API_KEY_STORAGE); }}
                className="px-4 py-2 rounded-lg border border-red-800 text-red-400 text-sm font-medium hover:bg-red-900/30 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
          {!googleApiKey && (
            <p className="text-xs text-brand-muted mt-2">Sans clé : données OpenStreetMap (moins complètes mais 100% gratuit).</p>
          )}
        </div>
      )}

      {/* Apollo API Key Settings */}
      {searchSource === 'apollo' && (
        <div className="bg-brand-surface border border-brand-blue/30 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1">Clé API Apollo.io</h2>
          <p className="text-xs text-brand-muted mb-3">
            Apollo.io fournit des contacts B2B réels avec email, téléphone et LinkedIn.
            Obtenez votre clé sur <strong className="text-white">app.apollo.io</strong> → Settings → API Keys.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApolloKey ? 'text' : 'password'}
                placeholder="Votre clé API Apollo.io..."
                value={apolloApiKey}
                onChange={e => setApolloApiKey(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                type="button"
                onClick={() => setShowApolloKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-xs"
              >
                {showApolloKey ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <button
              onClick={saveApolloKey}
              className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors"
            >
              Sauvegarder
            </button>
            {apolloApiKey && (
              <button
                onClick={() => { setApolloApiKey(''); localStorage.removeItem(APOLLO_API_KEY_STORAGE); }}
                className="px-4 py-2 rounded-lg border border-red-800 text-red-400 text-sm font-medium hover:bg-red-900/30 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
          {apolloApiKey && (
            <p className="text-xs text-emerald-400 mt-2">✓ Clé Apollo.io configurée</p>
          )}
        </div>
      )}

      {/* Search Form */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-5 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Ville *</label>
              <input
                type="text"
                placeholder="ex: Lyon"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">
                {searchSource === 'apollo' ? 'Secteur / métier' : 'Catégorie / métier *'}
              </label>
              <input
                type="text"
                placeholder="ex: boulanger, vigneron... (optionnel)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'producteur' | 'commercant' | 'artisan')}
                className="w-full bg-brand-bg border border-brand-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="commercant">Commerçant</option>
                <option value="producteur">Producteur</option>
                <option value="artisan">Artisan</option>
              </select>
            </div>
          </div>

          {/* Radius slider — only for geo */}
          {searchSource === 'geo' && (
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-2">
                Rayon de recherche : <span className="text-brand-blue font-bold">{radius} km</span> autour de {city || 'la ville'}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-brand-muted">1 km</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="flex-1 accent-brand-blue"
                />
                <span className="text-xs text-brand-muted">100 km</span>
              </div>
              <div className="flex justify-between text-xs text-brand-muted mt-1 px-1">
                {[5, 10, 20, 30, 50].map(v => (
                  <button key={v} type="button" onClick={() => setRadius(v)}
                    className={`px-2 py-0.5 rounded transition-colors ${radius === v ? 'bg-brand-blue/20 text-brand-blue font-medium' : 'hover:bg-brand-border'}`}>
                    {v} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preset chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-brand-muted font-medium w-20">Producteurs :</span>
              {PRODUCTEUR_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('producteur'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'producteur'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-purple-900/30 text-purple-300 border-purple-800 hover:bg-purple-800/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-brand-muted font-medium w-20">Commerçants :</span>
              {COMMERCANT_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('commercant'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'commercant'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-orange-900/30 text-orange-300 border-orange-800 hover:bg-orange-800/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-brand-muted font-medium w-20">Artisans :</span>
              {ARTISAN_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setKeyword(p.toLowerCase()); setType('artisan'); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    keyword.toLowerCase() === p.toLowerCase() && type === 'artisan'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-teal-900/30 text-teal-300 border-teal-800 hover:bg-teal-800/40'
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
            className="px-6 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Recherche en cours...' : '🔍 Rechercher'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-brand-muted text-sm">
            {searchSource === 'apollo'
              ? 'Recherche via Apollo.io B2B...'
              : googleApiKey ? 'Recherche via Google Places...' : 'Recherche via OpenStreetMap...'}
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-[#2d0a0a] border border-red-800 rounded-xl px-5 py-4 mb-4">
          <p className="text-red-400 text-sm font-medium mb-1">Erreur lors de la récupération</p>
          <p className="text-red-300 text-sm">{error}</p>
          {searchSource === 'apollo' && !apolloApiKey && (
            <p className="text-red-400/70 text-xs mt-2">
              Conseil : configurez votre clé API Apollo.io ci-dessus.
            </p>
          )}
          {searchSource === 'geo' && !googleApiKey && (
            <p className="text-red-400/70 text-xs mt-2">
              Conseil : configurez une clé API Google Places pour des résultats plus fiables.
            </p>
          )}
        </div>
      )}

      {/* Source badge */}
      {!loading && results !== null && source && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            source === 'google' ? 'bg-brand-blue/20 text-brand-blue'
            : source === 'apollo' ? 'bg-purple-900/40 text-purple-300'
            : 'bg-brand-border text-brand-muted'
          }`}>
            {source === 'google' ? '🌐 Google Places' : source === 'apollo' ? '🔍 Apollo.io' : '🗺️ OpenStreetMap'}
          </span>
          <span className="text-sm text-brand-muted">
            {results.length === 0
              ? 'Aucun résultat trouvé.'
              : `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
          </span>
          {source === 'apollo' && results.length > 0 && (
            <span className="text-xs text-brand-muted">— Page {apolloPage}</span>
          )}
          {results.length > 0 && selected.size > 0 && (
            <button
              onClick={handleImport}
              className="ml-auto px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Importer les sélectionnés ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && results !== null && results.length > 0 && (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-brand-border bg-brand-surface text-brand-blue cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-brand-muted">Nom / Entreprise</th>
                <th className="px-4 py-3 text-left font-medium text-brand-muted">Ville</th>
                <th className="px-4 py-3 text-left font-medium text-brand-muted">Contact</th>
                {source !== 'apollo' && (
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Avis</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-brand-muted">Présence digitale</th>
                {source === 'apollo' && (
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">LinkedIn</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-brand-muted">Qualification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {results.map(r => (
                <tr
                  key={r.id}
                  className={`cursor-pointer transition-colors ${selected.has(r.id) ? 'bg-brand-blue/10' : 'hover:bg-brand-bg/60'}`}
                  onClick={() => toggleSelect(r.id)}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      onClick={e => e.stopPropagation()}
                      className="rounded border-brand-border bg-brand-surface text-brand-blue cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.name}</div>
                    {r.company && r.company !== r.name && (
                      <div className="text-xs text-brand-muted mt-0.5">{r.company}</div>
                    )}
                    {r.address && r.address !== r.city && (
                      <div className="text-xs text-brand-muted mt-0.5">{r.address}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{r.city}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {/* Email — shown if available (Apollo) */}
                    {r.email && (
                      <a href={`mailto:${r.email}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:underline mb-1 block">
                        ✉️ {r.email}
                      </a>
                    )}
                    {r.phone ? (
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${r.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white hover:text-brand-blue">
                          📞 {r.phone}
                        </a>
                        <a href={`https://wa.me/${r.phone.replace(/[\s\-().+]/g, '').replace(/^0/, '33')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                          💬 WhatsApp
                        </a>
                        {!r.email && r.website && (
                          <a href={`https://www.google.com/search?q=email+contact+site:${new URL(r.website).hostname}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                            ✉️ Trouver email
                          </a>
                        )}
                        {!r.email && !r.website && (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + r.city + ' email contact')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                            ✉️ Trouver email
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {!r.email && (
                          <>
                            <span className="text-xs text-brand-muted">Tél. non renseigné</span>
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + r.city + ' téléphone email contact')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                              🔍 Trouver contact
                            </a>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  {source !== 'apollo' && (
                    <td className="px-4 py-3 text-brand-muted">
                      {r.reviewCount != null ? (
                        <span>{r.reviewCount} {r.rating != null && <span className="text-xs text-amber-400">★{r.rating}</span>}</span>
                      ) : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      {/* Fiche Google */}
                      <a href={r.googleMapsUri!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline">
                        <span>📍</span> Fiche Google
                      </a>
                      {/* Site web */}
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:underline">
                          <span>🌐</span> Site web ✓
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <span>🌐</span> Pas de site ✗
                        </span>
                      )}
                      {/* Facebook */}
                      <a href={r.facebookSearchUrl!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-blue/80 hover:underline">
                        <span>📘</span> Chercher Facebook
                      </a>
                      {/* Instagram */}
                      <a href={r.instagramSearchUrl!} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-pink-400 hover:underline">
                        <span>📸</span> Chercher Instagram
                      </a>
                    </div>
                  </td>
                  {source === 'apollo' && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {r.linkedinUrl ? (
                        <a href={r.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline"
                          title={r.linkedinUrl}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SCORE_BADGE[r.qualificationLabel]}`}>
                      {r.qualificationLabel}
                    </span>
                    <span className="text-xs text-brand-muted ml-1">{r.qualificationScore}/10</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-brand-border flex items-center justify-between flex-wrap gap-2">
            {source === 'apollo' && (
              <button
                onClick={handleNextPage}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-brand-surface border border-brand-border text-brand-muted text-sm font-medium hover:text-white hover:bg-brand-bg transition-colors disabled:opacity-50"
              >
                Page suivante →
              </button>
            )}
            {selected.size > 0 && (
              <button onClick={handleImport}
                className="ml-auto px-5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                Importer les sélectionnés ({selected.size})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

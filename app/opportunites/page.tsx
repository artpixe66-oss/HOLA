'use client';

import { useState, useCallback } from 'react';
import type { JobOpportunity } from '@/app/api/opportunites/route';

const KEYWORD_PRESETS = [
  'Community Manager',
  'Réseaux sociaux',
  'Marketing digital',
  'Alternance communication',
  'Chargé de com',
  'Social Media',
  'Responsable communication',
  'Gestionnaire réseaux sociaux',
];

interface ApiResponse {
  jobs: JobOpportunity[];
  blocked: boolean;
  message: string | null;
  externalLinks: {
    linkedin: string;
    indeed: string;
    apec: string;
    hellowork: string;
  };
  count?: number;
}

function ExternalLinks({ links, keyword, city }: {
  links: ApiResponse['externalLinks'] | null;
  keyword: string;
  city: string;
}) {
  const base = links || {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(city || 'France')}`,
    indeed: `https://fr.indeed.com/jobs?q=${encodeURIComponent(keyword)}${city ? `&l=${encodeURIComponent(city)}` : ''}`,
    apec: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keyword)}`,
    hellowork: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(keyword)}`,
  };

  const btns = [
    { label: '🔗 LinkedIn Jobs', url: base.linkedin },
    { label: '🔗 Indeed', url: base.indeed },
    { label: '🔗 APEC', url: base.apec },
    { label: '🔗 HelloWork', url: base.hellowork },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {btns.map(b => (
        <a
          key={b.label}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border border-brand-border text-sm font-medium text-brand-muted hover:text-white hover:bg-brand-surface transition-colors"
        >
          {b.label}
        </a>
      ))}
    </div>
  );
}

export default function OpportunitesPage() {
  const [keyword, setKeyword] = useState('Community Manager');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(50);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setData(null);

    try {
      const params = new URLSearchParams({
        keyword: keyword.trim(),
        radius: String(radius),
      });
      if (city.trim()) params.set('city', city.trim());

      const res = await fetch(`/api/opportunites?${params}`);
      const json = await res.json() as ApiResponse;
      setData(json);
      if (json.jobs.length > 0) {
        showToast(`${json.jobs.length} offre${json.jobs.length > 1 ? 's' : ''} trouvée${json.jobs.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      setData({
        jobs: [],
        blocked: true,
        message: `Erreur réseau : ${err instanceof Error ? err.message : String(err)}`,
        externalLinks: {
          linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}`,
          indeed: `https://fr.indeed.com/jobs?q=${encodeURIComponent(keyword)}`,
          apec: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keyword)}`,
          hellowork: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(keyword)}`,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 border border-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Opportunités</h1>
        <p className="text-brand-muted text-sm">
          Entreprises qui cherchent à recruter en communication — vos meilleurs prospects
        </p>
      </div>

      {/* External links — always visible */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-brand-muted mb-3">Rechercher directement sur les plateformes :</p>
        <ExternalLinks links={data?.externalLinks ?? null} keyword={keyword} city={city} />
      </div>

      {/* Search form */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-5 mb-6">
        {/* Preset chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {KEYWORD_PRESETS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setKeyword(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                keyword === p
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-[#0f1729] text-brand-muted border-brand-border hover:text-white hover:bg-brand-surface/80'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Mot-clé *</label>
              <input
                type="text"
                placeholder="ex: Community Manager"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                required
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Ville (optionnel)</label>
              <input
                type="text"
                placeholder="ex: Lyon"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-2">
              Rayon : <span className="text-brand-blue font-bold">{radius} km</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-brand-muted">10 km</span>
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="flex-1 accent-brand-blue"
              />
              <span className="text-xs text-brand-muted">100 km</span>
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
          <p className="text-brand-muted text-sm">Recherche des offres d&apos;emploi en cours...</p>
        </div>
      )}

      {/* Blocked / empty state */}
      {!loading && data?.blocked && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
          <p className="text-white font-medium mb-2">Flux RSS non disponible</p>
          <p className="text-brand-muted text-sm mb-4">
            {data.message || 'Utilisez les liens de recherche externes pour trouver des offres.'}
          </p>
          <ExternalLinks links={data.externalLinks} keyword={keyword} city={city} />
        </div>
      )}

      {/* Results */}
      {!loading && data && !data.blocked && data.jobs.length === 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
          <p className="text-brand-muted text-sm">Aucune offre trouvée pour ces critères.</p>
        </div>
      )}

      {!loading && data && data.jobs.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue/20 text-brand-blue">
              Indeed RSS
            </span>
            <span className="text-sm text-brand-muted">
              {data.jobs.length} offre{data.jobs.length > 1 ? 's' : ''} trouvée{data.jobs.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-bg border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Titre du poste</th>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Entreprise</th>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Ville</th>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {data.jobs.map(job => (
                  <tr key={job.id} className="hover:bg-brand-bg/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{job.title}</span>
                        {job.isAlternance && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800/50">
                            🎓 Alternance
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{job.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">{job.company}</td>
                    <td className="px-4 py-3 text-brand-muted">{job.city || '—'}</td>
                    <td className="px-4 py-3 text-brand-muted whitespace-nowrap">{job.date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.source === 'indeed'
                          ? 'bg-brand-blue/20 text-brand-blue'
                          : job.source === 'francetravail'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : 'bg-brand-border text-brand-muted'
                      }`}>
                        {job.source === 'indeed' ? 'Indeed' : job.source === 'francetravail' ? 'France Travail' : 'Autre'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-brand-surface border border-brand-border text-xs font-medium text-brand-muted hover:text-white hover:bg-brand-bg transition-colors whitespace-nowrap"
                        >
                          📋 Voir l&apos;offre
                        </a>
                        <a
                          href={job.generatorUrl}
                          className="px-3 py-1 rounded-lg bg-brand-blue/20 border border-brand-blue/40 text-xs font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition-colors whitespace-nowrap"
                        >
                          ✉️ Contacter
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

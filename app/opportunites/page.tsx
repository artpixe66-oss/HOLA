'use client';

import { useState, useCallback, useEffect } from 'react';
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
  needsCredentials?: boolean;
  message: string | null;
  externalLinks: {
    linkedin: string;
    indeed: string;
    apec: string;
    hellowork: string;
    francetravail: string;
  };
  count?: number;
}

function relevanceScore(job: JobOpportunity): number {
  let score = 0;
  const text = (job.title + ' ' + job.description).toLowerCase();
  if (text.includes('community manager')) score += 5;
  if (text.includes('réseaux sociaux') || text.includes('social media')) score += 4;
  if (text.includes('marketing digital')) score += 3;
  if (text.includes('communication')) score += 2;
  if (job.isAlternance) score += 1;
  if (job.company && job.company !== 'Entreprise confidentielle') score += 1;
  if (job.city) score += 1;
  // add a tiny random jitter so equal-score cards appear shuffled
  score += Math.random() * 0.5;
  return score;
}

function JobCard({ job }: { job: JobOpportunity }) {
  const initials = job.company
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || job.company.slice(0, 2).toUpperCase();

  const colors = [
    'from-blue-600 to-blue-800',
    'from-violet-600 to-violet-800',
    'from-emerald-600 to-emerald-800',
    'from-indigo-600 to-indigo-800',
    'from-sky-600 to-sky-800',
    'from-teal-600 to-teal-800',
  ];
  const color = colors[(job.company.charCodeAt(0) || 0) % colors.length];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col gap-3 hover:border-brand-blue/50 transition-colors group">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-brand-blue transition-colors">
            {job.title}
          </h3>
          <p className="text-xs text-brand-muted mt-0.5 truncate">{job.company}</p>
        </div>
        {job.isAlternance && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-800/50">
            🎓 Alternance
          </span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-xs text-brand-muted leading-relaxed line-clamp-3">{job.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-brand-muted">
        {job.city && <span>📍 {job.city}</span>}
        {job.date && <span>🗓 {job.date}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg border border-brand-border text-xs font-medium text-brand-muted hover:text-white hover:bg-brand-bg transition-colors"
        >
          📋 Voir l&apos;offre
        </a>
        <a
          href={job.generatorUrl}
          className="flex-1 text-center py-2 rounded-lg bg-brand-blue/20 border border-brand-blue/40 text-xs font-medium text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
        >
          ✉️ Contacter
        </a>
      </div>
    </div>
  );
}

export default function OpportunitesPage() {
  const [keyword, setKeyword] = useState('Community Manager');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [externalLinks, setExternalLinks] = useState<ApiResponse['externalLinks'] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [ftClientId, setFtClientId] = useState('');
  const [ftClientSecret, setFtClientSecret] = useState('');
  const [credsSaved, setCredsSaved] = useState(false);

  useEffect(() => {
    setFtClientId(localStorage.getItem('helpme_ft_client_id') || '');
    setFtClientSecret(localStorage.getItem('helpme_ft_client_secret') || '');
  }, []);

  function saveCredentials() {
    localStorage.setItem('helpme_ft_client_id', ftClientId);
    localStorage.setItem('helpme_ft_client_secret', ftClientSecret);
    setCredsSaved(true);
    setTimeout(() => setCredsSaved(false), 2000);
    setShowSettings(false);
  }

  const hasCredentials = !!(ftClientId && ftClientSecret);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setJobs([]);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({ keyword: keyword.trim() });
      if (city.trim()) params.set('city', city.trim());
      if (ftClientId) params.set('ftClientId', ftClientId);
      if (ftClientSecret) params.set('ftClientSecret', ftClientSecret);

      const res = await fetch(`/api/opportunites?${params}`);
      const json = await res.json() as ApiResponse;
      setExternalLinks(json.externalLinks);

      if (json.jobs.length > 0) {
        const sorted = [...json.jobs].sort((a, b) => relevanceScore(b) - relevanceScore(a));
        setJobs(sorted);
        showToast(`${sorted.length} offre${sorted.length > 1 ? 's' : ''} trouvée${sorted.length > 1 ? 's' : ''} 🎯`);
      } else {
        setErrorMsg(json.message || 'Aucune offre trouvée.');
      }
    } catch (err) {
      setErrorMsg(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const q = encodeURIComponent(keyword);
  const defaultLinks: ApiResponse['externalLinks'] = externalLinks || {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${encodeURIComponent(city || 'France')}`,
    indeed: `https://fr.indeed.com/jobs?q=${q}&l=${encodeURIComponent(city || 'France')}`,
    apec: `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${q}`,
    hellowork: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${q}`,
    francetravail: `https://candidat.francetravail.fr/offres/recherche?motsCles=${q}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 border border-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Opportunités</h1>
          <p className="text-brand-muted text-sm">Entreprises qui cherchent à recruter en com — vos meilleurs prospects</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            hasCredentials
              ? 'border-emerald-700 text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40'
              : 'border-brand-border text-brand-muted hover:text-white hover:bg-brand-surface'
          }`}
        >
          ⚙️ {hasCredentials ? '✓ API connectée' : 'Configurer API'}
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-brand-surface border border-brand-blue/30 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Clés API France Travail</h3>
            <p className="text-xs text-brand-muted">
              Inscrivez-vous gratuitement sur <span className="text-brand-blue">francetravail.io</span> → créez une application → copiez le Client ID et le Secret.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Client ID</label>
              <input type="text" value={ftClientId} onChange={e => setFtClientId(e.target.value)} placeholder="PAR_xxxxx..."
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Client Secret</label>
              <input type="password" value={ftClientSecret} onChange={e => setFtClientSecret(e.target.value)} placeholder="••••••••••••••••"
                className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveCredentials}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${credsSaved ? 'bg-emerald-700 text-white' : 'bg-brand-blue text-white hover:bg-brand-blue-hover'}`}>
              {credsSaved ? '✓ Sauvegardé' : 'Sauvegarder'}
            </button>
            {hasCredentials && (
              <button onClick={() => { setFtClientId(''); setFtClientSecret(''); localStorage.removeItem('helpme_ft_client_id'); localStorage.removeItem('helpme_ft_client_secret'); setShowSettings(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors">
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {/* CTA if no credentials */}
      {!hasCredentials && !showSettings && (
        <div className="bg-brand-surface border border-brand-blue/20 rounded-xl p-4 mb-6 flex items-center gap-4">
          <span className="text-2xl">🔑</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Connectez l&apos;API France Travail pour voir les offres en direct</p>
            <p className="text-xs text-brand-muted mt-0.5">Gratuit — inscription sur francetravail.io en 2 minutes</p>
          </div>
          <button onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover transition-colors whitespace-nowrap">
            Configurer →
          </button>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-brand-surface rounded-xl border border-brand-border p-5 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {KEYWORD_PRESETS.map(p => (
            <button key={p} type="button" onClick={() => setKeyword(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                keyword === p ? 'bg-brand-blue text-white border-brand-blue' : 'text-brand-muted border-brand-border hover:text-white hover:border-brand-blue/40'
              }`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="ex: Community Manager" required
            className="flex-1 bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ville (optionnel)"
            className="w-44 bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          <button type="submit" disabled={loading || !hasCredentials}
            className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
            {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
          </button>
        </div>
      </form>

      {/* External links */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'LinkedIn Jobs', url: defaultLinks.linkedin },
          { label: 'Indeed', url: defaultLinks.indeed },
          { label: 'France Travail', url: defaultLinks.francetravail },
          { label: 'APEC', url: defaultLinks.apec },
          { label: 'HelloWork', url: defaultLinks.hellowork },
        ].map(b => (
          <a key={b.label} href={b.url} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-medium text-brand-muted hover:text-white hover:bg-brand-surface transition-colors">
            🔗 {b.label}
          </a>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-brand-border rounded w-3/4" />
                  <div className="h-2 bg-brand-border rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="h-2 bg-brand-border rounded" />
                <div className="h-2 bg-brand-border rounded w-5/6" />
                <div className="h-2 bg-brand-border rounded w-4/6" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-brand-border rounded-lg" />
                <div className="flex-1 h-8 bg-brand-border rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && errorMsg && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 text-center">
          <p className="text-brand-muted text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && jobs.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400">France Travail</span>
            <span className="text-sm text-brand-muted">{jobs.length} offres — triées par pertinence</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}
    </div>
  );
}

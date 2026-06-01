'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProspectType } from '@/lib/types';
import { generateMessage } from '@/lib/messages';

function GeneratorContent() {
  const params = useSearchParams();
  const [type, setType] = useState<ProspectType>((params.get('type') as ProspectType) || 'commerçant');
  const [msgType, setMsgType] = useState<'email' | 'sms'>('email');
  const [name, setName] = useState(params.get('name') || '');
  const [company, setCompany] = useState(params.get('company') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [result, setResult] = useState<{ subject?: string; body?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (name || company) generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generate() {
    setLoading(true);
    const msg = generateMessage(type, msgType, name, company, city);
    setResult(msg);
    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Générateur de messages</h1>

      <div className="bg-brand-surface rounded-xl border border-brand-border p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Type de prospect</label>
            <select value={type} onChange={e => setType(e.target.value as ProspectType)}
              className="w-full bg-brand-bg border border-brand-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option value="commerçant">Commerçant</option>
              <option value="producteur">Producteur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Type de message</label>
            <div className="flex rounded-lg border border-brand-border overflow-hidden">
              {(['email', 'sms'] as const).map(t => (
                <button key={t} onClick={() => setMsgType(t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${msgType === t ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-muted hover:bg-brand-border'}`}>
                  {t === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Nom du contact</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Jean Dupont"
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Entreprise / enseigne</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="ex: Boulangerie Martin"
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-brand-muted mb-1">Ville</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="ex: Lyon"
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-hover disabled:opacity-50 transition-colors">
          {loading ? 'Génération...' : 'Générer le message'}
        </button>
      </div>

      {result && (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
          {result.subject && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-brand-muted">Objet</label>
                <button onClick={() => copy(result.subject!, 'subject')}
                  className="text-xs text-brand-blue hover:underline">{copied === 'subject' ? 'Copié !' : 'Copier'}</button>
              </div>
              <div className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm font-medium text-white">{result.subject}</div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-brand-muted">Message</label>
              <button onClick={() => copy(result.body!, 'body')}
                className="text-xs text-brand-blue hover:underline">{copied === 'body' ? 'Copié !' : 'Copier'}</button>
            </div>
            <textarea readOnly value={result.body || ''} rows={msgType === 'sms' ? 4 : 14}
              className="w-full bg-brand-bg border border-brand-border text-white rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none" />
          </div>
          <button onClick={() => copy((result.subject ? `Objet : ${result.subject}\n\n` : '') + (result.body || ''), 'all')}
            className="w-full py-2 border border-brand-border text-brand-muted rounded-lg text-sm hover:bg-brand-bg hover:text-white transition-colors">
            {copied === 'all' ? 'Copié !' : 'Tout copier'}
          </button>
        </div>
      )}

      <div className="mt-6 bg-brand-surface rounded-xl border border-brand-blue/20 p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Nos packs HelpMe</h3>
        <ul className="text-sm text-brand-muted space-y-1">
          <li><strong className="text-white">Pack Essentiel</strong> — Google Business, photos pro, référencement local</li>
          <li><strong className="text-white">Pack Pro</strong> — Essentiel + réseaux sociaux gérés, contenu mensuel</li>
          <li><strong className="text-white">Pack Premium</strong> — Pro + site vitrine, Google Ads, bilan mensuel</li>
        </ul>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorContent />
    </Suspense>
  );
}

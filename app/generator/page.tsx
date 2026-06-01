'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProspectType } from '@/lib/types';

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

  async function generate() {
    setLoading(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, messageType: msgType, name, company, city }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Générateur de messages</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de prospect</label>
            <select value={type} onChange={e => setType(e.target.value as ProspectType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="commerçant">Commerçant</option>
              <option value="producteur">Producteur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de message</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(['email', 'sms'] as const).map(t => (
                <button key={t} onClick={() => setMsgType(t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${msgType === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {t === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du contact</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Jean Dupont"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entreprise / enseigne</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="ex: Boulangerie Martin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="ex: Lyon"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Génération...' : 'Générer le message'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {result.subject && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Objet</label>
                <button onClick={() => copy(result.subject!, 'subject')}
                  className="text-xs text-blue-600 hover:underline">{copied === 'subject' ? 'Copié !' : 'Copier'}</button>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium">{result.subject}</div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Message</label>
              <button onClick={() => copy(result.body!, 'body')}
                className="text-xs text-blue-600 hover:underline">{copied === 'body' ? 'Copié !' : 'Copier'}</button>
            </div>
            <textarea readOnly value={result.body || ''} rows={msgType === 'sms' ? 4 : 14}
              className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none" />
          </div>
          <button onClick={() => copy((result.subject ? `Objet : ${result.subject}\n\n` : '') + (result.body || ''), 'all')}
            className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            {copied === 'all' ? 'Copié !' : 'Tout copier'}
          </button>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Nos packs HelpMe</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Pack Essentiel</strong> — Google Business, photos pro, référencement local</li>
          <li><strong>Pack Pro</strong> — Essentiel + réseaux sociaux gérés, contenu mensuel</li>
          <li><strong>Pack Premium</strong> — Pro + site vitrine, Google Ads, bilan mensuel</li>
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

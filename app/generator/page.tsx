'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProspectType } from '@/lib/types';
import { generateMessage, generatePhoneScript, type PhoneScriptStep } from '@/lib/messages';

function GeneratorContent() {
  const params = useSearchParams();
  const [type, setType] = useState<ProspectType>((params.get('type') as ProspectType) || 'commerçant');
  const [tab, setTab] = useState<'message' | 'script'>('message');
  const [msgType, setMsgType] = useState<'email' | 'sms'>('email');
  const [name, setName] = useState(params.get('name') || '');
  const [company, setCompany] = useState(params.get('company') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [result, setResult] = useState<{ subject?: string; body?: string } | null>(null);
  const [script, setScript] = useState<PhoneScriptStep[] | null>(null);
  const [activeStep, setActiveStep] = useState<string>('intro');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (name || company) {
      setResult(generateMessage(type, msgType, name, company, city));
      setScript(generatePhoneScript(type, name, company, city, category));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generate() {
    setResult(generateMessage(type, msgType, name, company, city));
    setScript(generatePhoneScript(type, name, company, city, category));
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function copyFullScript() {
    if (!script) return;
    const full = script.map(s => `── ${s.icon} ${s.label.toUpperCase()} ──\n${s.content}`).join('\n\n');
    copy(full, 'script');
  }

  const currentStep = script?.find(s => s.id === activeStep);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Générateur</h1>

      {/* Form */}
      <div className="bg-brand-surface rounded-xl border border-brand-border p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Type de prospect</label>
            <select value={type} onChange={e => setType(e.target.value as ProspectType)}
              className="w-full bg-brand-bg border border-brand-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue">
              <option value="commerçant">Commerçant</option>
              <option value="producteur">Producteur</option>
              <option value="artisan">Artisan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Catégorie / métier</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="ex: boulanger, plombier..."
              className="w-full bg-brand-bg border border-brand-border text-white placeholder-brand-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
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
        <button onClick={generate}
          className="w-full py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-hover transition-colors">
          Générer
        </button>
      </div>

      {/* Tabs */}
      {(result || script) && (
        <>
          <div className="flex gap-1 mb-4 bg-brand-surface border border-brand-border rounded-xl p-1">
            <button onClick={() => setTab('message')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'message' ? 'bg-brand-blue text-white' : 'text-brand-muted hover:text-white'}`}>
              ✉️ Email / SMS
            </button>
            <button onClick={() => setTab('script')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'script' ? 'bg-brand-blue text-white' : 'text-brand-muted hover:text-white'}`}>
              📞 Script téléphonique
            </button>
          </div>

          {/* Message tab */}
          {tab === 'message' && result && (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
              <div className="flex rounded-lg border border-brand-border overflow-hidden mb-2">
                {(['email', 'sms'] as const).map(t => (
                  <button key={t} onClick={() => { setMsgType(t); setResult(generateMessage(type, t, name, company, city)); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${msgType === t ? 'bg-brand-blue text-white' : 'bg-brand-bg text-brand-muted hover:bg-brand-border'}`}>
                    {t === 'email' ? 'Email' : 'SMS'}
                  </button>
                ))}
              </div>
              {result.subject && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-brand-muted">Objet</label>
                    <button onClick={() => copy(result.subject!, 'subject')} className="text-xs text-brand-blue hover:underline">
                      {copied === 'subject' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <div className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm font-medium text-white">{result.subject}</div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-brand-muted">Message</label>
                  <button onClick={() => copy(result.body!, 'body')} className="text-xs text-brand-blue hover:underline">
                    {copied === 'body' ? 'Copié !' : 'Copier'}
                  </button>
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

          {/* Phone script tab */}
          {tab === 'script' && script && (
            <div className="space-y-4">
              {/* Step nav */}
              <div className="flex gap-2 flex-wrap">
                {script.map(step => (
                  <button key={step.id} onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeStep === step.id
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'border-brand-border text-brand-muted hover:text-white hover:border-brand-blue/50'
                    }`}>
                    <span>{step.icon}</span>
                    <span>{step.label}</span>
                  </button>
                ))}
              </div>

              {/* Current step */}
              {currentStep && (
                <div className={`rounded-xl border p-6 ${currentStep.color}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{currentStep.icon}</span> {currentStep.label}
                    </h2>
                    <button onClick={() => copy(currentStep.content, currentStep.id)}
                      className="text-xs text-brand-blue hover:underline">
                      {copied === currentStep.id ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <div className="bg-brand-bg/60 rounded-lg p-4 text-sm text-white whitespace-pre-wrap leading-relaxed font-mono border border-brand-border/50">
                    {currentStep.content}
                  </div>
                  {currentStep.tip && (
                    <div className="mt-3 flex items-start gap-2 bg-brand-blue/10 border border-brand-blue/20 rounded-lg px-4 py-3">
                      <span className="text-brand-blue text-sm">💡</span>
                      <p className="text-sm text-brand-muted">{currentStep.tip}</p>
                    </div>
                  )}
                  {/* Prev / Next */}
                  <div className="flex justify-between mt-4">
                    {script.findIndex(s => s.id === activeStep) > 0 && (
                      <button
                        onClick={() => setActiveStep(script[script.findIndex(s => s.id === activeStep) - 1].id)}
                        className="px-4 py-2 border border-brand-border text-brand-muted rounded-lg text-sm hover:text-white hover:border-brand-blue/50 transition-colors">
                        ← Étape précédente
                      </button>
                    )}
                    <div className="flex-1" />
                    {script.findIndex(s => s.id === activeStep) < script.length - 1 && (
                      <button
                        onClick={() => setActiveStep(script[script.findIndex(s => s.id === activeStep) + 1].id)}
                        className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm hover:bg-brand-blue-hover transition-colors">
                        Étape suivante →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Copy full script */}
              <button onClick={copyFullScript}
                className="w-full py-2.5 border border-brand-border text-brand-muted rounded-xl text-sm hover:bg-brand-surface hover:text-white transition-colors">
                {copied === 'script' ? '✓ Script complet copié !' : 'Copier le script complet'}
              </button>
            </div>
          )}
        </>
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

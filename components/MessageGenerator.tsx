"use client";

import { useState } from "react";
import type { ProspectType } from "@/lib/types";

interface GeneratedMessage {
  subject?: string;
  body: string;
}

export default function MessageGenerator() {
  const [type, setType] = useState<ProspectType>("commerçant");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<GeneratedMessage | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, messageType: channel, name, company, city }),
      });
      const data = await res.json();
      setMessage(data);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!message) return;
    const text = message.subject
      ? `Objet : ${message.subject}\n\n${message.body}`
      : message.body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Paramètres du message</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(["email", "sms"] as const).map((c) => (
              <button
                key={c}
                onClick={() => { setChannel(c); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  channel === c
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c === "email" ? "Email" : "SMS"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de prospect</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(["commerçant", "producteur"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                  type === t
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contact</label>
          <input
            type="text"
            placeholder="ex: Marie Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
          <input
            type="text"
            placeholder="ex: Ferme des Collines"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
          <input
            type="text"
            placeholder="ex: Lyon"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Génération..." : "Générer le message"}
        </button>

        <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-800 space-y-1">
          <p className="font-semibold">Offre HelpMe — rappel</p>
          <p>Pack Essentiel : Google Business + photos pro + référencement local</p>
          <p>Pack Pro : Essentiel + réseaux sociaux + contenu mensuel</p>
          <p>Pack Premium : Pro + site vitrine + Google Ads + bilan mensuel</p>
        </div>
      </div>

      {/* Right: result */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Message généré</h2>
          {message && (
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          )}
        </div>

        {!message ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            <p>Remplissez le formulaire et cliquez sur &ldquo;Générer&rdquo;</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            {message.subject && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Objet
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-800">
                  {message.subject}
                </div>
              </div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {channel === "email" ? "Corps du message" : "Message"}
              </label>
              <textarea
                readOnly
                value={message.body}
                rows={channel === "sms" ? 5 : 16}
                className="w-full bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-800 resize-none border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {channel === "sms" && (
              <p className="text-xs text-gray-400">{message.body.length} caractères</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError("Veuillez sélectionner un fichier CSV.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur import");
      setResult(data);
      if (data.inserted > 0) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Importer des prospects (CSV)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ×
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div>
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} Ko</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">Glissez votre fichier CSV ici</p>
              <p className="text-sm text-gray-400 mt-1">ou cliquez pour parcourir</p>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">Colonnes reconnues :</p>
          <p>nom, entreprise, type (producteur/commerçant), email, telephone, ville, statut, notes</p>
          <p>Les séparateurs virgule (,) et point-virgule (;) sont acceptés.</p>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            <p className="font-medium">{result.inserted} prospect(s) importé(s) avec succès</p>
            {result.errors.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-red-600">
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importation..." : "Importer"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Field } from "./ui";
import { canonicalValue, vocabValues, type VocabKey } from "@/lib/vocab";
import type { Store } from "@/lib/types";

/** Champ à valeurs réutilisables : suggestions cliquables, orthographe existante reprise automatiquement. */
export default function VocabField({ store, k, label, value, onChange, className = "" }: { store: Store; k: VocabKey; label: string; value: string; onChange: (v: string) => void; className?: string }) {
  const values = vocabValues(store, k).filter((v) => v.value !== value).slice(0, 5);
  return (
    <Field label={label} className={className}>
      <input className="input" list={`vocab-${k}`} value={value} onChange={(e) => onChange(e.target.value)} onBlur={(e) => { const c = canonicalValue(store, k, e.target.value); if (c !== e.target.value) onChange(c); }} />
      <datalist id={`vocab-${k}`}>
        {vocabValues(store, k).map((v) => <option key={v.value} value={v.value} />)}
      </datalist>
      {values.length > 0 && (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {values.map((v) => (
            <button key={v.value} type="button" onClick={() => onChange(v.value)} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted hover:text-white">{v.value}</button>
          ))}
        </span>
      )}
    </Field>
  );
}

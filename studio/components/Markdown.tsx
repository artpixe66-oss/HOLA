import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-white/10 px-1 text-[0.9em]">{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Rendu léger du markdown produit par l'agent : blocs de code, tableaux, titres, listes. */
export default function Markdown({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(<pre key={out.length}>{buf.join("\n")}</pre>);
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      out.push(
        <table key={out.length}>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => (ri === 0 ? <th key={ci}>{inline(c)}</th> : <td key={ci}>{inline(c)}</td>))}</tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) out.push(<p key={out.length} className="mt-2 font-semibold">{inline(h[2])}</p>);
    else if (/^\s*([-*]|\d+\.)\s+/.test(line)) out.push(<p key={out.length} className="pl-4 -indent-3">• {inline(line.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</p>);
    else if (line.trim()) out.push(<p key={out.length}>{inline(line)}</p>);
    else out.push(<div key={out.length} className="h-2" />);
    i++;
  }
  return <div className="prose-agent space-y-1 text-sm leading-relaxed">{out}</div>;
}

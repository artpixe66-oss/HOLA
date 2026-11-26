// Les cartes sont en SVG : on coupe le texte nous-mêmes, mesuré avec un canvas.
let ctx: CanvasRenderingContext2D | null = null;

export function measure(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * parseFloat(font.match(/(\d+)px/)?.[1] ?? "16") * 0.55;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * 9;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export function wrap(text: string, font: string, maxWidth: number, maxLines = 99): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (measure(next, font) <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

/** Réduit la taille de police jusqu'à ce que le texte tienne sur une ligne. */
export function fitSize(text: string, family: string, weight: string, maxWidth: number, start: number, min: number): number {
  let size = start;
  while (size > min && measure(text, `${weight} ${size}px ${family}`) > maxWidth) size -= 1;
  return size;
}

export { BODY, DISPLAY, HUMAN, SERIF } from "./fonts";

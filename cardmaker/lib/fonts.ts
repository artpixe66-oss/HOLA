// Polices de carte (SIL OFL), servies depuis /fonts et intégrées au SVG à l'export.
export const DISPLAY = "CardDisplay, 'Arial Black', sans-serif";
export const BODY = "CardBody, 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "CardSerif, Georgia, serif";

const FACES = [
  { family: "CardDisplay", weight: 400, style: "normal", file: "card-display.woff2" },
  { family: "CardBody", weight: 400, style: "normal", file: "card-body-400.woff2" },
  { family: "CardBody", weight: 400, style: "italic", file: "card-body-400i.woff2" },
  { family: "CardBody", weight: 700, style: "normal", file: "card-body-700.woff2" },
  { family: "CardSerif", weight: 400, style: "normal", file: "card-serif-400.woff2" },
  { family: "CardSerif", weight: 400, style: "italic", file: "card-serif-400i.woff2" },
  { family: "CardSerif", weight: 700, style: "normal", file: "card-serif-700.woff2" },
];

let embedded: Promise<string> | null = null;

/** CSS @font-face avec les polices en base64, pour que l'image exportée les garde. */
export function embeddedFontCss(): Promise<string> {
  embedded ??= Promise.all(
    FACES.map(async (f) => {
      const buf = await (await fetch(`/fonts/${f.file}`)).arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `@font-face{font-family:${f.family};font-weight:${f.weight};font-style:${f.style};src:url(data:font/woff2;base64,${btoa(bin)}) format("woff2");}`;
    }),
  ).then((parts) => parts.join(""));
  return embedded;
}

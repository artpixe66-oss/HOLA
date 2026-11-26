"use client";

import { useId, useSyncExternalStore, type Ref } from "react";
import { ARCANES, ELEMENTS, RARITIES, parseCost } from "@/lib/elements";
import { HUMAN, SERIF, fitSize, measure, wrap } from "@/lib/text";
import type { ArcaneId, BorderId, CardState, ElementId, HoloMode, Rarity } from "@/lib/types";

export const CARD_W = 630;
export const CARD_H = 880;

/* ------------------------------------------------------------------ */
/* Éléments communs                                                    */
/* ------------------------------------------------------------------ */

export const BORDERS: Record<BorderId, { label: string; stops: string[]; ink: string }> = {
  argent: { label: "Argent", stops: ["#8a929b", "#eef1f4", "#a7afb8", "#f8fafb", "#7b838c"], ink: "#1c1c1c" },
  or: { label: "Or", stops: ["#9a7222", "#f8e3a0", "#c69a3b", "#fff2c6", "#87621b"], ink: "#2a1d05" },
  noir: { label: "Noir", stops: ["#050505", "#2c2c2c", "#0a0a0a", "#353535", "#050505"], ink: "#f2f2f2" },
  blanc: { label: "Blanc", stops: ["#d6d6d6", "#ffffff", "#ececec", "#ffffff", "#cdcdcd"], ink: "#1c1c1c" },
  "arc-en-ciel": { label: "Arc-en-ciel", stops: ["#ff9ec7", "#ffe49e", "#a8ffd0", "#9ed8ff", "#d6a8ff"], ink: "#1c1c1c" },
};

function BorderGradient({ id, border }: { id: string; border: BorderId }) {
  const stops = BORDERS[border].stops;
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
    </linearGradient>
  );
}

/** Pastille ronde d'élément avec notre propre pictogramme. */
function ElementIcon({ el, x, y, r }: { el: ElementId; x: number; y: number; r: number }) {
  const d = ELEMENTS[el];
  const s = (r * 1.15) / 24;
  return (
    <g>
      <circle cx={x} cy={y} r={r + r / 9} fill="#1b1b1b" opacity={0.55} />
      <circle cx={x} cy={y} r={r} fill={d.color} stroke="#fff" strokeWidth={r / 7} />
      <ellipse cx={x - r * 0.28} cy={y - r * 0.38} rx={r * 0.5} ry={r * 0.28} fill="#fff" opacity={0.28} />
      <path d={d.glyph} fill="#fff" fillRule="evenodd" transform={`translate(${x - 12 * s} ${y - 12 * s}) scale(${s})`} />
    </g>
  );
}

function RarityMark({ rarity, x, y, ink }: { rarity: Rarity; x: number; y: number; ink: string }) {
  const c = RARITIES[rarity].color;
  if (rarity === "commune") return <circle cx={x} cy={y} r={4.5} fill={ink} />;
  if (rarity === "peu-commune") return <polygon points={`${x},${y - 5.5} ${x + 5.5},${y} ${x},${y + 5.5} ${x - 5.5},${y}`} fill={ink} />;
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 2.8 : 7;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={star} fill={rarity === "legendaire" ? c : ink} stroke={rarity === "legendaire" ? ink : "none"} strokeWidth={0.8} />;
}

function HoloDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff5fa2" />
        <stop offset="0.2" stopColor="#ffe45f" />
        <stop offset="0.4" stopColor="#5fffb0" />
        <stop offset="0.6" stopColor="#5fc8ff" />
        <stop offset="0.8" stopColor="#b35fff" />
        <stop offset="1" stopColor="#ff5fa2" />
      </linearGradient>
      <pattern id={`${id}-sparkle`} width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="10" r="1.6" fill="#fff" />
        <circle cx="31" cy="24" r="1.1" fill="#fff" />
        <circle cx="18" cy="38" r="1.3" fill="#fff" />
        <path d="M40 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#fff" />
      </pattern>
    </>
  );
}

function holoLayer(id: string, mode: HoloMode, target: "art" | "card", clip: string) {
  if (mode === "aucun" || (mode === "illustration" && target === "card") || (mode === "carte" && target === "art")) return null;
  return (
    <g clipPath={`url(#${clip})`} style={{ mixBlendMode: "screen" }} opacity={target === "art" ? 0.34 : 0.16}>
      <rect width={CARD_W} height={CARD_H} fill={`url(#${id}-holo)`} />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={-300 + i * 90} y={-100} width={22} height={1200} fill="#fff" opacity={0.18} transform="rotate(25 315 440)" />
      ))}
      <rect width={CARD_W} height={CARD_H} fill={`url(#${id}-sparkle)`} opacity={0.9} />
    </g>
  );
}

function Img({ image, x, y, w, h }: { image: string; x: number; y: number; w: number; h: number }) {
  return <image href={image} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />;
}

/** Texte lisible sur une illustration : contour sombre sous le remplissage. */
const halo = { stroke: "#000", strokeOpacity: 0.55, strokeWidth: 4, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

/* ------------------------------------------------------------------ */
/* Carte « Créature »                                                   */
/* ------------------------------------------------------------------ */

const STAGES = { base: "DE BASE", evo1: "ÉVOLUTION 1", evo2: "ÉVOLUTION 2" } as const;
const FACE = { x: 20, y: 20, width: 590, height: 840, rx: 12 };
const ART = { x: 40, y: 96, width: 550, height: 340 };

function CreatureCard({ s, id }: { s: CardState; id: string }) {
  const c = s.creature;
  const el = ELEMENTS[c.element];
  const full = c.fullArt && !!s.image;
  const ink = "#141414";
  const head = full ? { fill: "#fff", ...halo } : { fill: ink };

  const stage = STAGES[c.stage];
  const tagW = 16 + measure(stage, `700 11px ${HUMAN}`) + stage.length * 1;
  const nameX = 32 + tagW + 10;
  const nameSize = fitSize(c.name || " ", HUMAN, "700", 452 - nameX, 36, 18);

  // Pouvoir + attaques, empilés puis réduits si ça déborde.
  const top = full ? 490 : 482;
  const bottom = 734;
  const descSize = 16.5;
  const lh = 20;
  const descFont = `400 ${descSize}px ${HUMAN}`;
  // Chaque bloc (pouvoir, attaque) connaît sa hauteur ; on les répartit ensuite sur la zone.
  const blocks: { h: number; draw: (y: number) => React.ReactNode }[] = [];
  if (c.power && (c.power.name || c.power.text)) {
    const power = c.power;
    const lines = wrap(power.text, descFont, 550, 3);
    blocks.push({
      h: 34 + lines.length * lh,
      draw: (y) => (
        <g key="power">
          <rect x={40} y={y + 3} width={92} height={23} rx={4} fill="#b3261e" />
          <text x={86} y={y + 19.5} textAnchor="middle" fontFamily={HUMAN} fontWeight={700} fontSize={12.5} letterSpacing={1.4} fill="#fff">POUVOIR</text>
          <text x={144} y={y + 23} fontFamily={HUMAN} fontWeight={700} fontSize={fitSize(power.name, HUMAN, "700", 440, 24, 15)} fill="#b3261e">{power.name}</text>
          <text fontFamily={HUMAN} fontSize={descSize} fill={ink}>
            {lines.map((l, i) => <tspan key={i} x={40} y={y + 47 + i * lh}>{l}</tspan>)}
          </text>
        </g>
      ),
    });
  }
  c.attacks.slice(0, 3).forEach((a, ai) => {
    const costs = a.cost.slice(0, 5);
    const costEnd = 40 + Math.max(costs.length, 1) * 31 + 8;
    const size = fitSize(a.name, HUMAN, "700", 590 - costEnd - 80, 25, 15);
    const w = measure(a.name, `700 ${size}px ${HUMAN}`);
    // Nom d'attaque centré sur la carte, sauf s'il touche les coûts.
    const centered = 315 - w / 2 >= costEnd && 315 + w / 2 <= 510;
    const lines = a.text ? wrap(a.text, descFont, 550, 3) : [];
    blocks.push({
      h: 34 + (lines.length ? 6 + lines.length * lh : 0),
      draw: (y) => (
        <g key={`atk${ai}`}>
          {costs.map((e, i) => <ElementIcon key={i} el={e} x={54 + i * 31} y={y + 16} r={13.5} />)}
          <text x={centered ? 315 : costEnd} y={y + 25} textAnchor={centered ? "middle" : "start"} fontFamily={HUMAN} fontWeight={700} fontSize={size} fill={ink}>{a.name}</text>
          <text x={590} y={y + 27} textAnchor="end" fontFamily={HUMAN} fontWeight={700} fontSize={29} fill={ink}>{a.damage}</text>
          {lines.length > 0 && (
            <text fontFamily={HUMAN} fontSize={descSize} fill={ink}>
              {lines.map((l, i) => <tspan key={i} x={40} y={y + 52 + i * lh}>{l}</tspan>)}
            </text>
          )}
        </g>
      ),
    });
  });
  const used = blocks.reduce((t, b) => t + b.h, 0);
  const minGap = 16;
  const k = Math.min(1, (bottom - top) / Math.max(1, used + minGap * Math.max(0, blocks.length - 1)));
  // Espace libre réparti entre et autour des blocs (plafonné pour ne pas trop les écarter).
  const free = Math.max(0, bottom - top - used - minGap * Math.max(0, blocks.length - 1));
  const gap = minGap + Math.min(free / (blocks.length + 1), 46);
  const lead = Math.min(free / (blocks.length + 1), 46) * 0.6;
  let y = top + (k < 1 ? 0 : lead);
  const body = blocks.map((b) => {
    const node = b.draw(y);
    y += b.h + (k < 1 ? minGap : gap);
    return node;
  });
  const flavorLines = wrap(c.flavor, `italic 400 11.5px ${HUMAN}`, 284, 4);

  // Ligne faiblesse / résistance / repli : étiquette puis valeur, sur une seule ligne.
  const statFont = `700 12px ${HUMAN}`;
  const stat = (label: string, x: number) => ({ label, x, after: x + measure(label, statFont) + 18 });
  const weak = stat("faiblesse", 40);
  const resi = stat("résistance", 236);
  const retr = stat("repli", 446);
  const setW = measure(s.setNumber, `700 11.5px ${HUMAN}`);

  return (
    <>
      <defs>
        <HoloDefs id={id} />
        <BorderGradient id={`${id}-border`} border={c.border} />
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={el.color} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={el.color} stopOpacity={0.18} />
          <stop offset="1" stopColor={el.color} stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.25" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <pattern id={`${id}-motif`} width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
          <path d={el.glyph} fill={el.dark} opacity={0.09} transform="translate(8 8) scale(1.4)" />
          <path d={el.glyph} fill={el.dark} opacity={0.06} transform="translate(40 40) scale(0.8)" />
        </pattern>
        <linearGradient id={`${id}-veil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.88} />
        </linearGradient>
        <linearGradient id={`${id}-topshade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-faceclip`}><rect {...FACE} /></clipPath>
        <clipPath id={`${id}-artclip`}><rect x={ART.x} y={ART.y} width={ART.width} height={ART.height} /></clipPath>
      </defs>

      {/* Bordure + face */}
      <rect width={CARD_W} height={CARD_H} rx={30} fill={`url(#${id}-border)`} />
      <rect x={FACE.x - 1.5} y={FACE.y - 1.5} width={FACE.width + 3} height={FACE.height + 3} rx={13} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={1.5} />
      {full ? (
        <g clipPath={`url(#${id}-faceclip)`}>
          <Img image={s.image!} x={FACE.x} y={FACE.y} w={FACE.width} h={FACE.height} />
          {holoLayer(id, s.holo, "art", `${id}-faceclip`)}
          <rect x={FACE.x} y={FACE.y} width={FACE.width} height={130} fill={`url(#${id}-topshade)`} />
          <rect x={28} y={top - 14} width={574} height={854 - top + 14} rx={10} fill={`url(#${id}-veil)`} />
        </g>
      ) : (
        <g clipPath={`url(#${id}-faceclip)`}>
          <rect {...FACE} fill={el.light} />
          <rect {...FACE} fill={`url(#${id}-face)`} />
          <rect {...FACE} fill={`url(#${id}-motif)`} />
          <rect {...FACE} fill={`url(#${id}-glow)`} />
        </g>
      )}

      {/* En-tête : stade, nom, PV, élément sur une même ligne */}
      <rect x={32} y={42} width={tagW} height={19} rx={4} fill={full ? "#000" : "#fff"} fillOpacity={full ? 0.45 : 0.8} stroke={full ? "#fff" : "#333"} strokeOpacity={0.6} strokeWidth={0.8} />
      <text x={32 + tagW / 2} y={56} textAnchor="middle" fontFamily={HUMAN} fontWeight={700} fontSize={11} letterSpacing={1} fill={full ? "#fff" : "#222"}>{stage}</text>
      <text x={nameX} y={72} fontFamily={HUMAN} fontWeight={700} fontSize={nameSize} {...head}>{c.name}</text>
      {c.stage !== "base" && c.evolvesFrom && (
        <text x={nameX} y={86} fontFamily={HUMAN} fontStyle="italic" fontSize={10.5} {...head} strokeWidth={full ? 3 : 0}>Évolue de {c.evolvesFrom}</text>
      )}
      <text x={551} y={74} textAnchor="end" fontFamily={HUMAN} fontWeight={700} {...head}>
        <tspan fontSize={14}>PV </tspan>
        <tspan fontSize={38}>{c.hp}</tspan>
      </text>
      <ElementIcon el={c.element} x={577} y={61} r={19} />

      {/* Illustration encadrée */}
      {!full && (
        <g>
          <rect x={ART.x - 6} y={ART.y - 6} width={ART.width + 12} height={ART.height + 12} rx={2} fill={`url(#${id}-border)`} />
          <rect x={ART.x - 6} y={ART.y - 6} width={ART.width + 12} height={ART.height + 12} rx={2} fill="none" stroke="#000" strokeOpacity={0.4} />
          <g clipPath={`url(#${id}-artclip)`}>
            {s.image ? (
              <Img image={s.image} x={ART.x} y={ART.y} w={ART.width} h={ART.height} />
            ) : (
              <g>
                <rect {...ART} fill={el.color} />
                <rect {...ART} fill={`url(#${id}-glow)`} />
                <path d={el.glyph} fill="#fff" opacity={0.22} transform={`translate(${315 - 110} ${268 - 110}) scale(9.2)`} />
                <text x={315} y={276} textAnchor="middle" fontFamily={HUMAN} fontWeight={700} fontSize={21} fill="#fff">Ajoute ou génère une illustration</text>
              </g>
            )}
          </g>
          {holoLayer(id, s.holo, "art", `${id}-artclip`)}
          <rect x={ART.x} y={ART.y} width={ART.width} height={ART.height} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={2} />

          {/* Bandeau d'infos sous l'illustration */}
          <polygon points="72,444 558,444 570,454 558,464 72,464 60,454" fill={`url(#${id}-border)`} stroke="#000" strokeOpacity={0.3} />
          <text x={315} y={458.5} textAnchor="middle" fontFamily={HUMAN} fontStyle="italic" fontSize={fitSize(c.info || " ", HUMAN, "italic 400", 470, 11.5, 8)} fill={BORDERS[c.border].ink}>{c.info}</text>
        </g>
      )}

      <g transform={k < 1 ? `translate(40 ${top}) scale(${k}) translate(-40 -${top})` : undefined}>{body}</g>

      {/* Faiblesse / résistance / repli */}
      <line x1={36} x2={594} y1={742} y2={742} stroke={ink} strokeOpacity={0.35} strokeWidth={1} />
      <line x1={36} x2={594} y1={772} y2={772} stroke={ink} strokeOpacity={0.35} strokeWidth={1} />
      {[weak, resi, retr].map((st) => (
        <text key={st.label} x={st.x} y={761} fontFamily={HUMAN} fontWeight={700} fontSize={12} fill={ink}>{st.label}</text>
      ))}
      {c.weakness && (
        <g>
          <ElementIcon el={c.weakness} x={weak.after} y={757} r={9.5} />
          <text x={weak.after + 14} y={762} fontFamily={HUMAN} fontWeight={700} fontSize={14} fill={ink}>×2</text>
        </g>
      )}
      {c.resistance && (
        <g>
          <ElementIcon el={c.resistance} x={resi.after} y={757} r={9.5} />
          <text x={resi.after + 14} y={762} fontFamily={HUMAN} fontWeight={700} fontSize={14} fill={ink}>−30</text>
        </g>
      )}
      {Array.from({ length: Math.max(0, Math.min(c.retreat, 4)) }, (_, i) => (
        <ElementIcon key={i} el="neutre" x={retr.after + i * 22} y={757} r={9} />
      ))}

      {/* Pied : illustrateur, numéro et rareté à gauche, texte d'ambiance à droite */}
      <text x={36} y={796} fontFamily={HUMAN} fontStyle="italic" fontSize={11} fill={ink}>Illus. {s.illustrator}</text>
      <text x={36} y={818} fontFamily={HUMAN} fontWeight={700} fontSize={11.5} fill={ink}>{s.setNumber}</text>
      <RarityMark rarity={s.rarity} x={36 + setW + 10} y={814} ink={ink} />
      {c.flavor && (
        <text fontFamily={HUMAN} fontStyle="italic" fontSize={11.5} fill={ink}>
          {flavorLines.map((l, i) => <tspan key={i} x={306} y={790 + i * 14}>{l}</tspan>)}
        </text>
      )}
      <text x={36} y={846} fontFamily={HUMAN} fontSize={8.5} fill={ink} opacity={0.6}>Création personnelle</text>

      {holoLayer(id, s.holo, "card", `${id}-faceclip`)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Carte « Arcane » (fantasy)                                           */
/* ------------------------------------------------------------------ */

function Orb({ x, y, r, fill, label }: { x: number; y: number; r: number; fill: string; label?: string }) {
  return (
    <g>
      <circle cx={x + 1.2} cy={y + 1.8} r={r} fill="#000" opacity={0.45} />
      <circle cx={x} cy={y} r={r} fill={fill} stroke="#1b140e" strokeWidth={1.4} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.4} rx={r * 0.45} ry={r * 0.25} fill="#fff" opacity={0.55} />
      {label && <text x={x} y={y + r * 0.42} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={r * 1.3} fill="#120d08">{label}</text>}
    </g>
  );
}

function Bar({ id, y, h }: { id: string; y: number; h: number }) {
  return (
    <g>
      <rect x={33} y={y + 2} width={564} height={h} rx={14} fill="#000" opacity={0.35} />
      <rect x={34} y={y} width={562} height={h} rx={14} fill={`url(#${id}-bar)`} stroke="#1b140e" strokeWidth={2} />
      <rect x={38} y={y + 3} width={554} height={h - 6} rx={11} fill="none" stroke="#fff" strokeOpacity={0.7} />
    </g>
  );
}

function ArcaneCard({ s, id }: { s: CardState; id: string }) {
  const a = s.arcane;
  const ar = ARCANES[a.arcane];
  const cost = parseCost(a.cost);
  const orbs: { fill: string; label?: string }[] = [];
  if (cost.generic > 0 || cost.gems.length === 0) orbs.push({ fill: "#cfd2d4", label: String(cost.generic) });
  cost.gems.forEach((g: ArcaneId) => orbs.push({ fill: ARCANES[g].gem }));
  const costW = orbs.length * 29 + 10;

  const rules = wrap(a.rules, `400 21px ${SERIF}`, 502, a.flavor ? 5 : 7);
  const flavor = a.flavor ? wrap(a.flavor, `italic 400 19px ${SERIF}`, 502, 3) : [];
  const ruleY = 580;
  const flavorY = ruleY + rules.length * 25 + 16;
  const hasStats = a.attack.trim() !== "" || a.defense.trim() !== "";
  const bd = BORDERS[a.border];

  return (
    <>
      <defs>
        <HoloDefs id={id} />
        <BorderGradient id={`${id}-border`} border={a.border} />
        <linearGradient id={`${id}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ar.light} />
          <stop offset="0.35" stopColor={ar.frame} />
          <stop offset="0.7" stopColor={ar.frame} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor={ar.light} />
          <stop offset="1" stopColor={ar.frame} stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id={`${id}-parch`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf6ea" />
          <stop offset="1" stopColor={ar.light} />
        </linearGradient>
        <pattern id={`${id}-grain`} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.9" fill="#000" opacity="0.13" />
          <circle cx="7" cy="7" r="0.7" fill="#fff" opacity="0.12" />
        </pattern>
        <clipPath id={`${id}-faceclip`}><rect x={22} y={22} width={586} height={836} rx={10} /></clipPath>
        <clipPath id={`${id}-artclip`}><rect x={46} y={90} width={538} height={392} /></clipPath>
      </defs>

      <rect width={CARD_W} height={CARD_H} rx={28} fill={`url(#${id}-border)`} />
      <g clipPath={`url(#${id}-faceclip)`}>
        <rect x={22} y={22} width={586} height={836} fill={ar.frame} />
        <rect x={22} y={22} width={586} height={836} fill={`url(#${id}-frame)`} opacity={0.75} />
        <rect x={22} y={22} width={586} height={836} fill={`url(#${id}-grain)`} />
      </g>

      {/* Titre + coût */}
      <Bar id={id} y={32} h={50} />
      <text x={52} y={66} fontFamily={SERIF} fontWeight={700} fontSize={fitSize(a.name || " ", SERIF, "700", 540 - costW, 30, 16)} fill="#120d08">{a.name}</text>
      {orbs.map((o, i) => <Orb key={i} x={576 - (orbs.length - 1 - i) * 29} y={57} r={12.5} fill={o.fill} label={o.label} />)}

      {/* Illustration */}
      <rect x={41} y={85} width={548} height={402} fill="#1b140e" />
      <g clipPath={`url(#${id}-artclip)`}>
        {s.image ? (
          <Img image={s.image} x={46} y={90} w={538} h={392} />
        ) : (
          <g>
            <rect x={46} y={90} width={538} height={392} fill={ar.frame} />
            <text x={315} y={292} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={25} fill="#fff">Ajoute ou génère une illustration</text>
          </g>
        )}
      </g>
      {holoLayer(id, s.holo, "art", `${id}-artclip`)}

      {/* Ligne de type + symbole de rareté */}
      <Bar id={id} y={490} h={46} />
      <text x={52} y={521} fontFamily={SERIF} fontWeight={700} fontSize={fitSize(a.typeLine || " ", SERIF, "700", 490, 23, 13)} fill="#120d08">{a.typeLine}</text>
      <polygon points="576,501 587,513 576,525 565,513" fill={RARITIES[s.rarity].color} stroke="#1b140e" strokeWidth={1.4} />

      {/* Encadré de texte */}
      <rect x={46} y={546} width={538} height={252} rx={3} fill={`url(#${id}-parch)`} stroke="#1b140e" strokeWidth={1.6} />
      <rect x={46} y={546} width={538} height={252} rx={3} fill={`url(#${id}-grain)`} opacity={0.5} />
      <text fontFamily={SERIF} fontSize={21} fill="#120d08">
        {rules.map((l, i) => <tspan key={i} x={64} y={ruleY + i * 25}>{l}</tspan>)}
      </text>
      {flavor.length > 0 && (
        <text fontFamily={SERIF} fontStyle="italic" fontSize={19} fill="#2e251b">
          {flavor.map((l, i) => <tspan key={i} x={64} y={flavorY + 4 + i * 22}>{l}</tspan>)}
        </text>
      )}

      {/* Encadré ATQ / DEF */}
      {hasStats && (
        <g>
          <rect x={489} y={778} width={108} height={50} rx={12} fill="#000" opacity={0.4} />
          <rect x={488} y={775} width={108} height={50} rx={12} fill={`url(#${id}-bar)`} stroke="#1b140e" strokeWidth={2} />
          <text x={542} y={810} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={30} fill="#120d08">{a.attack}/{a.defense}</text>
        </g>
      )}

      {/* Pied */}
      <text x={48} y={824} fontFamily={SERIF} fontStyle="italic" fontSize={14} fill="#f6f0e4" {...halo} strokeWidth={2.5}>Illus. {s.illustrator}</text>
      <text x={48} y={845} fontFamily={SERIF} fontWeight={700} fontSize={12} fill="#f6f0e4" {...halo} strokeWidth={2.5}>{s.setNumber} · {RARITIES[s.rarity].label}</text>
      <text x={315} y={873} textAnchor="middle" fontFamily={SERIF} fontSize={9.5} fill={bd.ink} opacity={0.7}>Création personnelle</text>

      {holoLayer(id, s.holo, "card", `${id}-faceclip`)}
    </>
  );
}

/* ------------------------------------------------------------------ */

// Se met à jour quand les polices de carte ont fini de charger (la mesure du texte en dépend).
function subscribeFonts(cb: () => void) {
  if (typeof document === "undefined" || !document.fonts) return () => {};
  document.fonts.addEventListener("loadingdone", cb);
  document.fonts.ready.then(cb);
  return () => document.fonts.removeEventListener("loadingdone", cb);
}
const fontsSnapshot = () => (typeof document !== "undefined" && document.fonts ? document.fonts.status + document.fonts.size : "");

export default function CardSvg({ state, ref }: { state: CardState; ref?: Ref<SVGSVGElement> }) {
  const id = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const fontsKey = useSyncExternalStore(subscribeFonts, fontsSnapshot, () => "");
  return (
    <svg key={fontsKey} ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="block h-auto w-full" role="img" aria-label={state.template === "creature" ? state.creature.name : state.arcane.name}>
      {state.template === "creature" ? <CreatureCard s={state} id={id} /> : <ArcaneCard s={state} id={id} />}
    </svg>
  );
}

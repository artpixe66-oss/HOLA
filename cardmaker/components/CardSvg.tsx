"use client";

import { useId, type Ref } from "react";
import { ARCANES, ELEMENTS, RARITIES, parseCost } from "@/lib/elements";
import { BODY, SANS, SERIF, fitSize, wrap } from "@/lib/text";
import type { ArcaneId, CardState, ElementId, HoloMode, Rarity } from "@/lib/types";

export const CARD_W = 630;
export const CARD_H = 880;

/** Hexagone d'élément, propre à nos cadres. */
function ElementIcon({ el, x, y, r }: { el: ElementId; x: number; y: number; r: number }) {
  const d = ELEMENTS[el];
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  const s = (r * 1.15) / 24;
  return (
    <g>
      <polygon points={pts} fill={d.color} stroke="#fff" strokeWidth={Math.max(1.5, r / 9)} />
      <path d={d.glyph} fill="#fff" fillRule="evenodd" transform={`translate(${x - 12 * s} ${y - 12 * s}) scale(${s})`} />
    </g>
  );
}

function Gem({ x, y, r, fill, label }: { x: number; y: number; r: number; fill: string; label?: string }) {
  return (
    <g>
      <polygon points={`${x},${y - r * 1.15} ${x + r},${y} ${x},${y + r * 1.15} ${x - r},${y}`} fill={fill} stroke="#2a2118" strokeWidth={1.6} />
      <polygon points={`${x},${y - r * 0.9} ${x + r * 0.45},${y - r * 0.2} ${x - r * 0.45},${y - r * 0.2}`} fill="#fff" opacity={0.45} />
      {label && (
        <text x={x} y={y + r * 0.42} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={r * 1.15} fill="#1a1a1a">
          {label}
        </text>
      )}
    </g>
  );
}

function RarityMark({ rarity, x, y, light }: { rarity: Rarity; x: number; y: number; light?: boolean }) {
  const c = RARITIES[rarity].color;
  const stroke = light ? "#fff" : "#1a1a1a";
  if (rarity === "commune") return <circle cx={x} cy={y} r={5} fill={light ? "#fff" : c} stroke={stroke} strokeWidth={1} />;
  if (rarity === "peu-commune") return <polygon points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`} fill={c} stroke={stroke} strokeWidth={1} />;
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 3 : 7.5;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={star} fill={c} stroke={stroke} strokeWidth={1} />;
}

function HoloDefs({ id }: { id: string }) {
  return (
    <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ff5fa2" />
      <stop offset="0.2" stopColor="#ffe45f" />
      <stop offset="0.4" stopColor="#5fffb0" />
      <stop offset="0.6" stopColor="#5fc8ff" />
      <stop offset="0.8" stopColor="#b35fff" />
      <stop offset="1" stopColor="#ff5fa2" />
    </linearGradient>
  );
}

function Art({ image, clip, box, placeholder }: { image: string | null; clip: string; box: [number, number, number, number]; placeholder: React.ReactNode }) {
  const [x, y, w, h] = box;
  return (
    <g clipPath={`url(#${clip})`}>
      {image ? <image href={image} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" /> : placeholder}
    </g>
  );
}

function holoLayer(id: string, mode: HoloMode, target: "art" | "card", clip: string) {
  if (mode === "aucun") return null;
  if (mode === "illustration" && target === "card") return null;
  if (mode === "carte" && target === "art") return null;
  return (
    <g clipPath={`url(#${clip})`} style={{ mixBlendMode: "screen" }} opacity={target === "art" ? 0.32 : 0.14}>
      <rect width={CARD_W} height={CARD_H} fill={`url(#${id}-holo)`} />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={-300 + i * 90} y={-100} width={22} height={1200} fill="#fff" opacity={0.18} transform="rotate(25 315 440)" />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Cadre « Créature » : PV, élément, pouvoir, attaques, faiblesse…     */
/* ------------------------------------------------------------------ */

const STAGES = { base: "DE BASE", evo1: "ÉVOLUTION 1", evo2: "ÉVOLUTION 2" } as const;

function CreatureCard({ s, id }: { s: CardState; id: string }) {
  const c = s.creature;
  const el = ELEMENTS[c.element];
  const art = { x: 40, y: 104, w: 550, h: 330, c: 22 };
  const chamfer = (o: number) => {
    const { x, y, w, h } = art;
    const k = art.c + o * 0.4;
    return `${x - o + k},${y - o} ${x + w + o - k},${y - o} ${x + w + o},${y - o + k} ${x + w + o},${y + h + o - k} ${x + w + o - k},${y + h + o} ${x - o + k},${y + h + o} ${x - o},${y + h + o - k} ${x - o},${y - o + k}`;
  };

  const stageLabel = STAGES[c.stage];
  const pillW = 22 + stageLabel.length * 8.6;
  const nameSize = fitSize(c.name || " ", SANS, "900", 380, 42, 22);

  // Corps de la carte : pouvoir + attaques, empilés.
  const body: React.ReactNode[] = [];
  let y = 494;
  const descFont = `400 17px ${BODY}`;
  if (c.power && (c.power.name || c.power.text)) {
    body.push(
      <g key="power">
        <rect x={40} y={y} width={104} height={26} rx={5} fill="#c0261b" />
        <text x={92} y={y + 18.5} textAnchor="middle" fontFamily={BODY} fontWeight={800} fontSize={14} letterSpacing={1.5} fill="#fff">POUVOIR</text>
        <text x={156} y={y + 21} fontFamily={SANS} fontWeight={900} fontSize={fitSize(c.power.name, SANS, "900", 430, 24, 16)} fill="#b51f15">{c.power.name}</text>
      </g>,
    );
    y += 36;
    const lines = wrap(c.power.text, descFont, 550, 3);
    body.push(
      <text key="power-t" fontFamily={BODY} fontSize={17} fill="#1d1d1d">
        {lines.map((l, i) => <tspan key={i} x={40} y={y + 14 + i * 21}>{l}</tspan>)}
      </text>,
    );
    y += lines.length * 21 + 14;
  }
  c.attacks.slice(0, 3).forEach((a, ai) => {
    if (ai > 0 || body.length) {
      body.push(<line key={`sep${ai}`} x1={40} x2={590} y1={y - 6} y2={y - 6} stroke={el.dark} strokeOpacity={0.35} strokeWidth={1.5} />);
    }
    const costs = a.cost.length ? a.cost.slice(0, 5) : [];
    const nameX = 40 + Math.max(costs.length, 1) * 31 + 8;
    body.push(
      <g key={`atk${ai}`}>
        {costs.map((e, i) => <ElementIcon key={i} el={e} x={54 + i * 31} y={y + 15} r={14} />)}
        <text x={nameX} y={y + 24} fontFamily={SANS} fontWeight={900} fontSize={fitSize(a.name, SANS, "900", 590 - nameX - 80, 26, 16)} fill="#1a1a1a">{a.name}</text>
        <text x={590} y={y + 26} textAnchor="end" fontFamily={SANS} fontWeight={900} fontSize={30} fill="#1a1a1a">{a.damage}</text>
      </g>,
    );
    y += 40;
    if (a.text) {
      const lines = wrap(a.text, descFont, 550, 3);
      body.push(
        <text key={`atk${ai}-t`} fontFamily={BODY} fontSize={17} fill="#1d1d1d">
          {lines.map((l, i) => <tspan key={i} x={40} y={y + 12 + i * 21}>{l}</tspan>)}
        </text>,
      );
      y += lines.length * 21 + 10;
    }
    y += 12;
  });

  const flavorLines = wrap(c.flavor, `italic 400 13px ${BODY}`, 530, 2);
  // Trop de texte : on réduit tout le bloc pour qu'il tienne au-dessus de la ligne faiblesse.
  const k = Math.min(1, (730 - 494) / Math.max(1, y - 494));

  return (
    <>
      <defs>
        <HoloDefs id={id} />
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b2f36" />
          <stop offset="0.5" stopColor="#6d7682" />
          <stop offset="1" stopColor="#23262c" />
        </linearGradient>
        <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={el.light} />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity={0.85} />
          <stop offset="1" stopColor={el.light} />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7e3a1" />
          <stop offset="0.5" stopColor="#c99a3a" />
          <stop offset="1" stopColor="#f3d88a" />
        </linearGradient>
        <pattern id={`${id}-tex`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="7" height="14" fill={el.color} opacity="0.07" />
        </pattern>
        <clipPath id={`${id}-artbox`}><polygon points={chamfer(0)} /></clipPath>
        <clipPath id={`${id}-panelclip`}><rect x={14} y={14} width={602} height={830} rx={20} /></clipPath>
      </defs>

      <rect width={CARD_W} height={CARD_H} rx={28} fill={`url(#${id}-rim)`} />
      <rect x={14} y={14} width={602} height={830} rx={20} fill={`url(#${id}-panel)`} />
      <rect x={14} y={14} width={602} height={830} rx={20} fill={`url(#${id}-tex)`} />
      <rect x={14} y={14} width={602} height={10} rx={5} fill={el.color} opacity={0.8} />

      {/* En-tête */}
      <rect x={30} y={30} width={pillW} height={22} rx={11} fill={el.dark} />
      <text x={30 + pillW / 2} y={46} textAnchor="middle" fontFamily={BODY} fontWeight={800} fontSize={12.5} letterSpacing={1.2} fill="#fff">{stageLabel}</text>
      {c.stage !== "base" && c.evolvesFrom && (
        <text x={40 + pillW} y={46} fontFamily={BODY} fontStyle="italic" fontSize={13} fill="#333">Évolue de {c.evolvesFrom}</text>
      )}
      <text x={30} y={90} fontFamily={SANS} fontWeight={900} fontSize={nameSize} fill="#161616">{c.name}</text>
      <text x={548} y={88} textAnchor="end" fontFamily={SANS} fontWeight={900} fill="#c0261b">
        <tspan fontSize={15}>PV </tspan>
        <tspan fontSize={40}>{c.hp}</tspan>
      </text>
      <ElementIcon el={c.element} x={582} y={70} r={25} />

      {/* Illustration */}
      <polygon points={chamfer(7)} fill={`url(#${id}-gold)`} stroke="#7a5a1c" strokeWidth={1.5} />
      <Art
        image={s.image}
        clip={`${id}-artbox`}
        box={[art.x, art.y, art.w, art.h]}
        placeholder={
          <g>
            <rect x={art.x} y={art.y} width={art.w} height={art.h} fill={el.color} opacity={0.85} />
            <path d={el.glyph} fill="#fff" opacity={0.25} transform={`translate(${315 - 120} ${269 - 120}) scale(10)`} />
            <text x={315} y={276} textAnchor="middle" fontFamily={BODY} fontWeight={700} fontSize={22} fill="#fff">Ajoute ou génère une illustration</text>
          </g>
        }
      />
      {holoLayer(id, s.holo, "art", `${id}-artbox`)}

      {/* Bandeau d'infos */}
      <polygon points="64,446 566,446 580,459 566,472 64,472 50,459" fill={`url(#${id}-gold)`} stroke="#7a5a1c" strokeWidth={1} />
      <text x={315} y={464} textAnchor="middle" fontFamily={BODY} fontStyle="italic" fontWeight={600} fontSize={fitSize(c.info || " ", BODY, "italic 600", 490, 14, 10)} fill="#3a2a10">{c.info}</text>

      <g transform={k < 1 ? `translate(40 494) scale(${k}) translate(-40 -494)` : undefined}>{body}</g>

      {/* Faiblesse / résistance / repli */}
      <line x1={40} x2={590} y1={738} y2={738} stroke="#1a1a1a" strokeOpacity={0.5} strokeWidth={1.5} />
      {(
        [
          ["FAIBLESSE", 130],
          ["RÉSISTANCE", 315],
          ["REPLI", 500],
        ] as const
      ).map(([label, x]) => (
        <text key={label} x={x} y={756} textAnchor="middle" fontFamily={BODY} fontWeight={800} fontSize={11.5} letterSpacing={1} fill="#2a2a2a">{label}</text>
      ))}
      {c.weakness && (
        <g>
          <ElementIcon el={c.weakness} x={116} y={776} r={12} />
          <text x={132} y={783} fontFamily={SANS} fontWeight={900} fontSize={17} fill="#1a1a1a">×2</text>
        </g>
      )}
      {c.resistance && (
        <g>
          <ElementIcon el={c.resistance} x={296} y={776} r={12} />
          <text x={312} y={783} fontFamily={SANS} fontWeight={900} fontSize={17} fill="#1a1a1a">−30</text>
        </g>
      )}
      {Array.from({ length: Math.max(0, Math.min(c.retreat, 4)) }, (_, i) => (
        <ElementIcon key={i} el="neutre" x={500 - ((Math.min(c.retreat, 4) - 1) * 26) / 2 + i * 26} y={776} r={11} />
      ))}

      {/* Texte d'ambiance */}
      {c.flavor && (
        <g>
          <rect x={40} y={796} width={550} height={38} rx={8} fill="#fff" opacity={0.5} stroke={el.dark} strokeOpacity={0.3} />
          <text fontFamily={BODY} fontStyle="italic" fontSize={13} fill="#2a2a2a">
            {flavorLines.map((l, i) => <tspan key={i} x={52} y={812 + i * 15}>{l}</tspan>)}
          </text>
        </g>
      )}

      {holoLayer(id, s.holo, "card", `${id}-panelclip`)}

      {/* Pied */}
      <text x={34} y={864} fontFamily={BODY} fontSize={12} fill="#f1f1f1">Illus. {s.illustrator}</text>
      <text x={580} y={864} textAnchor="end" fontFamily={BODY} fontWeight={700} fontSize={11.5} fill="#f1f1f1">{s.setNumber}</text>
      <RarityMark rarity={s.rarity} x={594} y={860} light />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cadre « Arcane » : coût en gemmes, ligne de type, ATQ / DEF          */
/* ------------------------------------------------------------------ */

function banner(y: number, h: number) {
  const m = y + h / 2;
  return `34,${y} 596,${y} 607,${m} 596,${y + h} 34,${y + h} 23,${m}`;
}

function ArcaneCard({ s, id }: { s: CardState; id: string }) {
  const a = s.arcane;
  const ar = ARCANES[a.arcane];
  const cost = parseCost(a.cost);
  const gems: { fill: string; label?: string }[] = [];
  if (cost.generic > 0 || cost.gems.length === 0) gems.push({ fill: ARCANES.artefact.gem, label: String(cost.generic) });
  cost.gems.forEach((g: ArcaneId) => gems.push({ fill: ARCANES[g].gem }));
  const costW = gems.length * 27 + 8;

  const rules = wrap(a.rules, `400 20px ${SERIF}`, 506, a.flavor ? 5 : 7);
  const flavor = a.flavor ? wrap(a.flavor, `italic 400 17px ${SERIF}`, 506, 3) : [];
  const ruleY = 590;
  const flavorY = ruleY + rules.length * 25 + 18;
  const hasStats = a.attack.trim() !== "" || a.defense.trim() !== "";

  return (
    <>
      <defs>
        <HoloDefs id={id} />
        <linearGradient id={`${id}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ar.frame} />
          <stop offset="0.5" stopColor={ar.light} stopOpacity={0.9} />
          <stop offset="1" stopColor={ar.frame} />
        </linearGradient>
        <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={ar.light} />
        </linearGradient>
        <linearGradient id={`${id}-bronze`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8b46a" />
          <stop offset="0.5" stopColor="#7a5a26" />
          <stop offset="1" stopColor="#d8b46a" />
        </linearGradient>
        <pattern id={`${id}-tex`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="1.4" fill="#000" opacity="0.12" />
        </pattern>
        <clipPath id={`${id}-artbox`}><polygon points="52,96 578,96 590,108 590,484 578,496 52,496 40,484 40,108" /></clipPath>
        <clipPath id={`${id}-panelclip`}><rect x={16} y={16} width={598} height={826} rx={16} /></clipPath>
      </defs>

      <rect width={CARD_W} height={CARD_H} rx={26} fill="#15110d" />
      <rect x={16} y={16} width={598} height={826} rx={16} fill={`url(#${id}-frame)`} />
      <rect x={16} y={16} width={598} height={826} rx={16} fill={`url(#${id}-tex)`} />

      {/* Titre + coût */}
      <polygon points={banner(28, 56)} fill={`url(#${id}-bar)`} stroke="#2a2118" strokeWidth={2} />
      <text x={44} y={66} fontFamily={SERIF} fontWeight={700} fontSize={fitSize(a.name || " ", SERIF, "700", 548 - costW, 30, 16)} fill="#1a1410">{a.name}</text>
      {gems.map((g, i) => (
        <Gem key={i} x={582 - (gems.length - 1 - i) * 27} y={56} r={12} fill={g.fill} label={g.label} />
      ))}

      {/* Illustration */}
      <polygon points="48,88 582,88 598,104 598,488 582,504 48,504 32,488 32,104" fill={`url(#${id}-bronze)`} stroke="#2a2118" strokeWidth={1.5} />
      <Art
        image={s.image}
        clip={`${id}-artbox`}
        box={[40, 96, 550, 400]}
        placeholder={
          <g>
            <rect x={40} y={96} width={550} height={400} fill={ar.frame} />
            <text x={315} y={302} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={24} fill="#fff">Ajoute ou génère une illustration</text>
          </g>
        }
      />
      {holoLayer(id, s.holo, "art", `${id}-artbox`)}

      {/* Ligne de type + rareté */}
      <polygon points={banner(512, 44)} fill={`url(#${id}-bar)`} stroke="#2a2118" strokeWidth={2} />
      <text x={44} y={541} fontFamily={SERIF} fontWeight={700} fontSize={fitSize(a.typeLine || " ", SERIF, "700", 500, 22, 13)} fill="#1a1410">{a.typeLine}</text>
      <Gem x={584} y={534} r={10} fill={RARITIES[s.rarity].color} />

      {/* Encadré de texte */}
      <rect x={44} y={564} width={542} height={226} rx={6} fill={ar.light} stroke="#2a2118" strokeWidth={1.5} />
      <rect x={44} y={564} width={542} height={226} rx={6} fill="#fff" opacity={0.35} />
      <text fontFamily={SERIF} fontSize={20} fill="#16110c">
        {rules.map((l, i) => <tspan key={i} x={62} y={ruleY + i * 25}>{l}</tspan>)}
      </text>
      {flavor.length > 0 && (
        <g>
          <line x1={180} x2={450} y1={flavorY - 14} y2={flavorY - 14} stroke="#2a2118" strokeOpacity={0.35} />
          <text fontFamily={SERIF} fontStyle="italic" fontSize={17} fill="#3a3026">
            {flavor.map((l, i) => <tspan key={i} x={62} y={flavorY + 6 + i * 21}>{l}</tspan>)}
          </text>
        </g>
      )}

      {/* Bouclier ATQ / DEF */}
      {hasStats && (
        <g>
          <polygon points="486,772 600,772 600,810 543,836 486,810" fill={`url(#${id}-bar)`} stroke="#2a2118" strokeWidth={2} />
          <text x={543} y={812} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#1a1410">{a.attack}/{a.defense}</text>
        </g>
      )}

      {holoLayer(id, s.holo, "card", `${id}-panelclip`)}

      {/* Pied */}
      <text x={34} y={864} fontFamily={SERIF} fontStyle="italic" fontSize={12} fill="#f4efe6">Illus. {s.illustrator}</text>
      <text x={596} y={864} textAnchor="end" fontFamily={SERIF} fontWeight={700} fontSize={12} fill="#f4efe6">{s.setNumber} · {RARITIES[s.rarity].label}</text>
    </>
  );
}

export default function CardSvg({ state, ref }: { state: CardState; ref?: Ref<SVGSVGElement> }) {
  const id = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="block h-auto w-full" role="img" aria-label={state.template === "creature" ? state.creature.name : state.arcane.name}>
      {state.template === "creature" ? <CreatureCard s={state} id={id} /> : <ArcaneCard s={state} id={id} />}
    </svg>
  );
}

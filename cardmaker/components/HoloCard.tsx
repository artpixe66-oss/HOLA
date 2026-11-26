"use client";

import { useRef, useSyncExternalStore, type Ref } from "react";
import CardSvg from "./CardSvg";
import type { CardState } from "@/lib/types";

const noop = () => () => {};

/** Carte qui s'incline et brille au survol. Rendue côté client uniquement (mesure du texte). */
export default function HoloCard({ state, svgRef, className = "" }: { state: CardState; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const box = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 14}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 18}deg`);
    el.style.setProperty("--px", `${px * 100}%`);
    el.style.setProperty("--py", `${py * 100}%`);
    el.style.setProperty("--shine", "1");
  };
  const leave = () => {
    const el = box.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--shine", "0");
  };

  return (
    <div className={`holo-wrap ${className}`} style={{ aspectRatio: "630 / 880" }}>
      <div ref={box} className="holo-card" onPointerMove={move} onPointerLeave={leave}>
        {isClient ? <CardSvg state={state} ref={svgRef} /> : <div className="h-full w-full rounded-[4.4%] bg-white/5" />}
        {state.holo !== "aucun" && <div className="holo-shine" />}
        <div className="holo-glare" />
      </div>
    </div>
  );
}

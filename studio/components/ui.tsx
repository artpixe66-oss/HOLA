"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";
import type { Influencer } from "@/lib/types";
import { STATUSES, type Status } from "@/lib/types";

type Tone = "lime" | "white" | "dark" | "ghost";

const TONES: Record<Tone, string> = {
  lime: "bg-lime text-black",
  white: "bg-white text-black",
  dark: "bg-surface text-white",
  ghost: "bg-transparent text-white border border-surface-2",
};

export function Card({ tone = "dark", className = "", children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <div className={`rounded-[28px] p-5 md:p-6 ${TONES[tone]} ${className}`}>{children}</div>;
}

export function StatCard({ tone, title, value, caption, href }: { tone: Tone; title: string; value: ReactNode; caption: string; href?: string }) {
  const body = (
    <Card tone={tone} className="flex h-full min-h-[190px] flex-col justify-between transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[12ch] text-lg font-semibold leading-snug md:text-xl">{title}</h3>
        <Icon name="arrow" size={22} className="shrink-0 opacity-80" />
      </div>
      <div>
        <div className="text-5xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 text-sm font-medium opacity-80">{caption}</div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Button({
  children,
  onClick,
  tone = "white",
  type = "button",
  disabled,
  icon,
  className = "",
  small,
}: {
  children?: ReactNode;
  onClick?: () => void;
  tone?: Tone | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: string;
  className?: string;
  small?: boolean;
}) {
  const t = tone === "danger" ? "bg-transparent text-danger border border-danger/40" : TONES[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} ${t} ${className}`}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} />}
      {children}
    </button>
  );
}

export function RoundButton({ icon, onClick, active, label, href }: { icon: string; onClick?: () => void; active?: boolean; label: string; href?: string }) {
  const cls = `grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${active ? "bg-lime text-black" : "bg-white text-black hover:bg-lime-soft"}`;
  if (href)
    return (
      <Link href={href} className={cls} title={label} aria-label={label}>
        <Icon name={icon} />
      </Link>
    );
  return (
    <button onClick={onClick} className={cls} title={label} aria-label={label}>
      <Icon name={icon} />
    </button>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const s = STATUSES.find((x) => x.id === status) ?? STATUSES[0];
  const dark = s.id === "script" || s.id === "prompt";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${dark ? "text-white" : "text-black"}`} style={{ background: s.color }}>
      {s.label}
    </span>
  );
}

export function Avatar({ influencer, size = 44 }: { influencer?: Influencer | null; size?: number }) {
  const initials = (influencer?.name ?? "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  if (influencer?.avatarUrl)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={influencer.avatarUrl} alt={influencer.name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-black" style={{ width: size, height: size, background: influencer?.color ?? "#c8f31d", fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed border-surface-2 p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-lg text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Loading() {
  return <div className="p-10 text-center text-sm text-muted">Chargement…</div>;
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-surface p-1">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${value === o.id ? "bg-white text-black" : "text-muted hover:text-white"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

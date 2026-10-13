import type { ReactNode } from "react";
import { formatBRL, formatSignedBRL } from "@/lib/money";

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";
export const btnPrimary = `${btn} bg-gold text-black hover:brightness-110`;
export const btnSecondary = `${btn} border border-line bg-surface-2 hover:border-muted`;
export const btnDanger = `${btn} border border-loss/40 text-loss hover:bg-loss/10`;
export const btnIcon =
  "inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface-2 text-base font-semibold hover:border-muted disabled:opacity-40 disabled:pointer-events-none";
export const input =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-gold";
export const label = "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="tabular mt-1 truncate text-lg font-semibold sm:text-xl">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Money({ cents, signed = false }: { cents: number; signed?: boolean }) {
  if (!signed) return <span className="tabular">{formatBRL(cents)}</span>;
  const color = cents > 0 ? "text-win" : cents < 0 ? "text-loss" : "text-muted";
  return <span className={`tabular ${color}`}>{formatSignedBRL(cents)}</span>;
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gold" | "win" }) {
  const tones = {
    muted: "border-line text-muted",
    gold: "border-gold/40 text-gold",
    win: "border-win/40 text-win",
  };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">{children}</p>;
}

export function Position({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted">—</span>;
  const medal = value === 1 ? "🥇" : value === 2 ? "🥈" : value === 3 ? "🥉" : null;
  return (
    <span className="tabular whitespace-nowrap">
      {medal ? `${medal} ` : ""}
      {value}º
    </span>
  );
}

export const table = "w-full text-sm";
export const th = "px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted";
export const thRight = `${th} text-right`;
export const td = "border-t border-line px-2 py-2.5";
export const tdRight = `${td} text-right tabular`;

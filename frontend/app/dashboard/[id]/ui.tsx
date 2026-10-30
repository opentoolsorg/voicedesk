"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  PhoneForwarded,
  PhoneMissed,
  ShieldAlert,
  Voicemail,
  XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";

export const outcomes = [
  "booked",
  "message",
  "lead",
  "faq",
  "transferred",
  "spam",
  "missed",
  "voicemail",
  "failed",
];

export const label = (value: string) => {
  if (value.toLowerCase() === "faq") return "FAQ";
  return value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
};

export const apiDate = (value: string) =>
  new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);

export const dateTime = (value: string | null) =>
  value && !Number.isNaN(apiDate(value).getTime())
    ? apiDate(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Time not set";

export const duration = (seconds: number | null) =>
  seconds == null
    ? "—"
    : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

// The static export prerenders one "_" shell and usePathname() reports that path, so read the real
// URL instead. Only call this below Shell's mount gate (it needs window).
export function useBusinessId() {
  usePathname(); // re-render on client-side navigation
  return typeof window === "undefined" ? "_" : window.location.pathname.split("/")[2];
}

const outcomeStyles: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ElementType }
> = {
  booked: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
    icon: CalendarCheck,
  },
  message: {
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-900 dark:text-zinc-200",
    border: "border-zinc-300 dark:border-zinc-700",
    icon: MessageSquare,
  },
  lead: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-800 dark:text-teal-300",
    border: "border-teal-200/80 dark:border-teal-800/60",
    icon: CheckCircle2,
  },
  faq: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-800 dark:text-sky-300",
    border: "border-sky-200/80 dark:border-sky-800/60",
    icon: HelpCircle,
  },
  transferred: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/60",
    icon: PhoneForwarded,
  },
  spam: {
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-200 dark:border-zinc-700",
    icon: ShieldAlert,
  },
  missed: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200/80 dark:border-orange-800/60",
    icon: PhoneMissed,
  },
  voicemail: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-800 dark:text-violet-300",
    border: "border-violet-200/80 dark:border-violet-800/60",
    icon: Voicemail,
  },
  failed: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/60",
    icon: XCircle,
  },
};

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const conf = outcome ? outcomeStyles[outcome] : null;
  const Icon = conf?.icon || PhoneCall;
  const bg = conf?.bg || "bg-zinc-100 dark:bg-zinc-800";
  const text = conf?.text || "text-zinc-700 dark:text-zinc-300";
  const border = conf?.border || "border-zinc-200 dark:border-zinc-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${bg} ${text} ${border}`}
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      {outcome ? label(outcome) : "In progress"}
    </span>
  );
}

export function Disclosure({
  title,
  children,
  className = "",
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className={`card min-w-0 ${className}`}>
      <h2>
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-3 text-left font-semibold text-theme-fg transition-colors hover:text-theme-fg"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          <span className="text-base font-semibold tracking-tight">{title}</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-theme-border/60 bg-theme-surface-muted/50 text-theme-label transition-transform group-hover:bg-theme-surface-muted">
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`shrink-0 transition-transform duration-200 ${
                open ? "" : "-rotate-90"
              }`}
            />
          </span>
        </button>
      </h2>
      <div id={id} hidden={!open} className="mt-5">
        {children}
      </div>
    </section>
  );
}

export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, version]);

  return { data, setData, loading, error, retry };
}

export function SkeletonTile() {
  return (
    <div className="h-24 rounded-lg bg-theme-surface-muted animate-pulse" />
  );
}

export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-theme-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-theme-surface-muted" />
            <div className="h-3 w-64 rounded bg-theme-surface-muted/60" />
          </div>
          <div className="h-6 w-20 rounded bg-theme-surface-muted" />
        </div>
      ))}
    </div>
  );
}

export function LoadState({
  loading,
  error,
  retry,
  hasData = false,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  hasData?: boolean;
}) {
  if (loading) {
    return (
      <div
        role="status"
        className={
          hasData
            ? "flex items-center gap-2 text-xs text-theme-label py-1"
            : "card py-10 text-center"
        }
      >
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-theme-border border-t-emerald-800" />
        <span className="text-xs text-theme-label font-medium">
          {hasData ? "Updating data…" : "Loading workspace activity…"}
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card border-rose-200/80 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-3 p-5">
        <div className="flex items-start gap-3">
          <CircleAlert
            size={18}
            className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              Activity loading error
            </h3>
            <p role="alert" className="mt-1 break-words text-xs text-rose-700 dark:text-rose-300">
              Could not load activity. {error}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary !text-xs !py-1.5"
          onClick={retry}
        >
          Try again
        </button>
      </div>
    );
  }
  return null;
}

export function EmptyState({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="py-12 px-4 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-theme-border bg-theme-surface-muted text-emerald-800 dark:text-emerald-400">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      <h2 className="text-base font-semibold tracking-tight text-theme-fg">{title}</h2>
      <div className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-theme-label">
        {children}
      </div>
    </div>
  );
}

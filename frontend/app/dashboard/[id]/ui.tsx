"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { ChevronDown, CircleAlert, Voicemail } from "lucide-react";
import { usePathname } from "next/navigation";

export const outcomes = ["booked", "message", "lead", "faq", "transferred", "spam", "missed", "voicemail", "failed"];
export const label = (value: string) => value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
export const apiDate = (value: string) => new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
export const dateTime = (value: string | null) => value && !Number.isNaN(apiDate(value).getTime()) ? apiDate(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Time not set";
export const duration = (seconds: number | null) => seconds == null ? "—" : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export function useBusinessId() { return usePathname().split("/")[2]; }

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const failed = outcome === "failed";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${failed ? "border-theme-fg bg-theme-bg" : "border-theme-border-muted bg-theme-surface-muted"}`}>{failed && <CircleAlert size={12} aria-hidden="true" />}{outcome === "voicemail" && <Voicemail size={12} aria-hidden="true" />}{outcome ? label(outcome) : "In progress"}</span>;
}

export function Disclosure({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return <section className={`card min-w-0 ${className}`}><h2><button className="flex w-full items-center justify-between gap-3 text-left font-semibold" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{title}<ChevronDown size={17} aria-hidden="true" className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} /></button></h2><div id={id} hidden={!open} className="mt-5">{children}</div></section>;
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
    load().then((result) => { if (active) setData(result); }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, version]);
  return { data, setData, loading, error, retry };
}

export function LoadState({ loading, error, retry, hasData = false }: { loading: boolean; error: string; retry: () => void; hasData?: boolean }) {
  if (loading) return <div role="status" className={hasData ? "text-xs text-theme-label" : "card py-14 text-center text-sm text-theme-label"}>{hasData ? "Updating…" : "Loading workspace activity…"}</div>;
  if (error) return <div className="card space-y-4"><p role="alert" className="break-words text-sm">Could not load activity. {error}</p><button className="btn-secondary" onClick={retry}>Try again</button></div>;
  return null;
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="py-14 text-center"><h2 className="text-lg font-semibold tracking-tight">{title}</h2><div className="mx-auto mt-2 max-w-md text-sm leading-6 text-theme-label">{children}</div></div>;
}

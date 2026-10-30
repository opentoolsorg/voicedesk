"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  GitBranch,
  Menu,
  MessageSquare,
  Mic,
  Phone,
  PhoneCall,
  Settings2,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBusinessId, useResource } from "./ui";

const links = [
  ["Overview", "", BarChart3],
  ["Calls", "/calls", PhoneCall],
  ["Messages", "/messages", MessageSquare],
  ["Appointments", "/appointments", CalendarDays],
  ["Agent", "/agent", Settings2],
  ["Phone", "/phone", Phone],
  ["Billing", "/billing", Wallet],
  ["Call flows", "/flow", GitBranch],
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  // Render the workspace only in the browser so no page ever sees the prerendered "_" id.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-theme-bg" aria-busy="true" />;
  return <Workspace>{children}</Workspace>;
}

function Workspace({ children }: { children: React.ReactNode }) {
  const id = useBusinessId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: business, loading, error, retry } = useResource(
    useCallback(() => api.businesses.get(id), [id])
  );
  const base = `/dashboard/${id}`;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-fg selection:bg-emerald-500/30">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-theme-surface focus:p-3 focus:shadow-lg focus:ring-2 focus:ring-theme-ring"
      >
        Skip to content
      </a>

      {/* Desktop Sidebar - Sticky / full viewport height */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 h-dvh flex-col border-r border-theme-border bg-theme-surface lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-theme-border/60 px-5 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-theme-fg transition-opacity hover:opacity-90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white shadow-sm dark:bg-emerald-800">
              <Mic size={16} aria-hidden="true" />
            </span>
            <span>VoiceDesk</span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              v1.0
            </span>
          </Link>
        </div>

        {/* Business Context Pill */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between rounded-lg border border-theme-border bg-theme-surface-muted/50 px-3 py-2 text-xs">
            <div className="min-w-0 pr-2">
              <p className="truncate font-medium text-theme-fg">
                {business?.name ?? (loading ? "Loading…" : "Workspace")}
              </p>
              <p className="truncate text-[11px] text-theme-label capitalize">
                {business?.vertical?.replaceAll("_", " ") ?? "AI Receptionist"}
              </p>
            </div>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                business?.active !== false
                  ? "bg-emerald-500"
                  : "bg-amber-400"
              }`}
              title={business?.active !== false ? "Active" : "Paused"}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-theme-label">
            Workspace
          </p>
          <nav aria-label="Workspace navigation" className="space-y-1">
            {links.map(([name, suffix, Icon]) => {
              const active =
                pathname.replace(/\/$/, "") === `${base}${suffix}`;
              return (
                <Link
                  key={name}
                  href={`${base}${suffix}`}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/50"
                      : "text-theme-label hover:bg-theme-surface-muted/70 hover:text-theme-fg"
                  }`}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-emerald-800 dark:text-emerald-400"
                        : "text-theme-label group-hover:text-theme-fg"
                    }`}
                  />
                  <span>{name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Receptionist Status Card */}
        <div className="p-3 border-t border-theme-border/60 shrink-0">
          <div className="rounded-xl border border-theme-border bg-theme-surface-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-theme-fg">
              <Sparkles size={14} className="text-emerald-800 dark:text-emerald-400 shrink-0" />
              <span>Smart receptionist</span>
            </div>
            <p className="mt-1 text-xs text-theme-label leading-relaxed">
              Answering 24/7 with custom knowledge & voice tools.
            </p>
            <Link
              href={`${base}/agent`}
              className="mt-2.5 inline-flex items-center text-xs font-medium text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
            >
              Configure persona →
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-theme-border bg-theme-surface/95 backdrop-blur-md px-4 py-3.5 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="btn-secondary !p-2 lg:hidden"
                aria-label={open ? "Close navigation" : "Open navigation"}
                aria-expanded={open}
                aria-controls="mobile-workspace-nav"
                onClick={() => setOpen(!open)}
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-theme-fg">
                    {business?.name ??
                      (loading ? "Loading workspace…" : "Workspace unavailable")}
                  </p>
                  {business?.phone_number && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-theme-border bg-theme-surface-muted px-2 py-0.5 font-mono text-[11px] text-theme-label">
                      <Phone size={11} aria-hidden="true" />
                      {business.phone_number}
                    </span>
                  )}
                </div>
                {error ? (
                  <button
                    type="button"
                    className="text-xs text-rose-600 dark:text-rose-400 underline hover:no-underline"
                    onClick={retry}
                  >
                    Retry connection
                  </button>
                ) : (
                  <Link
                    href={`${base}/phone`}
                    className="text-xs text-theme-label hover:text-theme-fg transition-colors sm:hidden"
                  >
                    {business?.phone_number ?? "No number yet"}
                  </Link>
                )}
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-medium text-theme-label shadow-sm hover:bg-theme-surface-muted hover:text-theme-fg transition-colors"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span className="hidden sm:inline">All businesses</span>
              <span className="sm:hidden">Workspaces</span>
            </Link>
          </div>

          {/* Mobile Navigation Drawer */}
          {open && (
            <nav
              id="mobile-workspace-nav"
              aria-label="Mobile workspace navigation"
              className="mt-3 grid grid-cols-2 gap-1.5 border-t border-theme-border pt-3 lg:hidden"
            >
              {links.map(([name, suffix, Icon]) => {
                const active =
                  pathname.replace(/\/$/, "") === `${base}${suffix}`;
                return (
                  <Link
                    key={name}
                    href={`${base}${suffix}`}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-emerald-50 text-emerald-950 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "text-theme-label hover:bg-theme-surface-muted"
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span>{name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </header>

        {/* Page Content */}
        <main
          id="workspace-content"
          className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

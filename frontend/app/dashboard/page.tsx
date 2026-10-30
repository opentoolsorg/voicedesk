"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Headphones,
  Mic,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { api, type Business, type Call, type Lead } from "@/lib/api";
import { apiDate } from "./[id]/ui";
import ThemeToggle from "./components/ThemeToggle";

const DEMO_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Maya Chen",
    company: "Northline Dental",
    phone: "+1 (415) 555-0184",
    location: "San Francisco, CA",
    score: 94,
    status: "queued",
    summary: "Interested in 24/7 call coverage and automated appointment booking.",
  },
  {
    id: "lead-2",
    name: "Jordan Patel",
    company: "Harbor Wellness",
    phone: "+1 (212) 555-0136",
    location: "New York, NY",
    score: 89,
    status: "called",
    summary: "Asked about weekend emergency triage and SMS booking confirmations.",
  },
  {
    id: "lead-3",
    name: "Ava Brooks",
    company: "Summit Repair Co.",
    phone: "+1 (305) 555-0119",
    location: "Miami, FL",
    score: 81,
    status: "new",
  },
];

function formatDate(value: string) {
  const date = apiDate(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function LoadingRows() {
  return (
    <div role="status" aria-label="Loading workspace data" className="space-y-3 p-5">
      <span className="sr-only">Loading workspace data</span>
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-16 rounded-lg bg-theme-surface-muted animate-pulse" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(true);
  const [businessError, setBusinessError] = useState("");
  const [callError, setCallError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [demoQuery, setDemoQuery] = useState("");
  const [leads, setLeads] = useState(DEMO_LEADS);
  const [demoNotice, setDemoNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setBusinessLoading(true);
    setCallLoading(true);
    setBusinessError("");
    setCallError("");

    api.businesses
      .list()
      .then((data) => {
        if (!cancelled) setBusinesses(data);
      })
      .catch(() => {
        if (!cancelled) {
          setBusinesses([]);
          setBusinessError("Could not load businesses. Check the API connection and try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setBusinessLoading(false);
      });

    api.calls
      .list(undefined, { limit: 50 })
      .then((data) => {
        if (!cancelled) setCalls(data);
      })
      .catch(() => {
        if (!cancelled) {
          setCalls([]);
          setCallError("Could not load calls. Check the API connection and try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setCallLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filteredBusinesses = useMemo(() => {
    const term = query.trim().toLowerCase();
    return businesses
      .filter((business) =>
        [business.name, business.vertical ?? "", business.phone_number ?? ""].some((value) =>
          value.toLowerCase().includes(term)
        )
      )
      .sort((a, b) => {
        if (sort === "phone") {
          const phoneOrder = Number(Boolean(b.phone_number)) - Number(Boolean(a.phone_number));
          if (phoneOrder) return phoneOrder;
        }
        if (sort === "recent") {
          const recentOrder = (apiDate(b.created_at).getTime() || 0) - (apiDate(a.created_at).getTime() || 0);
          if (recentOrder) return recentOrder;
        }
        return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
      });
  }, [businesses, query, sort]);

  const filteredLeads = useMemo(() => {
    const term = demoQuery.trim().toLowerCase();
    return leads.filter((lead) =>
      [lead.name, lead.company, lead.location].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [leads, demoQuery]);

  const recentCalls = useMemo(
    () =>
      [...calls]
        .sort((a, b) => (Date.parse(b.started_at) || 0) - (Date.parse(a.started_at) || 0))
        .slice(0, 5),
    [calls]
  );

  function queueDemoLead(id: string) {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status: "queued" } : lead))
    );
    setDemoNotice("Added to the local demo queue. No live phone call placed.");
  }

  return (
    <main className="min-h-screen bg-theme-bg text-theme-fg selection:bg-emerald-700/20">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-theme-border bg-theme-surface/95 backdrop-blur-md">
        <nav
          aria-label="Workspace navigation"
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-8"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-theme-fg"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-btn-primary text-theme-btn-primary-fg shadow-sm">
              <Mic size={16} aria-hidden="true" />
            </span>
            <span>VoiceDesk</span>
            <span className="hidden text-xs text-theme-label sm:inline">
              / Workspaces
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-theme-label">
            <ThemeToggle />
            <span className="hidden rounded-md border border-theme-border bg-theme-surface-muted px-2 py-1 font-mono text-[11px] sm:inline-flex">
              Self-hosted
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-theme-fg hover:bg-theme-surface-muted transition-colors"
            >
              Public site
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10 space-y-8">
        {/* Title and CTA */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Workspace management
            </span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-theme-fg sm:text-4xl">
              Your voice operations
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-theme-label leading-relaxed">
              Manage configured AI receptionist business profiles and review incoming call records.
            </p>
          </div>

          <Link
            href="/dashboard/new"
            className="btn-primary self-start sm:self-auto gap-2"
          >
            <Plus size={16} aria-hidden="true" />
            Create business workspace
          </Link>
        </div>

        {/* Live Workspace Metrics Banner */}
        <section
          aria-label="Live workspace metrics"
          className="grid grid-cols-1 divide-y divide-theme-border overflow-hidden rounded-xl border border-theme-border bg-theme-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 shadow-sm"
        >
          {[
            {
              label: "Active workspaces",
              value: businesses.length,
              error: businessError,
              loading: businessLoading,
              note: "Active businesses returned by API",
            },
            {
              label: "Live receptionists",
              value: businesses.filter((b) => b.has_config && b.phone_number).length,
              error: businessError,
              loading: businessLoading,
              note: "Configuration and phone number present",
            },
            {
              label: "Call logs · latest 50",
              value: calls.length,
              error: callError,
              loading: callLoading,
              note: "Up to 50 recent records, not lifetime total",
            },
          ].map((metric) => (
            <div key={metric.label} className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-theme-label">
                {metric.label}
              </p>
              <p
                className="mt-2 text-3xl font-bold tracking-tight text-theme-fg tabular-nums"
                aria-label={`${metric.label}: ${
                  metric.loading ? "loading" : metric.error ? "unavailable" : metric.value
                }`}
              >
                {metric.loading || metric.error ? "—" : metric.value}
              </p>
              <p className="mt-1 text-[11px] text-theme-label">
                {metric.loading
                  ? "Loading API data…"
                  : metric.error
                  ? "Data unavailable"
                  : metric.note}
              </p>
            </div>
          ))}
        </section>

        {/* Error banner if connection issues */}
        {(businessError || callError) && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <p>Some workspace data is currently unavailable. Shown records may be partial.</p>
            <button
              disabled={businessLoading && callLoading}
              onClick={() => setRefresh((v) => v + 1)}
              className="btn-secondary !text-xs !py-1 gap-1.5"
            >
              <RefreshCw size={13} aria-hidden="true" />
              {businessLoading && callLoading ? "Retrying…" : "Retry connection"}
            </button>
          </div>
        )}

        {/* 2-column layout: Businesses & Recent calls */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* Businesses List */}
          <section
            aria-labelledby="business-title"
            className="card !p-0 overflow-hidden shadow-sm"
          >
            <div className="border-b border-theme-border/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="business-title"
                  className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2"
                >
                  <Building2 size={16} className="text-emerald-800 dark:text-emerald-400" />
                  Businesses
                </h2>
                <span className="font-mono text-xs text-theme-label">
                  {businesses.length} total
                </span>
              </div>

              <div className="relative mt-3">
                <Search
                  size={15}
                  aria-hidden="true"
                  className="absolute left-3.5 top-3 text-theme-label"
                />
                <input
                  id="business-search"
                  aria-label="Search business workspaces"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by name, industry, or phone number…"
                  className="input !pl-9 !text-xs"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-theme-label">
                <span>{filteredBusinesses.length} of {businesses.length} active</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="business-sort">Sort by</label>
                  <select
                    id="business-sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-md border border-theme-border bg-theme-surface px-2 py-1.5 text-xs text-theme-fg"
                  >
                    <option value="recent">Recently created</option>
                    <option value="name">Name A–Z</option>
                    <option value="phone">Has phone number</option>
                  </select>
                </div>
              </div>
            </div>

            {businessLoading ? (
              <LoadingRows />
            ) : businessError ? (
              <p className="p-6 text-xs text-theme-label">{businessError}</p>
            ) : businesses.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 size={32} className="mx-auto text-emerald-700 mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-theme-fg">No businesses added yet</h3>
                <p className="mt-1 text-xs text-theme-label">
                  Create your first business workspace to configure an agent persona.
                </p>
                <Link href="/dashboard/new" className="btn-primary !text-xs mt-4 gap-1.5">
                  <Plus size={14} />
                  Add business
                </Link>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="p-8 text-center text-xs text-theme-label">
                <p>No businesses match “{query}”.</p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-2 text-emerald-800 underline font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="divide-y divide-theme-border">
                {filteredBusinesses.map((b) => (
                  <div
                    key={b.id}
                    className="group relative flex items-center justify-between gap-4 p-4 transition-colors hover:bg-theme-surface-muted/40"
                  >
                    <Link
                      href={`/dashboard/${b.id}`}
                      className="absolute inset-0 z-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700"
                    >
                      <span className="sr-only">Open {b.name} workspace</span>
                    </Link>
                    <div className="pointer-events-none relative z-10 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-theme-fg group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                          {b.name}
                        </h3>
                        {b.has_config && b.phone_number && (
                          <span className="shrink-0 rounded-full border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-[10px] font-medium text-theme-fg">
                            Configured
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-theme-label capitalize">
                        {b.vertical?.replaceAll("_", " ") ?? "General"} ·{" "}
                        {b.phone_number ? (
                          <span className="font-mono text-theme-fg">{b.phone_number}</span>
                        ) : (
                          <span className="italic">No phone line</span>
                        )}
                      </p>
                      {(!b.phone_number || !b.has_config) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {!b.phone_number && (
                            <span className="rounded-full border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-[10px] font-medium text-theme-label">
                              Number missing
                            </span>
                          )}
                          {!b.has_config && (
                            <span className="rounded-full border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-[10px] font-medium text-theme-label">
                              {b.has_config === false ? "Config incomplete" : "Config status unknown"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 flex shrink-0 items-center gap-3">
                      <Link
                        href={`/dashboard/${b.id}/agent`}
                        aria-label={`Settings for ${b.name}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-theme-border px-2.5 py-1.5 text-xs font-medium text-theme-fg transition-colors hover:bg-theme-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                      >
                        <Settings2 size={14} aria-hidden="true" />
                        <span>Settings</span>
                      </Link>
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="text-theme-label transition-colors group-hover:text-emerald-800 dark:group-hover:text-emerald-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Calls */}
          <section
            aria-labelledby="calls-title"
            className="card !p-0 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-theme-border/60 p-5">
              <div>
                <h2
                  id="calls-title"
                  className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2"
                >
                  <PhoneCall size={16} className="text-emerald-800 dark:text-emerald-400" />
                  Recent calls
                </h2>
                <p className="mt-0.5 text-[11px] text-theme-label">Latest logged conversations</p>
              </div>
              <span className="font-mono text-xs text-theme-label">{recentCalls.length} logs</span>
            </div>

            {callLoading ? (
              <LoadingRows />
            ) : callError ? (
              <p className="p-6 text-xs text-theme-label">{callError}</p>
            ) : recentCalls.length === 0 ? (
              <div className="p-8 text-center text-xs text-theme-label">
                No calls recorded yet across any workspace.
              </div>
            ) : (
              <ul className="divide-y divide-theme-border">
                {recentCalls.map((call) => (
                  <li key={call.id} className="p-4 space-y-1">
                    <Link
                      href={`/dashboard/${call.business_id}/calls`}
                      className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-theme-fg underline underline-offset-2 hover:text-theme-label"
                    >
                      <span className="truncate">
                        {businesses.find((business) => business.id === call.business_id)?.name ?? "Business unavailable"}
                      </span>
                      <span className="shrink-0">· View calls</span>
                      <ArrowUpRight size={12} aria-hidden="true" className="shrink-0" />
                    </Link>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-theme-fg">
                        {call.caller_name || call.caller_number || "Unknown caller"}
                      </span>
                      <span className="rounded border border-theme-border bg-theme-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-theme-label">
                        {call.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-label font-mono">
                      {formatDate(call.started_at)}
                      {call.duration_sec != null ? ` · ${call.duration_sec}s` : ""}
                    </p>
                    {call.outcome && (
                      <p className="line-clamp-1 text-xs text-theme-label">{call.outcome}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Demo Leads Exploration */}
        <section
          aria-labelledby="demo-title"
          className="border-t border-theme-border/60 pt-8 space-y-4"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-title" className="text-base font-semibold tracking-tight text-theme-fg">
                  Example caller queue
                </h2>
                <span className="rounded-full border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-[10px] font-semibold text-theme-label">
                  Demo Leads
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs text-theme-label leading-relaxed">
                Sample caller profiles to test receptionist routing and call handling in your local session.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                id="demo-search"
                aria-label="Search demo leads"
                type="search"
                value={demoQuery}
                onChange={(event) => setDemoQuery(event.target.value)}
                placeholder="Search demo leads…"
                className="input !text-xs"
              />
            </div>
          </div>

          {demoNotice && (
            <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {demoNotice}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {filteredLeads.map((lead) => (
              <article
                key={lead.id}
                className="card flex flex-col justify-between !p-4 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-theme-fg">{lead.company}</span>
                    <span className="rounded bg-theme-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-theme-label">
                      Score: {lead.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-theme-label">
                    {lead.name} · {lead.location}
                  </p>
                  <p className="mt-1 font-mono text-xs text-theme-label">{lead.phone}</p>
                  {lead.summary && (
                    <p className="mt-3 text-xs leading-relaxed text-theme-label bg-theme-surface-muted/40 rounded p-2">
                      {lead.summary}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={lead.status !== "new"}
                  onClick={() => queueDemoLead(lead.id)}
                  className="btn-secondary !text-xs !py-1.5 mt-4 w-full gap-1 disabled:opacity-50"
                >
                  {lead.status === "queued" ? (
                    <>
                      <Check size={12} className="text-emerald-600" aria-hidden="true" />
                      In demo queue
                    </>
                  ) : lead.status === "called" ? (
                    "Example call only"
                  ) : (
                    "Add to demo queue"
                  )}
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-theme-border/60 pt-5 text-xs text-theme-label flex flex-wrap justify-between gap-2">
          <p>VoiceDesk · Open-source, production AI voice receptionists.</p>
          <p>Self-hosted on Cloudflare Python Workers & D1.</p>
        </footer>
      </div>
    </main>
  );
}

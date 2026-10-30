"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Buildings, Check, MagnifyingGlass, MicrophoneStage, PhoneCall, Plus, ArrowClockwise } from "@phosphor-icons/react";
import { api, type Business, type Call, type Lead } from "@/lib/api";
import { apiDate } from "./[id]/ui";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";
const button = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${focus}`;
const DEMO_LEADS: Lead[] = [
  { id: "lead-1", name: "Maya Chen", company: "Northline Dental", phone: "+1 (415) 555-0184", location: "San Francisco, CA", score: 94, status: "queued", summary: "Example: interested in after-hours coverage and appointment reminders." },
  { id: "lead-2", name: "Jordan Patel", company: "Harbor Wellness", phone: "+1 (212) 555-0136", location: "New York, NY", score: 89, status: "called", summary: "Example: asked about weekend call coverage and staff visibility." },
  { id: "lead-3", name: "Ava Brooks", company: "Summit Repair Co.", phone: "+1 (305) 555-0119", location: "Miami, FL", score: 81, status: "new" },
];

function formatDate(value: string) {
  const date = apiDate(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function LoadingRows() {
  return <div role="status" aria-label="Loading workspace data" className="space-y-3 p-5"><span className="sr-only">Loading workspace data</span>{[1, 2, 3].map((row) => <div key={row} className="h-20 rounded-lg bg-zinc-100 motion-safe:animate-pulse" />)}</div>;
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
  const [demoQuery, setDemoQuery] = useState("");
  const [leads, setLeads] = useState(DEMO_LEADS);
  const [demoNotice, setDemoNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setBusinessLoading(true);
    setCallLoading(true);
    setBusinessError("");
    setCallError("");
    api.businesses.list()
      .then((data) => { if (!cancelled) setBusinesses(data); })
      .catch(() => {
        if (!cancelled) { setBusinesses([]); setBusinessError("Could not load businesses. Check the API connection and try again."); }
      })
      .finally(() => { if (!cancelled) setBusinessLoading(false); });
    api.calls.list()
      .then((data) => { if (!cancelled) setCalls(data); })
      .catch(() => {
        if (!cancelled) { setCalls([]); setCallError("Could not load calls. Check the API connection and try again."); }
      })
      .finally(() => { if (!cancelled) setCallLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  const filteredBusinesses = useMemo(() => {
    const term = query.trim().toLowerCase();
    return businesses.filter((business) => [business.name, business.vertical ?? "", business.phone_number ?? ""].some((value) => value.toLowerCase().includes(term)));
  }, [businesses, query]);
  const filteredLeads = useMemo(() => {
    const term = demoQuery.trim().toLowerCase();
    return leads.filter((lead) => [lead.name, lead.company, lead.location].some((value) => value.toLowerCase().includes(term)));
  }, [leads, demoQuery]);
  const recentCalls = useMemo(() => [...calls].sort((a, b) => (Date.parse(b.started_at) || 0) - (Date.parse(a.started_at) || 0)).slice(0, 5), [calls]);

  function queueDemoLead(id: string) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: "queued" } : lead));
    setDemoNotice("Added to the example queue in this browser only. No phone call was placed.");
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif]">
      <header className="border-b border-zinc-200 bg-white">
        <nav aria-label="Workspace navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className={`flex items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight ${focus}`}><span className="rounded-lg bg-emerald-900 p-2 text-emerald-100"><MicrophoneStage aria-hidden="true" weight="fill" size={18} /></span>VoiceDesk<span className="hidden text-sm font-normal text-zinc-500 sm:inline">/ Workspace</span></Link>
          <div className="flex items-center gap-4 text-xs text-zinc-500"><span className="rounded border border-zinc-200 px-2 py-1">Self-hosted</span><Link href="/" className={`inline-flex min-h-10 items-center gap-1 rounded-sm hover:text-emerald-800 ${focus}`}>View site <ArrowUpRight aria-hidden="true" size={14} /></Link></div>
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-medium text-emerald-800">Workspace overview</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Your voice operations.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Manage your businesses and review call activity from your connected API.</p></div>
          <Link href="/dashboard/new" className={`${button} self-start bg-emerald-900 text-white hover:bg-emerald-800`}><Plus aria-hidden="true" size={17} />Create a business</Link>
        </div>

        <section aria-label="Live workspace metrics" className="mt-8 grid grid-cols-1 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { label: "Businesses", value: businesses.length, error: businessError, loading: businessLoading, note: "From your API · excludes demo leads" },
            { label: "Active configurations", value: businesses.filter((business) => business.active).length, error: businessError, loading: businessLoading, note: "From your API · excludes demo leads" },
            { label: "Recent call records", value: calls.length, error: callError, loading: callLoading, note: "Latest API records · up to 50 calls" },
          ].map((metric) => <div key={metric.label} className="px-6 py-5"><p className="text-xs text-zinc-500">{metric.label}</p><p className="mt-2 text-3xl font-medium tracking-tight tabular-nums" aria-label={`${metric.label}: ${metric.loading ? "loading" : metric.error ? "unavailable" : metric.value}`}>{metric.loading || metric.error ? "—" : metric.value}</p><p className="mt-1 text-[11px] text-zinc-500">{metric.loading ? "Loading API data" : metric.error ? "Data unavailable" : metric.note}</p></div>)}
        </section>

        {(businessError || callError) && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-sm text-amber-900">Some workspace data is unavailable. Available data is shown below.</p><button disabled={businessLoading && callLoading} onClick={() => setRefresh((value) => value + 1)} className={`${button} border border-amber-300 bg-white text-amber-950 hover:bg-amber-100 disabled:opacity-50`}><ArrowClockwise aria-hidden="true" size={16} />{businessLoading && callLoading ? "Retrying…" : "Retry connection"}</button></div>}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section aria-labelledby="business-title" className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 p-5"><div className="flex items-center justify-between gap-3"><h2 id="business-title" className="text-lg font-medium tracking-tight">Businesses</h2><Buildings aria-hidden="true" size={20} className="text-zinc-500" /></div><label htmlFor="business-search" className="sr-only">Search businesses</label><div className="relative mt-4"><MagnifyingGlass aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" /><input id="business-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, type, or number" className="min-h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" /></div></div>
            {businessLoading ? <LoadingRows /> : businessError ? <p className="p-6 text-sm leading-6 text-zinc-600">{businessError}</p> : businesses.length === 0 ? <div className="px-6 py-12 text-center"><Buildings aria-hidden="true" size={28} className="mx-auto text-emerald-800" /><h3 className="mt-4 font-medium">Your first business starts here.</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">Add a business to configure an agent, its conversation flow, and voice connection.</p><Link href="/dashboard/new" className={`${button} mt-5 bg-emerald-900 text-white hover:bg-emerald-800`}>Create a business <ArrowRight aria-hidden="true" size={16} /></Link></div> : filteredBusinesses.length === 0 ? <div className="p-8 text-center"><p className="text-sm text-zinc-600">No businesses match “{query}”.</p><button onClick={() => setQuery("")} className={`${button} mt-3 text-emerald-800 hover:bg-emerald-50`}>Clear search</button></div> : <div className="divide-y divide-zinc-100">{filteredBusinesses.map((business) => <Link key={business.id} href={`/dashboard/${business.id}`} className={`group flex items-center justify-between gap-3 p-5 transition-colors hover:bg-emerald-50/50 focus-visible:bg-emerald-50 ${focus}`}><div className="min-w-0"><h3 className="break-words text-sm font-medium">{business.name}</h3><p className="mt-1 text-xs capitalize text-zinc-500">{business.vertical} · {business.active ? "Active configuration" : "Paused"}</p><p className="mt-2 break-all font-mono text-xs text-zinc-500">{business.phone_number ?? "No phone number connected"}</p></div><ArrowUpRight aria-hidden="true" size={18} className="shrink-0 text-zinc-500 group-hover:text-emerald-800" /></Link>)}</div>}
          </section>

          <section aria-labelledby="calls-title" className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-5"><div><h2 id="calls-title" className="text-lg font-medium tracking-tight">Recent calls</h2><p className="mt-1 text-xs text-zinc-500">Latest five of up to 50 API records · not a live stream</p></div><PhoneCall aria-hidden="true" size={20} className="text-zinc-500" /></div>
            {callLoading ? <LoadingRows /> : callError ? <p className="p-6 text-sm leading-6 text-zinc-600">{callError}</p> : recentCalls.length === 0 ? <div className="px-6 py-12"><PhoneCall aria-hidden="true" size={28} className="text-zinc-500" /><h3 className="mt-4 font-medium">No calls recorded yet.</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Connect voice and telephony in a business workspace. Calls will appear here after the API records them.</p></div> : <ul className="divide-y divide-zinc-100">{recentCalls.map((call) => <li key={call.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-all font-mono text-sm">{call.caller_number ?? "Unknown caller"}</p><span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] capitalize text-zinc-600">{call.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs tabular-nums text-zinc-500">{formatDate(call.started_at)}{call.duration_sec != null ? ` · ${call.duration_sec}s` : ""}</p>{call.outcome && <p className="mt-2 break-words text-xs leading-5 text-zinc-600">{call.outcome}</p>}</li>)}</ul>}
          </section>
        </div>

        <section aria-labelledby="demo-title" className="mt-10 border-t border-zinc-200 pt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-2"><h2 id="demo-title" className="text-lg font-medium tracking-tight">Explore example leads</h2><span className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-500">Demo data</span></div><p className="mt-2 max-w-xl text-xs leading-6 text-zinc-500">Fictional prospects and example summaries. Queue changes stay in this browser session and never place calls or affect live metrics.</p></div><div className="w-full sm:w-64"><label htmlFor="demo-search" className="sr-only">Search demo leads</label><input id="demo-search" type="search" value={demoQuery} onChange={(event) => setDemoQuery(event.target.value)} placeholder="Search example leads" className="min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15" /></div></div>
          <p role="status" className="mt-3 text-xs leading-6 text-emerald-800">{demoNotice}</p>
          {filteredLeads.length === 0 ? <div className="mt-3 rounded-lg border border-dashed border-zinc-300 p-7 text-center"><p className="text-sm text-zinc-500">No example leads match “{demoQuery}”.</p><button onClick={() => setDemoQuery("")} className={`${button} mt-2 text-emerald-800 hover:bg-emerald-50`}>Clear demo search</button></div> : <div className="mt-3 grid gap-4 md:grid-cols-3">{filteredLeads.map((lead) => <article key={lead.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white/70 p-5"><p className="text-sm font-medium">{lead.company}</p><p className="mt-1.5 text-xs text-zinc-500">{lead.name} · {lead.location}</p><p className="mt-2 font-mono text-xs text-zinc-500">{lead.phone}</p><p className="mt-4 text-[11px] text-zinc-500">Example score: {lead.score} · {lead.status === "queued" ? "Demo queued" : lead.status === "called" ? "Example completed" : "Example new"}</p>{lead.summary && <p className="mt-3 text-xs leading-6 text-zinc-500">{lead.summary}</p>}<div className="flex-1" /><button disabled={lead.status !== "new"} onClick={() => queueDemoLead(lead.id)} className={`${button} mt-5 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:cursor-default disabled:bg-zinc-50 disabled:text-zinc-500`}>{lead.status === "queued" ? <><Check aria-hidden="true" size={15} />In demo queue</> : lead.status === "called" ? "Example call only" : "Add to demo queue"}</button></article>)}</div>}
        </section>
        <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-zinc-200 pt-5 text-xs text-zinc-500"><p>VoiceDesk · Your infrastructure, your configuration.</p><p>Refresh this page to load the latest API activity.</p></footer>
      </div>
    </main>
  );
}

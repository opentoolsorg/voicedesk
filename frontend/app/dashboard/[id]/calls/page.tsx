"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { dateTime, duration, EmptyState, label, LoadState, OutcomeBadge, outcomes, useBusinessId, useResource } from "../ui";

function CallDrawer({ id, businessId, close }: { id: string; businessId: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { data: call, loading, error, retry } = useResource(useCallback(() => api.calls.get(id), [id]));
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="call-detail-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl overflow-y-auto border-l border-theme-border bg-theme-surface p-0 text-theme-fg shadow-2xl backdrop:bg-black/30">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-border bg-theme-surface px-6 py-5"><h2 id="call-detail-title" className="text-lg font-semibold">Conversation details</h2><button autoFocus className="btn-secondary !p-2" aria-label="Close call details" onClick={close}><X size={20} /></button></div>
    <div className="space-y-7 p-6"><LoadState loading={loading} error={error} retry={retry} />{!loading && !error && call && <>
      <section><div className="mb-4"><OutcomeBadge outcome={call.outcome} /></div><h3 className="break-words text-2xl font-semibold tracking-tight">{call.caller_name || "Unknown caller"}</h3>{call.caller_number && <a href={`tel:${call.caller_number}`} className="mt-2 inline-block text-sm underline underline-offset-4">{call.caller_number}</a>}<p className="mt-3 text-xs text-theme-label">{dateTime(call.started_at)} · {duration(call.duration_sec)} · {label(call.direction)}</p></section>
      <section className="rounded-2xl bg-theme-surface-muted p-5"><h3 className="text-sm font-semibold">At a glance</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-theme-label">{call.summary || "No summary was recorded for this call."}</p></section>
      {call.recording_url && <section><h3 className="mb-3 text-sm font-semibold">Recording</h3><audio controls preload="none" src={call.recording_url} className="w-full" aria-label="Call recording">Your browser does not support audio playback.</audio></section>}
      <section><h3 className="mb-4 text-sm font-semibold">Transcript</h3>{call.transcript?.length ? <ol className="space-y-4">{call.transcript.map((turn, index) => <li key={index} className={`max-w-[92%] rounded-2xl p-4 ${["assistant", "agent"].includes(turn.role) ? "ml-auto bg-theme-surface-muted" : "border border-theme-border bg-theme-bg"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-theme-label">{["assistant", "agent"].includes(turn.role) ? "Receptionist" : label(turn.role)}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{turn.text}</p></li>)}</ol> : <p className="text-sm text-theme-label">No transcript available for this call.</p>}</section>
      <section><h3 className="mb-3 text-sm font-semibold">Linked appointments</h3>{call.bookings.length ? <ul className="space-y-3">{call.bookings.map((booking) => <li key={booking.id} className="rounded-xl border border-theme-border p-4"><Link href={`/dashboard/${businessId}/appointments`} className="text-sm font-medium underline underline-offset-4">{booking.service || "Appointment"}</Link><p className="mt-2 text-xs text-theme-label">{dateTime(booking.appointment_at)} · {label(booking.status)}</p></li>)}</ul> : <p className="text-sm text-theme-label">No appointments linked to this call.</p>}</section>
    </>}</div>
  </dialog>;
}

export default function CallsPage() {
  const id = useBusinessId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [outcome, setOutcome] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => { const timer = setTimeout(() => { setDebounced(query); setOffset(0); }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { setSelected(new URLSearchParams(window.location.search).get("call")); }, [id]);
  const { data: result, loading, error, retry } = useResource(useCallback(() => api.calls.list(id, { q: debounced, outcome, limit: 51, offset }), [id, debounced, outcome, offset]));
  const calls = result?.slice(0, 50);
  const hasNext = (result?.length ?? 0) > 50;
  const close = useCallback(() => { setSelected(null); const url = new URL(window.location.href); url.searchParams.delete("call"); window.history.replaceState(null, "", url); }, []);
  return <div className="space-y-6" aria-busy={loading}><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-theme-label">The full conversation</p><div className="mt-2 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold tracking-tight">Calls</h1><a href={api.calls.exportUrl(id, { outcome, q: query })} download className="btn-secondary">Export CSV</a></div><p className="mt-2 text-sm text-theme-label">Search, listen, and pick up where your receptionist left off.</p></div>
    <div className="card space-y-4"><label htmlFor="call-search" className="sr-only">Search caller name, number, or summary</label><div className="relative"><Search size={18} aria-hidden="true" className="absolute left-4 top-3.5 text-theme-label" /><input id="call-search" type="search" className="input !pl-11" placeholder="Search names, numbers, or summaries…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex flex-wrap gap-2" aria-label="Filter by outcome">{["", ...outcomes].map((value) => <button key={value} aria-pressed={outcome === value} className={outcome === value ? "btn-primary !px-3 !py-2 !text-xs" : "btn-secondary !px-3 !py-2 !text-xs"} onClick={() => { setOutcome(value); setOffset(0); }}>{value ? label(value) : "All calls"}</button>)}</div></div>
    <LoadState loading={loading} error={error} retry={retry} hasData={result !== null} />
    {calls && <section className="card !p-0 overflow-hidden">{!calls.length ? <EmptyState title={query || outcome ? "No matching conversations" : "No calls yet"}>{query || outcome ? "Try a different search or clear your filters." : "Your calls will appear here once your receptionist starts answering."}</EmptyState> : <>
      <div className="hidden md:block"><table className="w-full text-left text-sm"><caption className="sr-only">Call history. Select a caller to open full details.</caption><thead className="border-b border-theme-border bg-theme-bg text-xs text-theme-label"><tr><th scope="col" className="px-5 py-4">Caller</th><th scope="col" className="py-4">When</th><th scope="col" className="py-4">Duration</th><th scope="col" className="px-5 py-4">Outcome</th></tr></thead><tbody className="divide-y divide-theme-border">{calls.map((call) => <tr key={call.id} className="cursor-pointer hover:bg-theme-bg" onClick={() => setSelected(call.id)}><td className="max-w-xs px-5 py-4"><button onClick={(event) => { event.stopPropagation(); setSelected(call.id); }} className="text-left font-medium underline-offset-4 hover:underline">{call.caller_name || call.caller_number || "Unknown caller"}</button><p className="mt-1 max-w-xs truncate text-xs text-theme-label">{call.summary || call.caller_number || "No summary yet"}</p></td><td className="py-4 text-xs text-theme-label">{dateTime(call.started_at)}</td><td className="py-4 tabular-nums">{duration(call.duration_sec)}</td><td className="px-5 py-4"><OutcomeBadge outcome={call.outcome} /></td></tr>)}</tbody></table></div>
      <ul className="divide-y divide-theme-border md:hidden">{calls.map((call) => <li key={call.id}><button onClick={() => setSelected(call.id)} className="w-full space-y-3 p-5 text-left hover:bg-theme-bg"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{call.caller_name || call.caller_number || "Unknown caller"}</span><OutcomeBadge outcome={call.outcome} /></div><p className="line-clamp-2 text-sm text-theme-label">{call.summary || "No summary yet"}</p><p className="text-xs text-theme-label">{dateTime(call.started_at)} · {duration(call.duration_sec)}</p></button></li>)}</ul>
    </>}{(offset > 0 || hasNext) && <nav aria-label="Call log pages" className="flex items-center justify-between gap-3 border-t border-theme-border p-4"><button className="btn-secondary disabled:opacity-50" disabled={offset === 0 || loading} onClick={() => setOffset((v) => Math.max(0, v - 50))}>Previous</button><span className="text-xs text-theme-label">Page {offset / 50 + 1}</span><button className="btn-secondary disabled:opacity-50" disabled={!hasNext || loading} onClick={() => setOffset((v) => v + 50)}>Next</button></nav>}</section>}
    {selected && <CallDrawer key={selected} id={selected} businessId={id} close={close} />}
  </div>;
}

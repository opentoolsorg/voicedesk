"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Download,
  Phone,
  Play,
  Search,
  User,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  dateTime,
  duration,
  EmptyState,
  label,
  LoadState,
  OutcomeBadge,
  outcomes,
  SkeletonTableRows,
  useBusinessId,
  useResource,
} from "../ui";

function CallDrawer({
  id,
  businessId,
  close,
}: {
  id: string;
  businessId: string;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { data: call, loading, error, retry } = useResource(
    useCallback(() => api.calls.get(id), [id])
  );

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="call-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl overflow-y-auto border-l border-theme-border bg-theme-surface p-0 text-theme-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm motion-reduce:transition-none"
    >
      {/* Drawer Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-border bg-theme-surface/95 backdrop-blur-md px-6 py-4">
        <div>
          <h2 id="call-detail-title" className="text-base font-semibold tracking-tight text-theme-fg">
            Conversation details
          </h2>
          <p className="text-xs text-theme-label font-mono">ID: {id.slice(0, 8)}</p>
        </div>
        <button
          autoFocus
          className="btn-secondary !p-2"
          aria-label="Close call details"
          onClick={close}
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-6 p-6">
        <LoadState loading={loading} error={error} retry={retry} />
        {!loading && !error && call && (
          <>
            {/* Caller Overview Card */}
            <section className="rounded-xl border border-theme-border bg-theme-surface-muted/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2">
                    <OutcomeBadge outcome={call.outcome} />
                  </div>
                  <h3 className="break-words text-xl font-bold tracking-tight text-theme-fg">
                    {call.caller_name || "Unknown caller"}
                  </h3>
                  {call.caller_number && (
                    <a
                      href={`tel:${call.caller_number}`}
                      className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-xs text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
                    >
                      <Phone size={12} aria-hidden="true" />
                      {call.caller_number}
                    </a>
                  )}
                </div>

                <div className="flex flex-col items-end text-xs text-theme-label font-mono">
                  <span>{duration(call.duration_sec)}</span>
                  <span>{label(call.direction)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-theme-border/60 pt-3 text-xs text-theme-label">
                <Clock3 size={13} aria-hidden="true" />
                <span>{dateTime(call.started_at)}</span>
              </div>
            </section>

            {/* AI Summary Card */}
            <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-950/60 dark:bg-emerald-950/20">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                Call summary
              </h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-theme-fg">
                {call.summary || "No summary was recorded for this call."}
              </p>
            </section>

            {/* Audio Recording */}
            {call.recording_url && (
              <section className="rounded-xl border border-theme-border p-4">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-theme-label">
                  <Play size={13} aria-hidden="true" />
                  <span>Call recording</span>
                </div>
                <audio
                  controls
                  preload="none"
                  src={call.recording_url}
                  className="w-full"
                  aria-label="Call audio recording"
                >
                  Your browser does not support audio playback.
                </audio>
              </section>
            )}

            {/* Full Transcript */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-theme-label">
                Full conversation transcript
              </h3>
              {call.transcript?.length ? (
                <ol className="space-y-3">
                  {call.transcript.map((turn, index) => {
                    const isAssistant = ["assistant", "agent"].includes(turn.role);
                    return (
                      <li
                        key={index}
                        className={`flex flex-col ${
                          isAssistant ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-xl p-3.5 text-xs leading-relaxed ${
                            isAssistant
                              ? "bg-emerald-900 text-white dark:bg-emerald-800 shadow-sm"
                              : "border border-theme-border bg-theme-surface-muted/60 text-theme-fg"
                          }`}
                        >
                          <div
                            className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                              isAssistant
                                ? "text-emerald-200"
                                : "text-theme-label"
                            }`}
                          >
                            {isAssistant ? (
                              <span>AI Receptionist</span>
                            ) : (
                              <span>Caller</span>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap break-words">{turn.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-xs text-theme-label">
                  No transcript text available for this call.
                </p>
              )}
            </section>

            {/* Linked Bookings */}
            <section className="space-y-3 border-t border-theme-border/60 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-theme-label">
                <CalendarDays size={14} aria-hidden="true" />
                <span>Linked appointments</span>
              </div>
              {call.bookings.length ? (
                <ul className="space-y-2">
                  {call.bookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="rounded-lg border border-theme-border bg-theme-surface p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/dashboard/${businessId}/appointments`}
                          className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
                        >
                          {booking.service || "Appointment"}
                        </Link>
                        <span className="rounded border border-theme-border px-1.5 py-0.5 text-[10px] font-medium uppercase text-theme-label">
                          {label(booking.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-theme-label">
                        {dateTime(booking.appointment_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-theme-label">
                  No appointments booked during this call.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </dialog>
  );
}

export default function CallsPage() {
  const id = useBusinessId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [outcome, setOutcome] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get("call"));
  }, [id]);

  const { data: result, loading, error, retry } = useResource(
    useCallback(
      () => api.calls.list(id, { q: debounced, outcome, limit: 51, offset }),
      [id, debounced, outcome, offset]
    )
  );

  const calls = result?.slice(0, 50);
  const hasNext = (result?.length ?? 0) > 50;

  const close = useCallback(() => {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("call");
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
            Call history
          </h1>
          <p className="mt-1 text-sm text-theme-label">
            Search, listen, and review full transcripts from every conversation.
          </p>
        </div>

        <a
          href={api.calls.exportUrl(id, { outcome, q: debounced })}
          download
          className="btn-secondary self-start sm:self-auto gap-2"
        >
          <Download size={14} aria-hidden="true" />
          Export CSV
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="card space-y-4">
        <label htmlFor="call-search" className="sr-only">
          Search caller name, phone number, or call summary
        </label>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3.5 top-3 text-theme-label"
          />
          <input
            id="call-search"
            type="search"
            className="input !pl-10"
            placeholder="Search by caller, phone number, keywords, or topics…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {/* Outcome Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by call outcome">
          {["", ...outcomes].map((value) => {
            const active = outcome === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-900 text-white shadow-sm dark:bg-emerald-800"
                    : "border border-theme-border bg-theme-surface text-theme-label hover:bg-theme-surface-muted hover:text-theme-fg"
                }`}
                onClick={() => {
                  setOutcome(value);
                  setOffset(0);
                }}
              >
                {value ? label(value) : "All calls"}
              </button>
            );
          })}
        </div>
      </div>

      <LoadState loading={loading} error={error} retry={retry} hasData={result !== null} />

      {/* Calls Table & Mobile Cards */}
      {calls && (
        <section className="card !p-0 overflow-hidden">
          {!calls.length ? (
            <EmptyState
              title={query || outcome ? "No matching conversations" : "No calls recorded yet"}
              icon={Phone}
            >
              {query || outcome
                ? "Try a different search query or clear the active outcome filter."
                : "Your conversations will appear here once your AI receptionist starts taking calls."}
            </EmptyState>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Call history. Click any row to open the conversation drawer.
                  </caption>
                  <thead className="border-b border-theme-border bg-theme-surface-muted/40 text-xs font-semibold text-theme-label">
                    <tr>
                      <th scope="col" className="px-5 py-3">
                        Caller & Summary
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Date & Time
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Duration
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Outcome
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border font-sans">
                    {calls.map((call) => (
                      <tr
                        key={call.id}
                        className="group cursor-pointer transition-colors hover:bg-theme-surface-muted/40"
                        onClick={() => setSelected(call.id)}
                      >
                        <td className="max-w-md px-5 py-3.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected(call.id);
                            }}
                            className="text-left font-semibold text-theme-fg group-hover:text-emerald-800 dark:group-hover:text-emerald-400"
                          >
                            {call.caller_name || call.caller_number || "Unknown caller"}
                          </button>
                          <p className="mt-0.5 line-clamp-1 text-xs text-theme-label">
                            {call.summary || call.caller_number || "No summary recorded"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-theme-label whitespace-nowrap">
                          {dateTime(call.started_at)}
                        </td>
                        <td className="px-5 py-3.5 text-xs tabular-nums text-theme-label font-mono">
                          {duration(call.duration_sec)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <OutcomeBadge outcome={call.outcome} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <ul className="divide-y divide-theme-border md:hidden">
                {calls.map((call) => (
                  <li key={call.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(call.id)}
                      className="w-full space-y-2 p-4 text-left transition-colors hover:bg-theme-surface-muted/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-theme-fg">
                          {call.caller_name || call.caller_number || "Unknown caller"}
                        </span>
                        <OutcomeBadge outcome={call.outcome} />
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-theme-label">
                        {call.summary || "No summary recorded"}
                      </p>
                      <p className="text-[11px] font-mono text-theme-label">
                        {dateTime(call.started_at)} · {duration(call.duration_sec)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Pagination */}
          {(offset > 0 || hasNext) && (
            <nav
              aria-label="Call log pages"
              className="flex items-center justify-between border-t border-theme-border bg-theme-surface-muted/20 px-5 py-3"
            >
              <button
                type="button"
                className="btn-secondary !text-xs disabled:opacity-50"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((v) => Math.max(0, v - 50))}
              >
                Previous 50
              </button>
              <span className="text-xs text-theme-label">Page {offset / 50 + 1}</span>
              <button
                type="button"
                className="btn-secondary !text-xs disabled:opacity-50"
                disabled={!hasNext || loading}
                onClick={() => setOffset((v) => v + 50)}
              >
                Next 50
              </button>
            </nav>
          )}
        </section>
      )}

      {selected && <CallDrawer key={selected} id={selected} businessId={id} close={close} />}
    </div>
  );
}

"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { dateTime, EmptyState, LoadState, OutcomeBadge, useBusinessId, useResource } from "../ui";

export default function MessagesPage() {
  const id = useBusinessId();
  const { data: messages, loading, error, retry } = useResource(useCallback(() => api.businesses.messages(id), [id]));
  return <div className="space-y-6" aria-busy={loading}><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-theme-label">Keep the connection going</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Messages & leads</h1><p className="mt-2 text-sm text-theme-label">The people who want to hear from you. All the context you need.</p></div><LoadState loading={loading} error={error} retry={retry} hasData={messages !== null} />{messages && (messages.length ? <ul className="grid gap-4 xl:grid-cols-2">{messages.map((message) => <li key={message.id} className="card flex min-w-0 flex-col"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="break-words font-semibold">{message.caller_name || message.caller_number || "Unknown caller"}</h2><p className="mt-1 text-xs text-theme-label">{dateTime(message.started_at)}</p></div><OutcomeBadge outcome={message.outcome} /></div><p className="my-5 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-theme-label">{message.summary || "No summary available. Open the conversation for more details."}</p><div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border pt-4">{message.caller_number ? <a href={`tel:${message.caller_number}`} className="btn-secondary gap-2 !px-3 !py-2 !text-xs"><Phone size={14} aria-hidden="true" />{message.caller_number}</a> : <span className="text-xs text-theme-label">Callback number unavailable</span>}<Link href={`/dashboard/${id}/calls?call=${encodeURIComponent(message.id)}`} className="inline-flex items-center gap-1 text-xs font-medium">View call<ArrowUpRight size={14} aria-hidden="true" /></Link></div></li>)}</ul> : <section className="card"><EmptyState title="Your inbox is all caught up">When a caller leaves a message or expresses interest, their details and a callback link will appear here.</EmptyState></section>)}</div>;
}

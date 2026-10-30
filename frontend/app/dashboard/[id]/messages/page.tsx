"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, Phone } from "lucide-react";
import { api } from "@/lib/api";
import {
  dateTime,
  EmptyState,
  LoadState,
  OutcomeBadge,
  useBusinessId,
  useResource,
} from "../ui";

export default function MessagesPage() {
  const id = useBusinessId();
  const { data: messages, loading, error, retry } = useResource(
    useCallback(() => api.businesses.messages(id), [id])
  );

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
          Messages & leads
        </h1>
        <p className="mt-1 text-sm text-theme-label">
          Callers who requested a callback or follow-up, organized with instant context.
        </p>
      </div>

      <LoadState loading={loading} error={error} retry={retry} hasData={messages !== null} />

      {messages &&
        (messages.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {messages.map((message) => (
              <li
                key={message.id}
                className="card flex min-w-0 flex-col justify-between transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-theme-border/60 pb-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-theme-fg">
                        {message.caller_name || message.caller_number || "Unknown caller"}
                      </h2>
                      <p className="mt-0.5 text-xs text-theme-label">
                        {dateTime(message.started_at)}
                      </p>
                    </div>
                    <OutcomeBadge outcome={message.outcome} />
                  </div>

                  <p className="my-4 whitespace-pre-wrap break-words text-xs leading-relaxed text-theme-label">
                    {message.summary || "No notes available for this message."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-theme-border/60 pt-3">
                  {message.caller_number ? (
                    <a
                      href={`tel:${message.caller_number}`}
                      className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5 font-mono"
                    >
                      <Phone size={12} aria-hidden="true" />
                      {message.caller_number}
                    </a>
                  ) : (
                    <span className="text-xs text-theme-label italic">No phone number</span>
                  )}

                  <Link
                    href={`/dashboard/${id}/calls?call=${encodeURIComponent(message.id)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
                  >
                    View call
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="card">
            <EmptyState
              title="Your callback inbox is clear"
              icon={MessageSquare}
            >
              When a caller leaves a message or asks for a callback, their request and contact info
              will be organized here.
            </EmptyState>
          </section>
        ))}
    </div>
  );
}

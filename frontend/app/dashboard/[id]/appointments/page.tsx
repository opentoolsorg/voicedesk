"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, CalendarDays, Clock3, Phone, User } from "lucide-react";
import { api } from "@/lib/api";
import {
  dateTime,
  EmptyState,
  label,
  LoadState,
  useBusinessId,
  useResource,
} from "../ui";

const statuses = ["confirmed", "completed", "cancelled", "no_show"];

export default function AppointmentsPage() {
  const id = useBusinessId();
  const [upcoming, setUpcoming] = useState(true);
  const {
    data: bookings,
    setData: setBookings,
    loading,
    error,
    retry,
  } = useResource(
    useCallback(() => api.businesses.bookings(id, upcoming), [id, upcoming])
  );
  const [saving, setSaving] = useState<string | null>(null);
  const pending = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  async function update(bookingId: string, status: string) {
    if (pending.current) return;
    pending.current = true;
    setSaving(bookingId);
    setSaveError("");
    setNotice("");
    try {
      const updated = await api.bookings.update(bookingId, { status });
      setBookings(
        (current) =>
          current?.map((booking) => (booking.id === updated.id ? updated : booking)) ?? null
      );
      setNotice("Appointment status updated.");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not update the appointment. Try again."
      );
    } finally {
      pending.current = false;
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6" aria-busy={loading || saving !== null}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-theme-label">
            Automated calendar bookings scheduled by your receptionist during calls.
          </p>
        </div>

        {/* Upcoming / Past Tab Switcher */}
        <div
          className="inline-flex rounded-lg border border-theme-border bg-theme-surface p-1 shadow-sm self-start sm:self-auto"
          role="group"
          aria-label="Appointment time range"
        >
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={upcoming === value}
              disabled={saving !== null}
              onClick={() => setUpcoming(value)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                upcoming === value
                  ? "bg-theme-btn-primary text-theme-btn-primary-fg shadow-sm"
                  : "text-theme-label hover:text-theme-fg"
              }`}
            >
              {value ? "Upcoming" : "Past bookings"}
            </button>
          ))}
        </div>
      </div>

      {saveError && (
        <div role="alert" className="card border-rose-200 bg-rose-50 text-xs text-rose-800 p-4">
          {saveError}
        </div>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>

      <LoadState loading={loading} error={error} retry={retry} hasData={bookings !== null} />

      {bookings &&
        (bookings.length ? (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="card transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-theme-border bg-theme-surface-muted text-emerald-800 dark:text-emerald-400">
                      <CalendarDays size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-theme-fg truncate">
                          {booking.service || "Appointment"}
                        </h2>
                        <span className="rounded-md border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-[11px] font-mono text-theme-label">
                          {booking.duration_min} min
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-label">
                        <span className="flex items-center gap-1">
                          <Clock3 size={13} aria-hidden="true" />
                          {dateTime(booking.appointment_at)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-theme-fg">
                          <User size={13} aria-hidden="true" />
                          {booking.customer_name || "Guest"}
                        </span>
                        {booking.customer_phone && (
                          <>
                            <span>·</span>
                            <a
                              className="font-mono text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
                              href={`tel:${booking.customer_phone}`}
                            >
                              {booking.customer_phone}
                            </a>
                          </>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="mt-2 text-xs leading-relaxed text-theme-label bg-theme-surface-muted/50 rounded-lg p-2.5">
                          {booking.notes}
                        </p>
                      )}
                      {booking.call_id && (
                        <Link
                          href={`/dashboard/${id}/calls?call=${encodeURIComponent(booking.call_id)}`}
                          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
                        >
                          View source call
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-44 shrink-0 border-t border-theme-border/60 pt-3 sm:border-0 sm:pt-0">
                    <label
                      className="label !mb-1 !text-[11px]"
                      htmlFor={`status-${booking.id}`}
                    >
                      Status
                    </label>
                    <select
                      id={`status-${booking.id}`}
                      className="input !py-1.5 text-xs disabled:opacity-50"
                      value={booking.status}
                      disabled={saving !== null || loading}
                      onChange={(event) => void update(booking.id, event.target.value)}
                    >
                      {!statuses.includes(booking.status) && (
                        <option value={booking.status}>{label(booking.status)}</option>
                      )}
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {label(status)}
                        </option>
                      ))}
                    </select>
                    {saving === booking.id && (
                      <p role="status" className="mt-1 text-[11px] text-theme-label">
                        Saving status…
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="card">
            <EmptyState
              title={upcoming ? "No upcoming appointments" : "No past appointments"}
              icon={Calendar}
            >
              {upcoming
                ? "When your receptionist schedules an appointment with a caller, it will appear here."
                : "Completed and canceled appointments will appear here for historical reference."}
            </EmptyState>
          </section>
        ))}
    </div>
  );
}

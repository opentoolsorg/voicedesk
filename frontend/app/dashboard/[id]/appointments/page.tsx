"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { dateTime, EmptyState, label, LoadState, useBusinessId, useResource } from "../ui";

const statuses = ["confirmed", "completed", "cancelled", "no_show"];

export default function AppointmentsPage() {
  const id = useBusinessId();
  const [upcoming, setUpcoming] = useState(true);
  const { data: bookings, setData: setBookings, loading, error, retry } = useResource(useCallback(() => api.businesses.bookings(id, upcoming), [id, upcoming]));
  const [saving, setSaving] = useState<string | null>(null);
  const pending = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  async function update(bookingId: string, status: string) {
    if (pending.current) return;
    pending.current = true; setSaving(bookingId); setSaveError(""); setNotice("");
    try {
      const updated = await api.bookings.update(bookingId, { status });
      setBookings((current) => current?.map((booking) => booking.id === updated.id ? updated : booking) ?? null);
      setNotice("Appointment status updated.");
    }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Could not update the appointment. Try again."); }
    finally { pending.current = false; setSaving(null); }
  }
  return <div className="space-y-6" aria-busy={loading || saving !== null}><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-theme-label">From conversation to calendar</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Appointments</h1><p className="mt-2 text-sm text-theme-label">A clear view of what is coming up, and what is already taken care of.</p></div>
    <div className="inline-flex gap-1 rounded-full border border-theme-border bg-theme-surface p-1" aria-label="Appointment time range">{[true, false].map((value) => <button key={String(value)} aria-pressed={upcoming === value} disabled={saving !== null} onClick={() => setUpcoming(value)} className={upcoming === value ? "btn-primary !py-2" : "btn-secondary !border-transparent !py-2"}>{value ? "Upcoming" : "Past"}</button>)}</div>
    {saveError && <p role="alert" className="card break-words text-sm">{saveError}</p>}<p role="status" className="sr-only">{notice}</p><LoadState loading={loading} error={error} retry={retry} hasData={bookings !== null} />
    {bookings && (bookings.length ? <ul className="space-y-4">{bookings.map((booking) => <li key={booking.id} className="card"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div className="flex min-w-0 gap-4"><span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme-surface-muted sm:flex"><CalendarDays size={20} aria-hidden="true" /></span><div className="min-w-0"><h2 className="break-words font-semibold">{booking.service || "Appointment"}</h2><p className="mt-1 text-sm">{dateTime(booking.appointment_at)} <span className="text-theme-label">· {booking.duration_min} min</span></p><p className="mt-3 break-words text-sm text-theme-label">{booking.customer_name || "Guest"}{booking.customer_phone && <> · <a className="underline underline-offset-4" href={`tel:${booking.customer_phone}`}>{booking.customer_phone}</a></>}</p>{booking.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-theme-label">{booking.notes}</p>}{booking.call_id && <Link href={`/dashboard/${id}/calls?call=${encodeURIComponent(booking.call_id)}`} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold">View source call<ArrowUpRight size={14} aria-hidden="true" /></Link>}</div></div><div className="w-full lg:w-44"><label className="label !text-xs" htmlFor={`status-${booking.id}`}>Appointment status</label><select id={`status-${booking.id}`} className="input disabled:opacity-50" value={booking.status} disabled={saving !== null || loading} onChange={(event) => void update(booking.id, event.target.value)}>{!statuses.includes(booking.status) && <option value={booking.status}>{label(booking.status)}</option>}{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select>{saving === booking.id && <p role="status" className="mt-2 text-xs text-theme-label">Saving status…</p>}</div></div></li>)}</ul> : <section className="card"><EmptyState title={upcoming ? "Nothing on the calendar yet" : "No past appointments"}>{upcoming ? "Appointments booked by your receptionist will appear here, ready for your team." : "Completed and earlier bookings will appear here."}</EmptyState></section>)}
  </div>;
}

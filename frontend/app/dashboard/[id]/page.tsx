"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, MessageSquare, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
import { api, PLANS } from "@/lib/api";
import { dateTime, Disclosure, duration, EmptyState, label, LoadState, OutcomeBadge, outcomes, useBusinessId, useResource } from "./ui";

export default function Overview() {
  const id = useBusinessId();
  const [days, setDays] = useState(30);
  const { data, loading, error, retry } = useResource(useCallback(async () => {
    const [business, analytics, calls] = await Promise.all([api.businesses.get(id), api.businesses.analytics(id, days), api.calls.list(id, { limit: 5 })]);
    return { business, analytics, calls };
  }, [id, days]));
  const [seeding, setSeeding] = useState(false);
  const seedPending = useRef(false);
  const [seedError, setSeedError] = useState("");
  async function seed() {
    if (seedPending.current) return;
    seedPending.current = true;
    setSeeding(true); setSeedError("");
    try { await api.businesses.seedDemo(id); retry(); }
    catch (err) { setSeedError(err instanceof Error ? err.message : "Could not load demo data."); }
    finally { seedPending.current = false; setSeeding(false); }
  }
  const a = data?.analytics;
  const plan = PLANS.find((p) => p.id === data?.business.plan) ?? PLANS[0];
  const max = Math.max(1, ...(a?.daily.map((day) => day.calls) ?? []));
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: a?.hourly?.find((entry) => entry.hour === hour)?.calls ?? 0 }));
  const hourlyMax = Math.max(1, ...hourly.map((entry) => entry.calls));
  const hourLabel = (hour: number) => `${hour % 12 || 12}${hour < 12 ? "a" : "p"}`;
  const metrics = a ? [
    ["Total calls", a.total_calls.toLocaleString(), PhoneCall], ["Answered", `${a.total_calls ? Math.round(a.answered_calls / a.total_calls * 100) : 0}%`, PhoneCall],
    ["Minutes used", a.minutes_used.toLocaleString(undefined, { maximumFractionDigits: 1 }), Clock3], ["Bookings", a.bookings_count.toLocaleString(), CalendarDays],
    ["Leads & messages", (a.leads_count + a.messages_count).toLocaleString(), MessageSquare], ["Spam blocked", a.spam_count.toLocaleString(), ShieldCheck],
  ] as const : [];
  return <div className="space-y-7" aria-busy={loading}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-theme-label">Your front desk, at a glance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Overview</h1><p className="mt-2 text-sm text-theme-label">A little less phone tag. A lot more connection.</p></div><div className="inline-flex gap-1 rounded-full border border-theme-border bg-theme-surface p-1" aria-label="Analytics date range">{[7, 30, 90].map((range) => <button key={range} onClick={() => setDays(range)} aria-pressed={days === range} className={days === range ? "btn-primary !px-3 !py-2 !text-xs" : "btn-secondary !border-transparent !px-3 !py-2 !text-xs"}>{range} days</button>)}</div></div>
    <LoadState loading={loading} error={error} retry={retry} hasData={data !== null} />
    {data && a && <>
      {a.total_calls === 0 && <section className="card"><EmptyState title="Your next conversation starts here"><p>Connect a phone number to start receiving calls, or explore a sample of what your receptionist can do.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button className="btn-accent gap-2 disabled:opacity-50" onClick={seed} disabled={seeding}><Sparkles size={16} aria-hidden="true" />{seeding ? "Loading demo…" : "Load demo data"}</button><Link href={`/dashboard/${id}/phone`} className="btn-secondary">Connect phone</Link></div>{seedError && <p role="alert" className="mt-3 break-words">{seedError}</p>}</EmptyState></section>}
      <Disclosure title={`Key metrics · last ${a.days} days`}><div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{metrics.map(([name, value, Icon]) => <div className="card !p-4" key={name}><Icon size={17} className="mb-5 text-theme-label" aria-hidden="true" /><p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-xs text-theme-label">{name}</p></div>)}</div></Disclosure>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Disclosure title="Daily conversations"><div className="flex justify-between gap-3 text-xs text-theme-label"><p>Calls per day · last {a.days} days</p><span className="tabular-nums">{a.total_calls} total</span></div>
          <svg viewBox="0 0 640 190" role="img" aria-label={`Daily call volume for the last ${a.days} days. Maximum ${max} calls per day. Detailed values in the table below.`} className="mt-6 h-48 w-full overflow-visible">
            {[0, 0.5, 1].map((v) => <g key={v}><line x1="28" x2="635" y1={160 - v * 140} y2={160 - v * 140} stroke="var(--theme-border)" /><text x="20" y={164 - v * 140} textAnchor="end" fill="var(--theme-label)" fontSize="10">{Math.round(max * v)}</text></g>)}
            {a.daily.map((day, index) => { const slot = 600 / Math.max(1, a.daily.length); const h = day.calls / max * 140; return <g key={day.date} tabIndex={0} aria-label={`${day.date}: ${day.calls} calls`} className="group outline-none"><title>{`${day.date}: ${day.calls} calls`}</title><rect x={30 + index * slot} y="15" width={slot} height="150" fill="transparent" /><rect x={30 + index * slot + 1} y={160 - h} width={Math.max(1, slot - 4)} height={h} rx="3" fill="var(--theme-btn-accent-hover)" className="group-hover:opacity-70 group-focus:opacity-60" /></g>; })}
            {a.daily.length > 0 && <><text x="30" y="184" fill="var(--theme-label)" fontSize="10">{a.daily[0].date.slice(5)}</text><text x="630" y="184" textAnchor="end" fill="var(--theme-label)" fontSize="10">{a.daily[a.daily.length - 1].date.slice(5)}</text></>}
          </svg>
          <details className="mt-3 text-xs text-theme-label"><summary className="cursor-pointer">View daily values</summary><div className="mt-3 max-h-48 overflow-y-auto"><table className="w-full text-left"><thead><tr><th scope="col" className="py-2">Date</th><th scope="col">Calls</th></tr></thead><tbody>{a.daily.map((day) => <tr key={day.date}><td className="py-1">{day.date}</td><td>{day.calls}</td></tr>)}</tbody></table></div></details>
        </Disclosure>
        <Disclosure title="Every call has a next step"><p className="mt-1 text-xs text-theme-label">Conversation outcomes</p><div className="mt-6 space-y-4">{Object.entries(a.outcomes).length ? Object.entries({ ...Object.fromEntries(outcomes.map((outcome) => [outcome, 0])), ...a.outcomes }).map(([outcome, count]) => <div key={outcome}><div className="mb-1.5 flex justify-between text-xs"><span>{label(outcome)}</span><span className="tabular-nums">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-theme-bg"><div className="h-full rounded-full bg-theme-btn-accent" style={{ width: `${a.total_calls ? count / a.total_calls * 100 : 0}%` }} /></div></div>) : <p className="text-sm text-theme-label">Outcomes appear after your first call.</p>}</div></Disclosure>
      </div>
      <Disclosure title="Busiest hours"><p className="text-xs text-theme-label">Calls by hour · {data.business.timezone} · last {a.days} days</p><svg viewBox="0 0 640 190" role="img" aria-label={`Calls by hour in ${data.business.timezone}. Detailed values in table below.`} className="mt-6 h-48 w-full"><line x1="30" x2="630" y1="160" y2="160" stroke="var(--theme-border)" />{hourly.map((entry) => { const height = entry.calls / hourlyMax * 140; return <g key={entry.hour} tabIndex={0} aria-label={`${hourLabel(entry.hour)}: ${entry.calls} calls`} className="group outline-none"><title>{`${hourLabel(entry.hour)}: ${entry.calls} calls`}</title><rect x={30 + entry.hour * 25} y="15" width="25" height="150" fill="transparent" /><rect x={32 + entry.hour * 25} y={160 - height} width="21" height={height} rx="3" fill="var(--theme-btn-accent-hover)" className="group-hover:opacity-70 group-focus:opacity-60" /></g>; })}{[0, 6, 12, 18].map((hour) => <text key={hour} x={30 + hour * 25} y="184" fontSize="11" fill="var(--theme-label)">{hourLabel(hour)}</text>)}</svg><details className="mt-3 text-xs text-theme-label"><summary className="cursor-pointer">View hourly values</summary><div className="mt-3 max-h-48 overflow-y-auto"><table className="w-full text-left"><thead><tr><th scope="col" className="py-2">Hour</th><th scope="col">Calls</th></tr></thead><tbody>{hourly.map((entry) => <tr key={entry.hour}><td className="py-1">{hourLabel(entry.hour)}</td><td>{entry.calls}</td></tr>)}</tbody></table></div></details></Disclosure>
      <Disclosure title="Room for more conversations"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="mt-1 text-xs text-theme-label">{plan.name} plan · usage during the last {a.days} days</p></div><div className="w-full sm:max-w-sm"><div className="mb-2 flex justify-between gap-3 text-xs"><span>{a.minutes_used.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {plan.minutes.toLocaleString()} minutes</span><Link href={`/dashboard/${id}/billing`} className="font-semibold underline underline-offset-2">Manage plan</Link></div><progress aria-label={`Plan minutes used in last ${a.days} days`} max={plan.minutes} value={Math.min(a.minutes_used, plan.minutes)} className="h-2 w-full accent-[var(--theme-btn-accent)]" />{a.minutes_used > plan.minutes && <p className="mt-2 text-xs">{Math.round(a.minutes_used - plan.minutes)} minutes above plan allowance.</p>}</div></div></Disclosure>
      <Disclosure title="Recent calls"><div className="flex items-center justify-end gap-3"><Link href={`/dashboard/${id}/calls`} className="inline-flex items-center gap-1 text-xs font-medium">View all<ArrowUpRight size={14} aria-hidden="true" /></Link></div>{data.calls.length ? <ul className="mt-4 divide-y divide-theme-border">{data.calls.map((call) => <li key={call.id}><Link href={`/dashboard/${id}/calls?call=${encodeURIComponent(call.id)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg py-4 hover:bg-theme-bg"><div className="min-w-0"><p className="text-sm font-medium">{call.caller_name || call.caller_number || "Unknown caller"}</p><p className="mt-1 text-xs text-theme-label">{dateTime(call.started_at)} · {duration(call.duration_sec)}</p></div><OutcomeBadge outcome={call.outcome} /></Link></li>)}</ul> : <EmptyState title="No calls yet">Your latest conversations will appear here.</EmptyState>}</Disclosure>
    </>}
  </div>;
}

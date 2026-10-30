"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  PhoneForwarded,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api, PLANS } from "@/lib/api";
import {
  dateTime,
  Disclosure,
  duration,
  EmptyState,
  label,
  LoadState,
  OutcomeBadge,
  outcomes,
  useBusinessId,
  useResource,
} from "./ui";

export default function Overview() {
  const id = useBusinessId();
  const [days, setDays] = useState(30);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; calls: number } | null>(null);
  const [hoveredHour, setHoveredHour] = useState<{ hour: number; calls: number } | null>(null);

  const { data, loading, error, retry } = useResource(
    useCallback(async () => {
      const [business, analytics, calls] = await Promise.all([
        api.businesses.get(id),
        api.businesses.analytics(id, days),
        api.calls.list(id, { limit: 5 }),
      ]);
      return { business, analytics, calls };
    }, [id, days])
  );

  const [seeding, setSeeding] = useState(false);
  const seedPending = useRef(false);
  const [seedError, setSeedError] = useState("");

  async function seed() {
    if (seedPending.current) return;
    seedPending.current = true;
    setSeeding(true);
    setSeedError("");
    try {
      await api.businesses.seedDemo(id);
      retry();
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Could not load demo data.");
    } finally {
      seedPending.current = false;
      setSeeding(false);
    }
  }

  const a = data?.analytics;
  const plan = PLANS.find((p) => p.id === data?.business.plan) ?? PLANS[0];
  const max = Math.max(1, ...(a?.daily.map((day) => day.calls) ?? []));
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    calls: a?.hourly?.find((entry) => entry.hour === hour)?.calls ?? 0,
  }));
  const hourlyMax = Math.max(1, ...hourly.map((entry) => entry.calls));
  const hourLabel = (hour: number) => `${hour % 12 || 12}${hour < 12 ? "a" : "p"}`;

  const metrics = a
    ? [
        {
          name: "Total calls",
          value: a.total_calls.toLocaleString(),
          sub: `${a.days}-day window`,
          icon: PhoneCall,
        },
        {
          name: "Answer rate",
          value: `${a.total_calls ? Math.round((a.answered_calls / a.total_calls) * 100) : 0}%`,
          sub: `${a.answered_calls} answered`,
          icon: PhoneForwarded,
        },
        {
          name: "Minutes used",
          value: a.minutes_used.toLocaleString(undefined, { maximumFractionDigits: 1 }),
          sub: `${duration(Math.round(a.minutes_used * 60))} total time`,
          icon: Clock3,
        },
        {
          name: "Bookings created",
          value: a.bookings_count.toLocaleString(),
          sub: "Calendar events",
          icon: CalendarDays,
        },
        {
          name: "Leads & messages",
          value: (a.leads_count + a.messages_count).toLocaleString(),
          sub: `${a.leads_count} leads · ${a.messages_count} msgs`,
          icon: MessageSquare,
        },
        {
          name: "Spam blocked",
          value: a.spam_count.toLocaleString(),
          sub: "Filtered automatically",
          icon: ShieldCheck,
        },
      ]
    : [];

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
            Front desk overview
          </h1>
          <p className="mt-1 text-sm text-theme-label">
            Real-time call operations, automated bookings, and receptionist activity.
          </p>
        </div>

        {/* Date range segmented control */}
        <div
          className="inline-flex self-start rounded-lg border border-theme-border bg-theme-surface p-1 shadow-sm sm:self-auto"
          role="group"
          aria-label="Analytics date range"
        >
          {[7, 30, 90].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              aria-pressed={days === range}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                days === range
                  ? "bg-emerald-900 text-white shadow-sm dark:bg-emerald-800"
                  : "text-theme-label hover:text-theme-fg"
              }`}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={loading} error={error} retry={retry} hasData={data !== null} />

      {data && a && (
        <>
          {/* Zero state / demo seed callout */}
          {a.total_calls === 0 && (
            <section className="card border-dashed">
              <EmptyState
                title="Your front desk is ready for its first call"
                icon={PhoneCall}
              >
                <p>
                  Connect a phone number to start routing calls through your AI receptionist, or
                  load sample calls to preview analytics.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    className="btn-accent gap-2 disabled:opacity-50"
                    onClick={seed}
                    disabled={seeding}
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    {seeding ? "Loading demo data…" : "Load 40 demo calls"}
                  </button>
                  <Link href={`/dashboard/${id}/phone`} className="btn-secondary">
                    Connect phone line
                  </Link>
                </div>
                {seedError && (
                  <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">
                    {seedError}
                  </p>
                )}
              </EmptyState>
            </section>
          )}

          {/* Key Metrics Grid */}
          <section aria-label={`Key metrics for the last ${a.days} days`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.name}
                    className="card !p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-theme-label">
                        {metric.name}
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-theme-border/60 bg-theme-surface-muted/50 text-emerald-800 dark:text-emerald-400">
                        <Icon size={14} aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-theme-fg tabular-nums">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[11px] text-theme-label">{metric.sub}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Charts Row */}
          <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            {/* Daily call volume */}
            <Disclosure title="Daily conversations">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-3 text-xs text-theme-label">
                <span>
                  Calls per day · last {a.days} days
                  {hoveredDay && (
                    <strong className="ml-2 text-theme-fg">
                      ({hoveredDay.date}: {hoveredDay.calls} calls)
                    </strong>
                  )}
                </span>
                <span className="font-semibold tabular-nums text-theme-fg">
                  {a.total_calls} total
                </span>
              </div>

              <div className="relative mt-4">
                <svg
                  viewBox="0 0 640 180"
                  role="img"
                  aria-label={`Daily call volume for the last ${a.days} days. Maximum ${max} calls per day. Detailed values in the table below.`}
                  className="h-44 w-full overflow-visible"
                >
                  {/* Recessive gridlines */}
                  {[0, 0.5, 1].map((v) => (
                    <g key={v}>
                      <line
                        x1="32"
                        x2="635"
                        y1={140 - v * 120}
                        y2={140 - v * 120}
                        stroke="currentColor"
                        className="text-theme-border/60"
                        strokeDasharray={v === 0 ? undefined : "3 3"}
                      />
                      <text
                        x="24"
                        y={144 - v * 120}
                        textAnchor="end"
                        className="fill-theme-label text-[10px]"
                      >
                        {Math.round(max * v)}
                      </text>
                    </g>
                  ))}

                  {/* Bars - Emerald primary series */}
                  {a.daily.map((day, index) => {
                    const slot = 590 / Math.max(1, a.daily.length);
                    const h = (day.calls / max) * 120;
                    const isHovered = hoveredDay?.date === day.date;
                    return (
                      <g
                        key={day.date}
                        tabIndex={0}
                        aria-label={`${day.date}: ${day.calls} calls`}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={() => setHoveredDay(day)}
                        onBlur={() => setHoveredDay(null)}
                        className="group cursor-pointer outline-none"
                      >
                        <title>{`${day.date}: ${day.calls} calls`}</title>
                        <rect
                          x={34 + index * slot}
                          y="15"
                          width={slot}
                          height="130"
                          fill="transparent"
                        />
                        <rect
                          x={34 + index * slot + 1}
                          y={140 - h}
                          width={Math.max(2, slot - 3)}
                          height={Math.max(2, h)}
                          rx="2"
                          className={`transition-colors duration-150 ${
                            isHovered
                              ? "fill-emerald-800 dark:fill-emerald-400"
                              : "fill-emerald-600/80 hover:fill-emerald-700 dark:fill-emerald-500/80 dark:hover:fill-emerald-400"
                          }`}
                        />
                      </g>
                    );
                  })}

                  {/* Date labels at ends */}
                  {a.daily.length > 0 && (
                    <>
                      <text
                        x="34"
                        y="164"
                        className="fill-theme-label text-[11px]"
                      >
                        {a.daily[0].date}
                      </text>
                      <text
                        x="635"
                        y="164"
                        textAnchor="end"
                        className="fill-theme-label text-[11px]"
                      >
                        {a.daily[a.daily.length - 1].date}
                      </text>
                    </>
                  )}
                </svg>
              </div>

              <details className="mt-4 border-t border-theme-border/60 pt-3 text-xs text-theme-label">
                <summary className="cursor-pointer hover:text-theme-fg font-medium">
                  View daily table data
                </summary>
                <div className="mt-3 max-h-44 overflow-y-auto rounded-lg border border-theme-border bg-theme-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-theme-border bg-theme-surface-muted/50 font-semibold text-theme-fg">
                      <tr>
                        <th scope="col" className="px-3 py-2">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Calls
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border font-mono">
                      {a.daily.map((day) => (
                        <tr key={day.date} className="hover:bg-theme-surface-muted/30">
                          <td className="px-3 py-1.5">{day.date}</td>
                          <td className="px-3 py-1.5">{day.calls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Disclosure>

            {/* Conversation outcomes */}
            <Disclosure title="Conversation outcomes">
              <p className="border-b border-theme-border/60 pb-3 text-xs text-theme-label">
                Automatic resolution by the AI receptionist
              </p>
              <div className="mt-4 space-y-3">
                {Object.entries(a.outcomes).length ? (
                  Object.entries({
                    ...Object.fromEntries(outcomes.map((outcome) => [outcome, 0])),
                    ...a.outcomes,
                  }).map(([outcome, count]) => {
                    const pct = a.total_calls ? Math.round((count / a.total_calls) * 100) : 0;
                    return (
                      <div key={outcome} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <OutcomeBadge outcome={outcome} />
                          <span className="font-mono text-xs text-theme-label">
                            <strong className="text-theme-fg">{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-theme-surface-muted">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                            style={{
                              width: `${a.total_calls ? (count / a.total_calls) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-theme-label">
                    Outcomes will appear here after the first completed conversation.
                  </p>
                )}
              </div>
            </Disclosure>
          </div>

          {/* Busiest Hours & Plan Row */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Busiest Hours */}
            <Disclosure title="Call distribution by hour">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-3 text-xs text-theme-label">
                <span>
                  Hours in {data.business.timezone}
                  {hoveredHour && (
                    <strong className="ml-2 text-theme-fg">
                      ({hourLabel(hoveredHour.hour)}: {hoveredHour.calls} calls)
                    </strong>
                  )}
                </span>
                <span className="tabular-nums">24-hour distribution</span>
              </div>

              <div className="relative mt-4">
                <svg
                  viewBox="0 0 640 180"
                  role="img"
                  aria-label={`Calls by hour in ${data.business.timezone}. Detailed values in table below.`}
                  className="h-44 w-full overflow-visible"
                >
                  <line
                    x1="20"
                    x2="630"
                    y1={140}
                    y2={140}
                    stroke="currentColor"
                    className="text-theme-border/60"
                  />
                  {hourly.map((entry) => {
                    const height = (entry.calls / hourlyMax) * 120;
                    const isHovered = hoveredHour?.hour === entry.hour;
                    return (
                      <g
                        key={entry.hour}
                        tabIndex={0}
                        aria-label={`${hourLabel(entry.hour)}: ${entry.calls} calls`}
                        onMouseEnter={() => setHoveredHour(entry)}
                        onMouseLeave={() => setHoveredHour(null)}
                        onFocus={() => setHoveredHour(entry)}
                        onBlur={() => setHoveredHour(null)}
                        className="group cursor-pointer outline-none"
                      >
                        <title>{`${hourLabel(entry.hour)}: ${entry.calls} calls`}</title>
                        <rect
                          x={20 + entry.hour * 25}
                          y="15"
                          width="24"
                          height="130"
                          fill="transparent"
                        />
                        <rect
                          x={22 + entry.hour * 25}
                          y={140 - height}
                          width="20"
                          height={Math.max(2, height)}
                          rx="2"
                          className={`transition-colors duration-150 ${
                            isHovered
                              ? "fill-emerald-800 dark:fill-emerald-400"
                              : "fill-emerald-600/70 hover:fill-emerald-700 dark:fill-emerald-500/70 dark:hover:fill-emerald-400"
                          }`}
                        />
                      </g>
                    );
                  })}
                  {[0, 6, 12, 18, 23].map((hour) => (
                    <text
                      key={hour}
                      x={22 + hour * 25}
                      y="160"
                      className="fill-theme-label text-[10px]"
                    >
                      {hourLabel(hour)}
                    </text>
                  ))}
                </svg>
              </div>

              <details className="mt-4 border-t border-theme-border/60 pt-3 text-xs text-theme-label">
                <summary className="cursor-pointer hover:text-theme-fg font-medium">
                  View hourly table data
                </summary>
                <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-theme-border bg-theme-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-theme-border bg-theme-surface-muted/50 font-semibold text-theme-fg">
                      <tr>
                        <th scope="col" className="px-3 py-2">
                          Hour
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Calls
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border font-mono">
                      {hourly.map((entry) => (
                        <tr key={entry.hour} className="hover:bg-theme-surface-muted/30">
                          <td className="px-3 py-1.5">{hourLabel(entry.hour)}</td>
                          <td className="px-3 py-1.5">{entry.calls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Disclosure>

            {/* Plan Usage & Allowance */}
            <Disclosure title="Plan usage & allowance">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/60 pb-3">
                  <div>
                    <span className="text-sm font-semibold text-theme-fg">{plan.name} plan</span>
                    <span className="ml-2 rounded border border-theme-border bg-theme-surface-muted px-2 py-0.5 text-xs text-theme-label">
                      ${plan.price}/mo
                    </span>
                  </div>
                  <span className="text-xs text-theme-label font-mono">
                    Self-Hosted · Unlimited OSS
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-label">
                      {a.minutes_used.toLocaleString(undefined, { maximumFractionDigits: 1 })} of{" "}
                      {plan.minutes.toLocaleString()} included minutes
                    </span>
                    <span className="font-semibold text-theme-fg tabular-nums">
                      {Math.round((a.minutes_used / plan.minutes) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-theme-surface-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        a.minutes_used > plan.minutes
                          ? "bg-rose-500"
                          : "bg-emerald-700 dark:bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (a.minutes_used / plan.minutes) * 100)}%`,
                      }}
                    />
                  </div>
                  {a.minutes_used > plan.minutes ? (
                    <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                      <strong>Plan exceeded:</strong>{" "}
                      {Math.round(a.minutes_used - plan.minutes)} minutes billed at overage rate ($
                      {plan.overage.toFixed(2)}/min).
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-theme-label">
                      {Math.max(0, plan.minutes - a.minutes_used).toFixed(1)} minutes remaining in
                      current cycle.
                    </p>
                  )}
                </div>
              </div>
            </Disclosure>
          </div>

          {/* Recent Calls */}
          <Disclosure title="Recent conversations">
            <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
              <span className="text-xs text-theme-label">
                Latest calls handled by the receptionist
              </span>
              <Link
                href={`/dashboard/${id}/calls`}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 underline underline-offset-4"
              >
                View all call records
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {data.calls.length ? (
              <ul className="mt-2 divide-y divide-theme-border">
                {data.calls.map((call) => (
                  <li key={call.id}>
                    <Link
                      href={`/dashboard/${id}/calls?call=${encodeURIComponent(call.id)}`}
                      className="group flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-theme-surface-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-theme-fg group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                            {call.caller_name || call.caller_number || "Unknown caller"}
                          </p>
                          {call.caller_number && call.caller_name && (
                            <span className="font-mono text-xs text-theme-label">
                              {call.caller_number}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-theme-label">
                          {dateTime(call.started_at)} · {duration(call.duration_sec)} ·{" "}
                          {label(call.direction)}
                        </p>
                      </div>
                      <OutcomeBadge outcome={call.outcome} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No calls recorded yet" icon={PhoneCall}>
                Calls will appear here once your receptionist answers.
              </EmptyState>
            )}
          </Disclosure>
        </>
      )}
    </div>
  );
}

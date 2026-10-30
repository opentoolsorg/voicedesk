"use client";

import { useBusinessId } from "../ui";
import { useEffect, useState } from "react";
import { Check, CreditCard, Sparkles, Zap } from "lucide-react";
import { api, PLANS, type Analytics, type Business } from "@/lib/api";

export default function BillingPage() {
  const id = useBusinessId();
  const [business, setBusiness] = useState<Business | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);

  const plan = PLANS.find((item) => item.id === business?.plan);
  const minutes = analytics?.minutes_used ?? 0;
  const overage = plan ? Math.max(0, minutes - plan.minutes) * plan.overage : 0;

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    Promise.all([api.businesses.get(id), api.businesses.analytics(id, 30)])
      .then(([result, usage]) => {
        if (live) {
          setBusiness(result);
          setAnalytics(usage);
        }
      })
      .catch((err) => {
        if (live)
          setError(
            err instanceof Error ? err.message : "Could not load plan and usage."
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, retry]);

  async function switchPlan(next: string) {
    if (switching || !business) return;
    setSwitching(next);
    setError("");
    setNotice("");
    try {
      const result = await api.businesses.update(id, { plan: next });
      setBusiness(result);
      setNotice(
        `Switched to ${PLANS.find((item) => item.id === next)?.name}. Workspace updated.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not change plan. Your current plan is unchanged."
      );
    } finally {
      setSwitching("");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-theme-surface-muted animate-pulse" />
        <div className="h-44 rounded-xl border border-theme-border bg-theme-surface animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl border border-theme-border bg-theme-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!business || !analytics) {
    return (
      <div className="card space-y-3">
        <h1 className="text-xl font-bold tracking-tight text-theme-fg">
          Billing & plan unavailable
        </h1>
        <p role="alert" className="text-xs text-theme-label">
          {error || "No usage information available."}
        </p>
        <button
          type="button"
          className="btn-secondary !text-xs"
          onClick={() => setRetry(retry + 1)}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
          Plan & usage limits
        </h1>
        <p className="mt-1 text-sm text-theme-label">
          Track voice minutes, projected overage, and workspace tiers.
        </p>
      </div>

      {/* Demo Notice */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-950 dark:border-emerald-950/60 dark:bg-emerald-950/30 dark:text-emerald-200">
        <strong>Self-hosted / Demo workspace:</strong> Payments are not connected. Plan changes update your simulated allowance directly without requiring a credit card or billing invoice.
      </div>

      {/* Current Plan Overview Card */}
      <section className="card space-y-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-theme-border bg-theme-surface-muted text-emerald-800 dark:text-emerald-400">
              <CreditCard size={20} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-label">
                Active subscription
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
                {plan?.name || business.plan || "Standard Tier"}
              </p>
              <p className="mt-1 text-xs text-theme-label">
                {plan
                  ? `$${plan.price}/month · ${plan.minutes.toLocaleString()} included receptionist minutes`
                  : "Choose a plan below to assign minutes."}
              </p>
            </div>
          </div>

          {plan && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              Active Tier
            </span>
          )}
        </div>

        {/* Minutes Meter */}
        {plan && (
          <div className="border-t border-theme-border/60 pt-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-theme-label">
                Usage in 30-day rolling window
              </h3>
              <p className="text-xs font-mono font-medium text-theme-fg">
                <span className="font-bold">
                  {minutes.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>{" "}
                / {plan.minutes.toLocaleString()} min
              </p>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-theme-surface-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  minutes > plan.minutes ? "bg-rose-500" : "bg-emerald-800 dark:bg-emerald-700"
                }`}
                style={{ width: `${Math.min(100, (minutes / plan.minutes) * 100)}%` }}
              />
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-xs text-theme-label">
              <span>
                {minutes === 0
                  ? "No minutes consumed yet in this window."
                  : minutes > plan.minutes
                  ? `${(minutes - plan.minutes).toFixed(1)} minutes over plan limit`
                  : `${Math.max(0, plan.minutes - minutes).toFixed(1)} minutes remaining in plan`}
              </span>
              <span className="font-mono">Overage rate: ${plan.overage.toFixed(2)}/min</span>
            </div>

            {overage > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
                <strong>Projected overage cost:</strong>{" "}
                <span className="font-mono font-bold">${overage.toFixed(2)}</span>
                <p className="mt-1 text-[11px] opacity-90">
                  Estimated calculation based on billable minutes logged above standard plan allowance.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          {notice}
        </p>
      )}

      {/* Plan Cards Grid */}
      <section aria-labelledby="choose-plan" className="space-y-4">
        <div>
          <h2 id="choose-plan" className="text-lg font-semibold tracking-tight text-theme-fg">
            Available subscription tiers
          </h2>
          <p className="mt-1 text-xs text-theme-label">
            Scale minutes up or down as call volume increases.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((item) => {
            const current = item.id === business.plan;
            return (
              <article
                key={item.id}
                className={`card flex flex-col justify-between transition-all ${
                  current
                    ? "border-emerald-700/80 bg-emerald-50/20 shadow-md ring-1 ring-emerald-700/30 dark:border-emerald-700/60 dark:bg-emerald-950/20"
                    : "hover:border-theme-border-muted hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-theme-border/60 pb-3">
                    <h3 className="font-semibold text-theme-fg">{item.name}</h3>
                    {current && (
                      <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-3xl font-extrabold tracking-tight text-theme-fg">
                    ${item.price}
                    <span className="text-xs font-normal text-theme-label tracking-normal">
                      {" "}
                      / month
                    </span>
                  </p>

                  <ul className="my-5 space-y-2.5 text-xs text-theme-label">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-800 dark:text-emerald-400 shrink-0" />
                      <span>
                        <strong className="text-theme-fg">
                          {item.minutes.toLocaleString()}
                        </strong>{" "}
                        minutes included
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-800 dark:text-emerald-400 shrink-0" />
                      <span>
                        <strong className="text-theme-fg">${item.overage.toFixed(2)}</strong> per
                        extra minute
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-800 dark:text-emerald-400 shrink-0" />
                      <span>AI receptionist & transcript history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-800 dark:text-emerald-400 shrink-0" />
                      <span>Full voice tools & appointment booking</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={current || Boolean(switching)}
                  className={`w-full !text-xs !py-2 ${
                    current ? "btn-secondary opacity-60" : "btn-primary"
                  } disabled:opacity-50`}
                  onClick={() => switchPlan(item.id)}
                >
                  {switching === item.id
                    ? "Updating tier…"
                    : current
                    ? "Current tier active"
                    : `Switch to ${item.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

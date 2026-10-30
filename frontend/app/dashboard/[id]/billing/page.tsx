"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
import { api, PLANS, type Analytics, type Business } from "@/lib/api";

export default function BillingPage() {
  const id = usePathname().split("/")[2];
  const [business, setBusiness] = useState<Business | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const plan = PLANS.find(item => item.id === business?.plan);
  const minutes = analytics?.minutes_used ?? 0;
  const overage = plan ? Math.max(0, minutes - plan.minutes) * plan.overage : 0;

  useEffect(() => {
    let live = true; setLoading(true); setError("");
    Promise.all([api.businesses.get(id), api.businesses.analytics(id, 30)]).then(([result, usage]) => { if (live) { setBusiness(result); setAnalytics(usage); } }).catch(err => { if (live) setError(err instanceof Error ? err.message : "Could not load plan and usage."); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id, retry]);

  async function switchPlan(next: string) {
    if (switching || !business) return;
    setSwitching(next); setError(""); setNotice("");
    try { const result = await api.businesses.update(id, { plan: next }); setBusiness(result); setNotice(`Switched to ${PLANS.find(item => item.id === next)?.name}. No payment was taken.`); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not change plan. Your current plan is unchanged."); }
    finally { setSwitching(""); }
  }

  if (loading) return <div className="card animate-pulse" role="status">Loading plan and usage…</div>;
  if (!business || !analytics) return <div className="card space-y-3"><h1 className="text-xl font-semibold">Billing unavailable</h1><p role="alert" className="text-sm text-theme-label">{error || "No usage information available."}</p><button className="btn-secondary" onClick={() => setRetry(retry + 1)}>Try again</button></div>;

  return <div className="max-w-6xl space-y-7"><header><p className="text-xs font-semibold uppercase tracking-widest text-theme-label">Room to grow</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Plan & usage</h1><p className="mt-2 text-sm text-theme-label">Understand your minutes and choose the right fit for your business.</p></header>
    <div className="rounded-xl border border-theme-border-muted bg-theme-surface-muted px-5 py-4 text-sm leading-6"><strong>Demo billing.</strong> Payments are not connected. Switching plans updates this workspace only; no card is required and no payment is collected.</div>
    <section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-sm font-medium text-theme-label">Current plan</h2><p className="mt-2 text-3xl font-semibold tracking-tight">{plan?.name || business.plan || "No plan selected"}</p><p className="mt-2 text-sm text-theme-label">{plan ? `$${plan.price}/month · ${plan.minutes.toLocaleString()} included minutes` : "Choose a supported plan below to see its allowance."}</p></div><CreditCard size={25} className="text-theme-label" /></div>
      <div className="mt-7 border-t border-theme-border pt-6"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">Minutes used · last 30 days</h3><p className="text-sm tabular-nums">{minutes.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {plan?.minutes.toLocaleString() || "—"} min</p></div>{plan && <><progress aria-label="Included minutes used in the last 30 days" className="mt-3 h-3 w-full overflow-hidden rounded-full accent-violet-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-theme-surface-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-theme-btn-accent" max={plan.minutes} value={Math.min(minutes, plan.minutes)} /><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-theme-label"><p>{minutes === 0 ? "No call minutes yet. Usage will appear after your first call." : minutes > plan.minutes ? `${(minutes - plan.minutes).toLocaleString(undefined, { maximumFractionDigits: 1 })} minutes above allowance` : `${Math.max(0, plan.minutes - minutes).toLocaleString(undefined, { maximumFractionDigits: 1 })} included minutes remaining`}</p><p>Overage rate: ${plan.overage.toFixed(2)}/min</p></div><p className="mt-5 text-sm">Projected overage cost: <strong className="tabular-nums">${overage.toFixed(2)}</strong></p><p className="mt-1 text-xs leading-5 text-theme-label">Estimate based on minutes already used above your allowance in this rolling 30-day window, not a future-usage forecast or invoice.</p></>}</div>
    </section>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-theme-label">{notice}</p>}
    <section aria-labelledby="choose-plan"><h2 id="choose-plan" className="mb-4 text-xl font-semibold tracking-tight">Find your fit</h2><div className="grid gap-4 lg:grid-cols-3">{PLANS.map(item => { const current = item.id === business.plan; return <article key={item.id} className={`card flex flex-col ${current ? "!border-theme-border-muted !bg-theme-surface-muted" : ""}`}><div className="flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">{item.name}</h3>{current && <span className="rounded-full border border-theme-border-muted px-2 py-1 text-xs font-semibold">Current plan</span>}</div><p className="mt-5 text-4xl font-semibold tracking-tight">${item.price}<span className="text-sm font-normal tracking-normal text-theme-label"> / month</span></p><ul className="my-6 space-y-3 text-sm text-theme-label"><li className="flex items-center gap-2"><Check size={15} />{item.minutes.toLocaleString()} minutes included</li><li className="flex items-center gap-2"><Check size={15} />${item.overage.toFixed(2)} per extra minute</li><li className="flex items-center gap-2"><Check size={15} />AI receptionist & call history</li></ul><button type="button" disabled={current || Boolean(switching)} className={`${current ? "btn-secondary" : "btn-primary"} mt-auto w-full disabled:opacity-50`} onClick={() => switchPlan(item.id)}>{switching === item.id ? "Switching…" : current ? "Your current plan" : `Switch to ${item.name}`}</button></article>; })}</div></section>
  </div>;
}

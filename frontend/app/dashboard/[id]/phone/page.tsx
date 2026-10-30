"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, Phone, ArrowUpRight } from "lucide-react";
import { api, type Business } from "@/lib/api";

export default function PhonePage() {
  const id = usePathname().split("/")[2];
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [areaCode, setAreaCode] = useState("415");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState("conditional");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true; setLoading(true); setError("");
    api.businesses.get(id).then(result => { if (live) setBusiness(result); }).catch(err => { if (live) setError(err instanceof Error ? err.message : "Could not load phone details."); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id, retry]);

  async function provision(event: React.FormEvent) {
    event.preventDefault(); if (busy || !business) return;
    if (!/^\d{3}$/.test(areaCode)) { setError("Enter a three-digit area code."); return; }
    setBusy(true); setError("");
    try { const result = await api.businesses.provision(id, areaCode); setBusiness({ ...business, phone_number: result.phone_number, telephony_provider: result.provider }); }
    catch (err) { setError(`${err instanceof Error ? err.message : "Number provisioning is unavailable."} Check telephony configuration and try again.`); }
    finally { setBusy(false); }
  }
  async function copy() {
    if (!business?.phone_number) return;
    try { await navigator.clipboard.writeText(business.phone_number); setCopied(true); }
    catch { setError("Clipboard unavailable. Select and copy the number manually."); }
  }

  if (loading) return <div className="card animate-pulse" role="status">Loading your phone connection…</div>;
  if (!business) return <div className="card space-y-3"><h1 className="text-xl font-semibold">Phone connection unavailable</h1><p role="alert" className="text-sm text-theme-label">{error || "Business not found."}</p><button className="btn-secondary" onClick={() => setRetry(retry + 1)}>Try again</button></div>;

  return <div className="max-w-5xl space-y-7"><header><p className="text-xs font-semibold uppercase tracking-widest text-theme-label">Ready for the ring</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Phone connection</h1><p className="mt-2 text-sm text-theme-label">A dedicated line, or the number your customers already know.</p></header>
    <section className="card"><div className="flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex rounded-xl bg-theme-surface-muted p-3"><Phone size={22} /></span><h2 className="mt-5 text-sm text-theme-label">Your receptionist’s number</h2><p className="mt-2 break-all text-3xl font-semibold tracking-tight">{business.phone_number || "No number connected"}</p><p className="mt-3 text-sm text-theme-label">Provider: {business.telephony_provider || "Not configured"}</p></div>{business.phone_number && <button type="button" className="btn-secondary" onClick={copy}><Copy size={15} className="mr-2" />{copied ? "Copied" : "Copy number"}</button>}</div><p role="status" className="mt-3 text-xs text-theme-label">{copied ? "Number copied to clipboard." : !business.phone_number ? "Provision a number below to start receiving calls." : "Call this number from another phone to verify your agent answers."}</p></section>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!business.phone_number && <form onSubmit={provision} className="card space-y-4" aria-busy={busy}><h2 className="text-xl font-semibold tracking-tight">Get a new number</h2><p className="text-sm leading-6 text-theme-label">Choose a preferred US area code. Availability depends on your telephony provider; provider charges may apply.</p><div className="flex flex-wrap items-end gap-3"><label className="block text-sm font-medium">Area code<input className="input mt-2 max-w-40" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} value={areaCode} onChange={event => setAreaCode(event.target.value)} disabled={busy} required /></label><button type="submit" className="btn-primary disabled:opacity-50" disabled={busy}>{busy ? "Provisioning…" : "Provision number"}</button></div><p className="text-xs text-theme-label">Telephony not configured? Your workspace and test chat still work.</p></form>}
    <section className="card space-y-5"><div><h2 className="text-xl font-semibold tracking-tight">Keep your existing number</h2><p className="mt-2 text-sm leading-6 text-theme-label">Forward calls to your VoiceDesk number. These are generic examples, not carrier-specific instructions. Check with your carrier first.</p></div>
      <div role="tablist" aria-label="Forwarding method" className="flex flex-wrap gap-2">{[["conditional", "Unanswered calls"], ["all", "All calls"]].map(([key, label]) => <button key={key} type="button" role="tab" id={`forward-tab-${key}`} aria-selected={mode === key} tabIndex={mode === key ? 0 : -1} aria-controls={`forward-panel-${key}`} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? "conditional" : event.key === "End" ? "all" : mode === "conditional" ? "all" : "conditional"; setMode(next); document.getElementById(`forward-tab-${next}`)?.focus(); } }} className={mode === key ? "btn-primary" : "btn-secondary"} onClick={() => setMode(key)}>{label}</button>)}</div>
      <div role="tabpanel" id={`forward-panel-${mode}`} aria-labelledby={`forward-tab-${mode}`} className="rounded-xl border border-theme-border bg-theme-bg p-5"><h3 className="font-semibold">{mode === "conditional" ? "Let your team answer first" : "Send every call to your agent"}</h3><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-theme-label"><li>{business.phone_number ? <>Use <strong className="text-theme-fg">{business.phone_number}</strong> as the destination.</> : "Provision a VoiceDesk destination number above."}</li><li>{mode === "conditional" ? <>Some carriers use <code className="text-theme-fg">*61*destination#</code> or <code className="text-theme-fg">**61*destination#</code> for unanswered calls. Busy and unreachable forwarding may use different codes.</> : <>Some carriers use <code className="text-theme-fg">*72</code> followed by the destination number. Other carriers require an app or account setting.</>}</li><li>Ask your carrier for the exact activation and cancellation steps, then test from another phone.</li></ol></div><p className="flex items-start gap-2 text-xs leading-6 text-theme-label"><ArrowUpRight size={15} className="mt-1 shrink-0" />Do not dial these examples without confirming carrier support. Forwarding may incur carrier charges.</p>
    </section>
  </div>;
}

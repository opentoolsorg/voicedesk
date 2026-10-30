"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowClockwise, Check, Graph, MicrophoneStage, Phone, PhoneCall, WarningCircle } from "@phosphor-icons/react";
import { api, type Business, type Call } from "@/lib/api";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";
const button = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-50 ${focus}`;
const VERTICAL_LABELS: Record<string, string> = { salon: "Salon", restaurant: "Restaurant", repair: "Repair shop", general: "General business" };
const STATUS_STYLES: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  missed: "border-amber-200 bg-amber-50 text-amber-900",
  failed: "border-red-200 bg-red-50 text-red-800",
};

function duration(seconds: number | null) {
  if (seconds == null) return "Not recorded";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export default function BusinessDetail() {
  // Static export ships one "_" shell for every id, so read the real id from the URL.
  const id = usePathname().split("/")[2];
  const [biz, setBiz] = useState<Business | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [areaCode, setAreaCode] = useState("415");
  const [error, setError] = useState("");
  const [provisionError, setProvisionError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const provisionPending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setProvisionError("");
    Promise.all([api.businesses.get(id), api.calls.list(id)])
      .then(([business, callLog]) => {
        if (cancelled) return;
        setBiz(business);
        setCalls(callLog);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this workspace.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, refresh]);

  async function provision() {
    if (provisionPending.current) return;
    provisionPending.current = true;
    setProvisioning(true);
    setProvisionError("");
    try {
      const result = await api.businesses.provision(id, areaCode);
      setBiz((current) => current ? { ...current, phone_number: result.phone_number, telephony_provider: result.provider } : current);
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : "Could not provision a phone number. Please try again.");
    } finally {
      provisionPending.current = false;
      setProvisioning(false);
    }
  }

  const callStats = useMemo(() => ({
    total: calls.length,
    completed: calls.filter((call) => call.status === "completed").length,
    missed: calls.filter((call) => call.status === "missed" || call.status === "failed").length,
  }), [calls]);
  const exotel = biz?.telephony_provider === "exotel";

  return (
    <div className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif]">
      <header className="border-b border-zinc-200 bg-white">
        <nav aria-label="Business navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className={`flex items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight ${focus}`}><span className="rounded-lg bg-emerald-900 p-2 text-emerald-100"><MicrophoneStage aria-hidden="true" size={18} weight="fill" /></span>VoiceDesk</Link>
          <Link href="/dashboard" className={`inline-flex min-h-10 items-center gap-2 rounded-sm text-xs text-zinc-600 hover:text-emerald-800 ${focus}`}><ArrowLeft aria-hidden="true" size={15} />All businesses</Link>
        </nav>
      </header>
      <main aria-busy={loading} className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        {loading ? (
          <div role="status" aria-label="Loading workspace" className="space-y-6"><span className="sr-only">Loading workspace…</span><div className="h-32 rounded-xl bg-zinc-200/60 motion-safe:animate-pulse" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-72 rounded-xl border border-zinc-200 bg-white motion-safe:animate-pulse" /><div className="h-72 rounded-xl border border-zinc-200 bg-white motion-safe:animate-pulse" /></div></div>
        ) : error || !biz ? (
          <section aria-labelledby="load-error-title" className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-7"><WarningCircle aria-hidden="true" size={28} className="text-amber-700" /><h1 id="load-error-title" className="mt-4 text-xl font-medium">Workspace unavailable</h1><p role="alert" className="mt-3 break-words text-sm leading-6 text-zinc-600">{error || "This business could not be found."}</p><button onClick={() => setRefresh((value) => value + 1)} className={`${button} mt-6 bg-emerald-900 text-white hover:bg-emerald-800`}><ArrowClockwise aria-hidden="true" size={16} />Try again</button></section>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="min-w-0"><p className="text-xs font-medium text-emerald-800">Business workspace · {VERTICAL_LABELS[biz.vertical] ?? biz.vertical}</p><h1 className="mt-3 break-words text-3xl font-medium tracking-[-0.045em] sm:text-4xl">{biz.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Configure the conversation, connect a phone number, and review recorded activity.</p></div>
              <Link href={`/dashboard/${biz.id}/flow`} className={`${button} shrink-0 self-start bg-emerald-900 text-white hover:bg-emerald-800`}><Graph aria-hidden="true" size={18} />Open flow editor<ArrowRight aria-hidden="true" size={15} /></Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs"><span className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${biz.active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-300 bg-white text-zinc-600"}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${biz.active ? "bg-emerald-700" : "bg-zinc-500"}`} />{biz.active ? "Active configuration" : "Paused"}</span><span className="text-zinc-600">{biz.phone_number ? "Phone number assigned" : "No phone number connected"}</span></div>

            <section aria-label="Recent call metrics" className="mt-7 grid divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[{ label: "Recent call records", value: callStats.total }, { label: "Completed", value: callStats.completed }, { label: "Missed / failed", value: callStats.missed }].map((metric) => <div key={metric.label} className="px-6 py-5"><p className="text-xs text-zinc-600">{metric.label}</p><p className="mt-2 text-3xl font-medium tabular-nums" aria-label={`${metric.label}: ${metric.value}`}>{metric.value}</p><p className="mt-2 text-[11px] text-zinc-600">From this business’s latest API records</p></div>)}
            </section>

            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <section aria-labelledby="phone-title" className="min-w-0 rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-5"><h2 id="phone-title" className="text-lg font-medium tracking-tight">Phone connection</h2><Phone aria-hidden="true" size={20} className="text-emerald-800" /></div>
                <div className="p-5 sm:p-6">
                  {biz.phone_number ? (
                    <div role="status"><p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800"><Check aria-hidden="true" size={16} />Number assigned</p><p className="mt-4 break-all font-mono text-2xl font-medium tracking-tight">{biz.phone_number}</p><p className="mt-3 text-sm text-zinc-600">Provider: {exotel ? "Exotel" : "Twilio"}</p><p className="mt-5 border-t border-zinc-200 pt-4 text-xs leading-6 text-zinc-600">Review your provider and agent configuration before testing inbound calls. An assigned number alone does not verify end-to-end readiness.</p></div>
                  ) : (
                    <form onSubmit={(event) => { event.preventDefault(); void provision(); }} aria-busy={provisioning}>
                      <p className="text-sm font-medium">{exotel ? "Attach your Exotel number" : "Provision a Twilio number"}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{exotel ? "Use the trial ExoPhone configured in your backend environment." : "Choose a 3-digit area code to request a dedicated number for this business."}</p>
                      {exotel ? <p className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-6 text-zinc-600"><code className="break-all font-mono text-zinc-800">EXOTEL_CALLER_ID</code> must be configured before provisioning. An area code is not needed.</p> : <div className="mt-5"><label htmlFor="area-code" className="mb-2 block text-sm font-medium">Area code</label><input id="area-code" name="area-code" inputMode="numeric" autoComplete="off" pattern="[0-9]{3}" required maxLength={3} value={areaCode} onChange={(event) => setAreaCode(event.target.value.replace(/\D/g, "").slice(0, 3))} disabled={provisioning} aria-describedby="area-code-hint" className="min-h-12 w-full rounded-lg border border-zinc-300 px-3.5 py-3 font-mono text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-zinc-50" /><p id="area-code-hint" className="mt-2 text-xs leading-5 text-zinc-600">Three digits, such as 415, 212, or 305.</p></div>}
                      <button type="submit" disabled={provisioning || (!exotel && areaCode.length !== 3)} className={`${button} mt-5 w-full bg-zinc-900 text-white hover:bg-emerald-900`}>{provisioning ? "Provisioning…" : exotel ? "Attach Exotel number" : "Provision Twilio number"}</button>
                      <p role="status" className="mt-3 text-xs leading-6 text-zinc-600">{provisioning ? "Waiting for your telephony provider. Please keep this page open." : "Uses your configured provider account. Provider availability and charges may apply."}</p>
                    </form>
                  )}
                  {provisionError && <div role="alert" className="mt-4 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><p className="font-medium">Could not assign a number.</p><p>{provisionError}</p><p className="mt-2 text-xs">Check your provider configuration and try again.</p></div>}
                </div>
              </section>

              <section aria-labelledby="calls-title" className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-5"><div><h2 id="calls-title" className="text-lg font-medium tracking-tight">Call history</h2><p className="mt-1 text-xs leading-5 text-zinc-600">Latest API records · up to 50 calls · not a live stream</p></div><PhoneCall aria-hidden="true" size={20} className="shrink-0 text-emerald-800" /></div>
                {calls.length === 0 ? <div className="px-6 py-10"><PhoneCall aria-hidden="true" size={28} className="text-zinc-500" /><h3 className="mt-4 font-medium">No calls recorded yet.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">Connect your phone number and configure the agent’s call flow. Recorded calls will appear here after the API logs them.</p><Link href={`/dashboard/${biz.id}/flow`} className={`${button} mt-5 border border-zinc-300 text-zinc-800 hover:bg-zinc-50`}>Configure the flow<ArrowRight aria-hidden="true" size={15} /></Link></div> : <ul className="divide-y divide-zinc-100">{calls.map((call) => <li key={call.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-mono text-sm font-medium">{call.caller_number ?? "Unknown caller"}</p><p className="mt-2 text-xs tabular-nums text-zinc-600">{formatDate(call.started_at)}</p></div><span className={`rounded-md border px-2 py-1 text-[11px] capitalize ${STATUS_STYLES[call.status] ?? "border-zinc-200 bg-zinc-50 text-zinc-700"}`}>{call.status.replaceAll("_", " ")}</span></div><p className="mt-3 font-mono text-xs tabular-nums text-zinc-600">Duration {duration(call.duration_sec)}</p>{call.outcome && <p className="mt-2 break-words text-xs leading-6 text-zinc-600">{call.outcome}</p>}</li>)}</ul>}
              </section>
            </div>
            <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-zinc-200 pt-5 text-xs leading-6 text-zinc-600"><p>VoiceDesk · Your infrastructure, your configuration.</p><p>Refresh the page to load the latest call activity.</p></footer>
          </>
        )}
      </main>
    </div>
  );
}

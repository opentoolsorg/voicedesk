"use client";

import { useBusinessId } from "../ui";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Info,
  Phone,
  PhoneCall,
  PhoneForwarded,
  Radio,
  Server,
  Sparkles,
} from "lucide-react";
import { api, type Business } from "@/lib/api";

export default function PhonePage() {
  const id = useBusinessId();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [areaCode, setAreaCode] = useState("415");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState("conditional");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    api.businesses
      .get(id)
      .then((result) => {
        if (live) setBusiness(result);
      })
      .catch((err) => {
        if (live)
          setError(
            err instanceof Error ? err.message : "Could not load phone details."
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, retry]);

  async function provision(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !business) return;
    if (!/^\d{3}$/.test(areaCode)) {
      setError("Enter a three-digit area code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api.businesses.provision(id, areaCode);
      setBusiness({
        ...business,
        phone_number: result.phone_number,
        telephony_provider: result.provider,
      });
    } catch (err) {
      setError(
        `${
          err instanceof Error ? err.message : "Number provisioning is unavailable."
        } Check telephony configuration and try again.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!business?.phone_number) return;
    try {
      await navigator.clipboard.writeText(business.phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard unavailable. Select and copy the number manually.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 rounded bg-theme-surface-muted animate-pulse" />
        <div className="h-44 rounded-xl border border-theme-border bg-theme-surface animate-pulse" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="card space-y-3">
        <h1 className="text-xl font-bold tracking-tight text-theme-fg">
          Phone connection unavailable
        </h1>
        <p role="alert" className="text-xs text-theme-label">
          {error || "Business not found."}
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
    <div className="max-w-4xl space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
          Phone line & routing
        </h1>
        <p className="mt-1 text-sm text-theme-label">
          Connect a dedicated phone line or forward inbound calls from your existing carrier.
        </p>
      </div>

      {/* Current Active Number Card */}
      <section className="card space-y-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-950/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Phone size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-label">
                Assigned receptionist number
              </span>
              <p className="mt-1 break-all font-mono text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
                {business.phone_number || "No number provisioned"}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-theme-label">
                <Server size={13} aria-hidden="true" />
                <span>
                  Provider:{" "}
                  <strong className="text-theme-fg">
                    {business.telephony_provider || "Not connected"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {business.phone_number && (
            <button
              type="button"
              className="btn-secondary gap-1.5 !text-xs"
              onClick={copy}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden="true" />
                  Copy number
                </>
              )}
            </button>
          )}
        </div>

        <p role="status" className="border-t border-theme-border/60 pt-3 text-xs text-theme-label">
          {copied
            ? "Phone number copied to clipboard."
            : !business.phone_number
            ? "Provision a dedicated number below to receive calls directly."
            : "Direct incoming calls to this number will be answered automatically by your AI receptionist."}
        </p>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Provision Form (if no number yet) */}
      {!business.phone_number && (
        <form onSubmit={provision} className="card space-y-4 shadow-sm" aria-busy={busy}>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-theme-fg">
              Get a new dedicated number
            </h2>
            <p className="mt-1 text-xs text-theme-label leading-relaxed">
              Select a 3-digit US area code. Instant line activation through your connected telephony provider.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Preferred US Area Code</label>
              <input
                className="input max-w-36 font-mono text-center text-base"
                inputMode="numeric"
                pattern="[0-9]{3}"
                maxLength={3}
                value={areaCode}
                onChange={(event) => setAreaCode(event.target.value)}
                disabled={busy}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary gap-1.5 disabled:opacity-50"
              disabled={busy}
            >
              <Sparkles size={14} aria-hidden="true" />
              {busy ? "Provisioning line…" : "Provision number"}
            </button>
          </div>

          <p className="text-[11px] text-theme-label">
            If telephony credentials are not yet configured in your deployment environment, you can still test full agent responses on the Agent page.
          </p>
        </form>
      )}

      {/* Call Forwarding Guidance */}
      <section className="card space-y-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-theme-fg">
            Forward calls from your current carrier
          </h2>
          <p className="mt-1 text-xs text-theme-label leading-relaxed">
            Keep your existing business phone number and automatically divert calls to VoiceDesk when busy, unreachable, or outside business hours.
          </p>
        </div>

        {/* Tab Selection */}
        <div
          role="tablist"
          aria-label="Forwarding method"
          className="inline-flex rounded-lg border border-theme-border bg-theme-surface-muted/50 p-1"
        >
          {[
            ["conditional", "Conditional forwarding (After-hours / Unanswered)"],
            ["all", "Full forwarding (All incoming calls)"],
          ].map(([key, tabLabel]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`forward-tab-${key}`}
              aria-selected={mode === key}
              tabIndex={mode === key ? 0 : -1}
              aria-controls={`forward-panel-${key}`}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "conditional"
                      : event.key === "End"
                      ? "all"
                      : mode === "conditional"
                      ? "all"
                      : "conditional";
                  setMode(next);
                  document.getElementById(`forward-tab-${next}`)?.focus();
                }
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mode === key
                  ? "bg-theme-surface text-theme-fg shadow-sm font-semibold"
                  : "text-theme-label hover:text-theme-fg"
              }`}
              onClick={() => setMode(key)}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          id={`forward-panel-${mode}`}
          aria-labelledby={`forward-tab-${mode}`}
          className="rounded-xl border border-theme-border bg-theme-surface-muted/30 p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-theme-fg flex items-center gap-2">
            <PhoneForwarded size={15} className="text-emerald-800 dark:text-emerald-400" />
            {mode === "conditional"
              ? "Let your staff answer first, with AI as instant backup"
              : "Divert all calls directly to the AI receptionist"}
          </h3>

          <ol className="list-decimal space-y-2.5 pl-4 text-xs leading-relaxed text-theme-label">
            <li>
              Set the destination to{" "}
              {business.phone_number ? (
                <strong className="font-mono text-theme-fg">{business.phone_number}</strong>
              ) : (
                <span className="italic font-medium text-amber-600 dark:text-amber-400">
                  (provision a number above first)
                </span>
              )}
              .
            </li>
            <li>
              {mode === "conditional" ? (
                <span>
                  Most US carriers use dial code{" "}
                  <code className="rounded bg-theme-surface px-1.5 py-0.5 font-mono text-theme-fg border border-theme-border">
                    *61*{business.phone_number || "number"}#
                  </code>{" "}
                  for unanswered calls, or{" "}
                  <code className="rounded bg-theme-surface px-1.5 py-0.5 font-mono text-theme-fg border border-theme-border">
                    *62*
                  </code>{" "}
                  for unreachable calls.
                </span>
              ) : (
                <span>
                  Immediate unconditional forward commonly uses dial code{" "}
                  <code className="rounded bg-theme-surface px-1.5 py-0.5 font-mono text-theme-fg border border-theme-border">
                    *72{business.phone_number || "number"}
                  </code>{" "}
                  or can be turned on inside your carrier portal app.
                </span>
              )}
            </li>
            <li>
              Place a test call from another mobile phone to confirm the greeting triggers smoothly.
            </li>
          </ol>
        </div>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-theme-label">
          <Info size={14} className="mt-0.5 shrink-0 text-emerald-700" />
          Carrier codes and network behavior can differ by carrier and plan. Please verify forwarding dial codes with your carrier support.
        </p>
      </section>
    </div>
  );
}

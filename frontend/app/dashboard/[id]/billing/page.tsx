"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { useBusinessId } from "../ui";

export default function BillingPage() {
  const id = useBusinessId();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-theme-border/60 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-mono">
            Open-Source Architecture
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-theme-fg">
            Self-Hosted License & Usage
          </h1>
          <p className="mt-1.5 text-xs text-theme-label">
            VoiceDesk is free, open-source software licensed under the MIT License.
          </p>
        </div>
        <Link
          href={`/dashboard/${id}`}
          className="btn-secondary !text-xs !py-2"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Overview
        </Link>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-800/40 dark:bg-emerald-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white dark:bg-emerald-800">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-emerald-950 dark:text-emerald-200">
              Zero SaaS Subscriptions · Unlimited Workspaces
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-300/80">
              Because you are running the self-hosted VoiceDesk platform, there are no seat licenses, per-workspace subscription fees, or hosted platform markups. You only pay directly for your own underlying carrier (Twilio/Exotel) and model provider (OpenAI/Sarvam/Cartesia) API usage.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card !p-5">
          <span className="text-xs font-semibold text-theme-label">License</span>
          <p className="mt-2 text-xl font-bold text-theme-fg">MIT Open Source</p>
          <p className="mt-1 text-xs text-theme-label">Free for commercial and private deployments</p>
        </div>
        <div className="card !p-5">
          <span className="text-xs font-semibold text-theme-label">Workspaces</span>
          <p className="mt-2 text-xl font-bold text-theme-fg">Unlimited</p>
          <p className="mt-1 text-xs text-theme-label">Create as many client businesses as you need</p>
        </div>
        <div className="card !p-5">
          <span className="text-xs font-semibold text-theme-label">Database</span>
          <p className="mt-2 text-xl font-bold text-theme-fg">Cloudflare D1 / SQLite</p>
          <p className="mt-1 text-xs text-theme-label">Your database, hosted directly in your Cloudflare account</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-theme-fg">Carrier & Provider Invoicing</h3>
        <p className="text-xs leading-relaxed text-theme-label">
          Telephony and voice synthesis providers bill to your accounts directly:
        </p>
        <ul className="space-y-2 text-xs text-theme-label">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span><strong>Twilio / Exotel</strong>: Billed directly per phone minute and assigned telephone number.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span><strong>OpenAI / Claude / Sarvam</strong>: Billed per token for conversation reasoning and tool calls.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span><strong>Deepgram / Cartesia</strong>: Billed per minute for streaming speech-to-text and voice generation.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

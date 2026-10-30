"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  Mic,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import AgentFields, {
  DEFAULT_AGENT,
  DAYS,
  DAY_LABELS,
  agentPayload,
  type AgentDraft,
} from "../components/AgentFields";
import TestChat from "../components/TestChat";

const STEPS = ["Business profile", "Knowledge base", "Call handling", "Phone & test"];

const VERTICAL_PRESETS: Record<
  string,
  {
    label: string;
    agent: string;
    greeting: string;
    services: string;
    faq: Array<{ question: string; answer: string }>;
  }
> = {
  dental: {
    label: "Dental Clinic",
    agent: "Aria",
    greeting:
      "Thanks for calling Northline Dental! I can schedule routine cleanings, emergency exams, or verify insurance coverage. How can I help today?",
    services:
      "Dental Cleaning (60 min)\nEmergency Toothache Exam (30 min)\nTeeth Whitening Consultation (45 min)",
    faq: [
      {
        question: "Do you accept Delta Dental and Cigna PPO?",
        answer: "Yes, we are in-network with Delta Dental PPO, Cigna, and MetLife.",
      },
      {
        question: "Where are you located and where do I park?",
        answer:
          "We are at 450 Sutter St, Suite 800. Free validated parking is available behind the building.",
      },
    ],
  },
  restaurant: {
    label: "Restaurant & Bar",
    agent: "Bella",
    greeting:
      "Good afternoon, Osteria Bella! I can book your dining table, share today's chef specials, or take private event inquiries.",
    services:
      "Dinner Reservation (90 min)\nPrivate Dining Booking (120 min)\nChef Tasting Table (120 min)",
    faq: [
      {
        question: "Do you have gluten-free or vegan options?",
        answer:
          "Yes! Our kitchen offers dedicated gluten-free pasta and a seasonal vegan tasting menu.",
      },
      {
        question: "What is your corkage fee?",
        answer: "Our corkage fee is $35 per 750ml bottle, with a two-bottle maximum per party.",
      },
    ],
  },
  real_estate: {
    label: "Real Estate Brokerage",
    agent: "Max",
    greeting:
      "Hello, Skyline Properties! Are you calling regarding one of our active property listings or looking for a home valuation?",
    services:
      "Property Walkthrough (45 min)\nSeller Consultation (60 min)\nBuyer Pre-Qualification Call (30 min)",
    faq: [
      {
        question: "How quickly can I schedule an in-person tour?",
        answer:
          "Most vacant properties can be viewed same-day or within 24 hours with verified ID.",
      },
      {
        question: "What documents are required to make an offer?",
        answer:
          "We require a signed pre-approval letter or proof of funds dated within the last 30 days.",
      },
    ],
  },
  salon: {
    label: "Salon & Spa",
    agent: "Chloe",
    greeting:
      "Hi there, Radiance Studio! I can schedule your haircut, color consultation, or spa treatment. Who are you hoping to see?",
    services:
      "Haircut & Blowout (60 min)\nBalayage & Color (120 min)\nHydrating Facial (60 min)",
    faq: [
      {
        question: "What is your cancellation policy?",
        answer: "We request 24 hours advance notice to avoid a 50% late-cancellation fee.",
      },
    ],
  },
  repair: {
    label: "Repair & Auto Shop",
    agent: "Dave",
    greeting:
      "Thanks for calling Summit Auto Care! I can book routine maintenance, brake inspections, or check diagnostic repair status.",
    services:
      "Oil Change & Inspection (45 min)\nBrake System Diagnostic (60 min)\nAC & Heating Check (45 min)",
    faq: [
      {
        question: "Do you offer complimentary loaner vehicles?",
        answer:
          "Yes, loaner cars are available for major repairs taking longer than 4 hours.",
      },
    ],
  },
  ecommerce: {
    label: "E-Commerce Support",
    agent: "Nova",
    greeting:
      "Thanks for calling Horizon Goods! I can look up your tracking number, start a return, or answer sizing questions.",
    services:
      "Order Status Lookup (10 min)\nReturn & Exchange Authorization (15 min)",
    faq: [
      {
        question: "What is your return window?",
        answer: "We accept returns within 30 days of delivery in original packaging.",
      },
    ],
  },
  hr: {
    label: "HR & Recruitment",
    agent: "Sam",
    greeting:
      "Hello, Talent Operations! Are you calling to check on an active job application or complete an interview phone screen?",
    services:
      "Candidate Screening (20 min)\nInterview Availability Check (15 min)",
    faq: [
      {
        question: "Are your engineering roles remote-friendly?",
        answer:
          "Yes, our engineering roles are open to candidates across all US and Canadian timezones.",
      },
    ],
  },
  general: {
    label: "General Business",
    agent: "Alex",
    greeting: "Thanks for calling! How can I help you today?",
    services: "Consultation Call (30 min)\nGeneral Customer Inquiry (15 min)",
    faq: [
      {
        question: "What are your standard business hours?",
        answer: "We are open Monday through Friday from 9:00 AM to 5:00 PM.",
      },
    ],
  },
};

const VERTICALS = Object.keys(VERTICAL_PRESETS);
const DRAFT_KEY = "voicedesk-receptionist-draft-v1";

interface Draft {
  name: string;
  vertical: string;
  timezone: string;
  agent: AgentDraft;
  businessId?: string;
  phoneNumber?: string;
  step: number;
}

const INITIAL: Draft = {
  name: "",
  vertical: "dental",
  timezone: "America/New_York",
  agent: {
    ...DEFAULT_AGENT,
    agent_name: VERTICAL_PRESETS.dental.agent,
    greeting: VERTICAL_PRESETS.dental.greeting,
    services: VERTICAL_PRESETS.dental.services,
    faq: VERTICAL_PRESETS.dental.faq,
  },
  step: 0,
};

export default function NewBusiness() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [createdBusinessId, setCreatedBusinessId] = useState<string>();
  const businessId = draft.businessId || createdBusinessId;
  const [ready, setReady] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneMode, setPhoneMode] = useState("new");
  const [areaCode, setAreaCode] = useState("415");
  const [number, setNumber] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.name === "string" &&
          parsed.agent &&
          Array.isArray(parsed.agent.faq) &&
          Number.isInteger(parsed.step)
        ) {
          setDraft({
            ...INITIAL,
            ...parsed,
            businessId: parsed.step === 3 ? undefined : parsed.businessId,
            step: Math.max(0, Math.min(2, parsed.step)),
            agent: {
              ...DEFAULT_AGENT,
              ...parsed.agent,
              business_hours: Object.fromEntries(
                DAYS.map((day) => [
                  day,
                  parsed.agent.business_hours?.[day] ??
                    parsed.agent.business_hours?.[DAY_LABELS[day].toLowerCase()] ??
                    DEFAULT_AGENT.business_hours[day],
                ])
              ),
            },
          });
          setNumber(
            parsed.businessId && parsed.step !== 3 ? parsed.phoneNumber || "" : ""
          );
        }
      }
    } catch {
      /* Storage may be unavailable. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        if (createdBusinessId) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSaved(true);
      } catch {
        setDraftSaved(false);
      }
    }
  }, [draft, ready, createdBusinessId]);

  async function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!draft.name.trim()) {
      setError("Enter a business name, not just spaces.");
      return;
    }
    if (draft.step < 2) {
      setDraft({ ...draft, step: draft.step + 1 });
      return;
    }
    if (draft.step === 3) {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* Storage may be unavailable. */
      }
      if (!businessId) {
        setDraft((current) => ({ ...current, step: 2 }));
        return;
      }
      router.push(`/dashboard/${businessId}`);
      return;
    }
    if (!draft.agent.agent_name.trim() || !draft.agent.greeting.trim()) {
      setError("Enter an agent name and greeting, not just spaces.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const fields = {
        name: draft.name.trim(),
        vertical: draft.vertical,
        timezone: draft.timezone,
      };
      const business = businessId
        ? await api.businesses.update(businessId, fields).catch((err) => {
            if (err instanceof Error && /not found|404/i.test(err.message)) {
              setCreatedBusinessId(undefined);
              setDraft((current) => ({ ...current, businessId: undefined }));
              return api.businesses.create(fields);
            }
            throw err;
          })
        : await api.businesses.create(fields);

      setDraft((current) => ({ ...current, businessId: business.id }));
      await api.businesses.updateConfig(business.id, agentPayload(draft.agent));
      setCreatedBusinessId(business.id);
      setDraft((current) => ({ ...current, businessId: undefined, step: 3 }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save setup. Your draft is still here."
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function startOver() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* Storage may be unavailable. */
    }
    setCreatedBusinessId(undefined);
    setDraft(INITIAL);
    setNumber("");
    setError("");
    setPhoneError("");
  }

  async function provision() {
    if (!businessId || phoneBusy) return;
    if (!/^\d{3}$/.test(areaCode)) {
      setPhoneError("Enter a three-digit area code.");
      return;
    }
    setPhoneBusy(true);
    setPhoneError("");
    try {
      const result = await api.businesses.provision(businessId, areaCode);
      setNumber(result.phone_number);
      setDraft((current) => ({ ...current, phoneNumber: result.phone_number }));
    } catch (err) {
      setPhoneError(
        `${
          err instanceof Error ? err.message : "Number provisioning is unavailable."
        } You can finish setup and connect a number later.`
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-theme-bg text-theme-fg selection:bg-indigo-500/20">
      <header className="sticky top-0 z-20 border-b border-theme-border bg-theme-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-theme-fg"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-btn-primary text-theme-btn-primary-fg">
              <Mic size={15} aria-hidden="true" />
            </span>
            <span>VoiceDesk</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-medium text-theme-label shadow-sm hover:bg-theme-surface-muted hover:text-theme-fg transition-colors"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 space-y-8">
        {/* Step Progress Checklist Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-theme-label">
            <span>Setup Progress</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {Math.round(((draft.step + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-theme-surface-muted border border-theme-border">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${((draft.step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <ol
          aria-label="Setup progress"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {STEPS.map((step, index) => {
            const isCompleted = index < draft.step;
            const isCurrent = index === draft.step;
            return (
              <li
                key={step}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-all ${
                  isCurrent
                    ? "border-indigo-500/80 bg-indigo-50/50 text-indigo-950 font-semibold dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-sm"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300"
                    : "border-theme-border/60 bg-theme-surface-muted/30 text-theme-label"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-indigo-600 text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "border border-theme-border bg-theme-surface text-theme-label"
                  }`}
                >
                  {isCompleted ? <Check size={13} /> : index + 1}
                </span>
                <span className="truncate">{step}</span>
              </li>
            );
          })}
        </ol>

        <div className="grid items-start gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Onboarding wizard
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-theme-fg leading-tight">
              {[
                "Tell us about your business",
                "Review domain expertise",
                "Tune call handling rules",
                "Test receptionist & phone line",
              ][draft.step]}
            </h1>
            <p className="text-xs leading-relaxed text-theme-label">
              {[
                "Choose an industry template to pre-fill realistic prompt instructions, FAQs, and services.",
                "Review and customize the pre-filled service menu and FAQs your receptionist uses during calls.",
                "Define business hours, receptionist greeting, transfer number, and booking permissions.",
                "Simulate a live caller conversation in test chat before attaching a real carrier phone line.",
              ][draft.step]}
            </p>

            <div className="rounded-xl border border-theme-border bg-theme-surface-muted/30 p-4 text-xs leading-relaxed text-theme-label space-y-2">
              <p>
                {createdBusinessId
                  ? "Workspace saved to API. Return anytime from your dashboard."
                  : draftSaved
                  ? "Draft state auto-saved on this browser."
                  : "Keep this tab open to retain active draft."} No telephony charges occur during setup.
              </p>
              {(draft.name || draft.businessId) && (
                <button
                  type="button"
                  onClick={startOver}
                  disabled={busy || phoneBusy}
                  className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 underline underline-offset-4"
                >
                  <RotateCcw size={12} />
                  Start over with a fresh preset
                </button>
              )}
            </div>
          </aside>

          {!ready ? (
            <div className="card animate-pulse py-12 text-center text-xs text-theme-label" role="status">
              Loading saved draft…
            </div>
          ) : (
            <div className="space-y-5">
              <form onSubmit={next} className="card space-y-6 shadow-sm" aria-busy={busy}>
                <fieldset disabled={busy || phoneBusy} className="min-w-0 space-y-6">
                  {draft.step === 0 && (
                    <div className="space-y-4">
                      <div className="border-b border-theme-border/60 pb-3">
                        <h2 className="text-base font-semibold tracking-tight text-theme-fg">
                          The business essentials
                        </h2>
                        <p className="mt-0.5 text-xs text-theme-label">
                          Select an industry template to pre-load sample dialogue and knowledge.
                        </p>
                      </div>

                      <div>
                        <label className="label">Industry template</label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {VERTICALS.map((v) => {
                            const preset = VERTICAL_PRESETS[v];
                            const isSelected = draft.vertical === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => {
                                  const p = VERTICAL_PRESETS[v];
                                  setDraft({
                                    ...draft,
                                    vertical: v,
                                    agent: {
                                      ...draft.agent,
                                      agent_name: p.agent,
                                      greeting: p.greeting,
                                      services: p.services,
                                      faq: p.faq,
                                    },
                                  });
                                }}
                                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                  isSelected
                                    ? "border-indigo-600 bg-indigo-50/80 font-semibold text-indigo-950 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-sm"
                                    : "border-theme-border bg-theme-surface text-theme-fg hover:bg-theme-surface-muted/50"
                                }`}
                              >
                                <span className="text-xs">{preset.label}</span>
                                <span className="mt-1 text-[10px] text-theme-label font-normal">
                                  Agent: {preset.agent}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="label">Business name</label>
                        <input
                          className="input"
                          autoComplete="organization"
                          required
                          value={draft.name}
                          onChange={(event) =>
                            setDraft({ ...draft, name: event.target.value })
                          }
                          placeholder={
                            draft.vertical === "dental"
                              ? "Northline Dental Clinic"
                              : "My Business Name"
                          }
                        />
                      </div>

                      <div>
                        <label className="label">Operating timezone</label>
                        <select
                          className="input text-xs"
                          value={draft.timezone}
                          onChange={(event) =>
                            setDraft({ ...draft, timezone: event.target.value })
                          }
                        >
                          {[
                            "America/New_York",
                            "America/Chicago",
                            "America/Denver",
                            "America/Los_Angeles",
                            "Europe/London",
                            "Europe/Paris",
                            "Asia/Kolkata",
                            "Asia/Singapore",
                            "Australia/Sydney",
                            "UTC",
                          ].map((zone) => (
                            <option key={zone}>{zone}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {draft.step === 1 && (
                    <AgentFields
                      section="knowledge"
                      value={draft.agent}
                      onChange={(agent) => setDraft({ ...draft, agent })}
                    />
                  )}

                  {draft.step === 2 && (
                    <AgentFields
                      section="handling"
                      value={draft.agent}
                      onChange={(agent) => setDraft({ ...draft, agent })}
                    />
                  )}

                  {draft.step === 3 && (
                    <div className="space-y-5">
                      <div className="border-b border-theme-border/60 pb-3">
                        <h2 className="text-base font-semibold tracking-tight text-theme-fg">
                          Test & connect your receptionist
                        </h2>
                        <p className="mt-0.5 text-xs text-theme-label">
                          Chat with your agent below to verify responses, or connect a live phone number.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["new", "Get a new telephone number"],
                          ["forward", "Forward my existing carrier number"],
                        ].map(([mode, title]) => (
                          <label
                            key={mode}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-4 text-xs font-medium transition-all ${
                              phoneMode === mode
                                ? "border-indigo-500/80 bg-indigo-50/40 text-theme-fg dark:border-indigo-800 dark:bg-indigo-950/30"
                                : "border-theme-border bg-theme-surface text-theme-label hover:bg-theme-surface-muted/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name="phone-mode"
                              value={mode}
                              checked={phoneMode === mode}
                              onChange={() => setPhoneMode(mode)}
                              className="mt-0.5 accent-indigo-600"
                            />
                            <span>{title}</span>
                          </label>
                        ))}
                      </div>

                      {number ? (
                        <div
                          role="status"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                        >
                          <p className="font-semibold">Your live number is assigned:</p>
                          <p className="mt-1 font-mono text-lg font-bold">{number}</p>
                        </div>
                      ) : phoneMode === "new" ? (
                        <div className="rounded-xl border border-theme-border bg-theme-surface-muted/20 p-4 space-y-3">
                          <label className="label">Preferred US Area Code</label>
                          <div className="flex items-center gap-3">
                            <input
                              className="input max-w-28 font-mono text-center"
                              inputMode="numeric"
                              maxLength={3}
                              value={areaCode}
                              onChange={(event) => setAreaCode(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void provision();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={provision}
                              className="btn-secondary !text-xs !py-2"
                              disabled={phoneBusy}
                            >
                              {phoneBusy ? "Provisioning…" : "Provision number"}
                            </button>
                          </div>
                          <p className="text-[11px] text-theme-label">
                            Optional step. Requires telephony provider configuration in deployment.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-theme-border bg-theme-surface-muted/20 p-4 text-xs leading-relaxed text-theme-label space-y-1">
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Obtain an assigned destination line on VoiceDesk.</li>
                            <li>Configure conditional call forwarding on your mobile or PBX handset.</li>
                            <li>Simulate an unanswered inbound call to confirm VoiceDesk picks up.</li>
                          </ol>
                        </div>
                      )}

                      {phoneError && (
                        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>

                {error && (
                  <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border/60 pt-4">
                  <button
                    type="button"
                    className="btn-secondary !text-xs !py-2"
                    disabled={!draft.step || busy || phoneBusy}
                    onClick={() => {
                      setError("");
                      setDraft({ ...draft, step: draft.step - 1 });
                    }}
                  >
                    <ArrowLeft size={13} className="mr-1.5" />
                    Back
                  </button>

                  <button
                    type="submit"
                    className="btn-primary !text-xs !py-2 gap-1.5 disabled:opacity-50"
                    disabled={busy || phoneBusy}
                  >
                    {busy
                      ? "Saving setup…"
                      : draft.step === 3
                      ? "Complete & open workspace"
                      : draft.step === 2
                      ? "Save & test receptionist"
                      : "Continue"}
                    <ArrowRight size={13} className="ml-1" />
                  </button>
                </div>
              </form>

              {draft.step === 3 && (
                <div className="mt-4">
                  <TestChat businessId={businessId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

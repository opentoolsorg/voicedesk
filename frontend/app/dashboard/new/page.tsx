"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Globe,
  Headphones,
  HelpCircle,
  Home,
  MessageSquare,
  Mic,
  Phone,
  PhoneCall,
  RotateCcw,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Users,
  Wrench,
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

const STEPS = ["Business profile", "Knowledge base", "Call handling", "Test & Launch"];

const VERTICAL_PRESETS: Record<
  string,
  {
    label: string;
    desc: string;
    agent: string;
    icon: React.ElementType;
    greeting: string;
    services: string;
    faq: Array<{ question: string; answer: string }>;
  }
> = {
  dental: {
    label: "Dental Clinic",
    desc: "Appointments, emergency toothache triage, insurance coverage",
    agent: "Aria",
    icon: Stethoscope,
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
    desc: "Table reservations, chef specials, corkage, dietary questions",
    agent: "Bella",
    icon: Coffee,
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
    desc: "Property walkthroughs, valuation calls, buyer pre-qualification",
    agent: "Max",
    icon: Home,
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
    desc: "Stylist bookings, balayage & color, facials, cancellation policies",
    agent: "Chloe",
    icon: Scissors,
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
    desc: "Oil changes, brake inspections, repair status, loaner cars",
    agent: "Dave",
    icon: Wrench,
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
    desc: "Order status lookup, return authorization, product guidance",
    agent: "Nova",
    icon: ShoppingBag,
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
    desc: "Candidate screening, interview availability, remote hiring",
    agent: "Sam",
    icon: Users,
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
    desc: "Inbound answering, office hours, customer inquiries, callbacks",
    agent: "Alex",
    icon: Building2,
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
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState("");
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

  async function seedDemoData() {
    if (!businessId || seeding) return;
    setSeeding(true);
    setSeedNotice("");
    try {
      await api.businesses.seedDemo(businessId);
      setSeedNotice("Added 40 demo calls and 11 bookings to this workspace.");
    } catch (err) {
      setSeedNotice(
        err instanceof Error ? err.message : "Could not seed demo calls."
      );
    } finally {
      setSeeding(false);
    }
  }

  const activePreset = VERTICAL_PRESETS[draft.vertical] || VERTICAL_PRESETS.general;
  const servicesList = draft.agent.services.split("\n").filter(Boolean);
  const openDaysCount = Object.values(draft.agent.business_hours).filter(
    (h) => !h.closed
  ).length;

  return (
    <main className="min-h-screen bg-[#f8f9f6] text-zinc-900 selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-zinc-950"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900 text-white shadow-sm">
              <Mic size={15} aria-hidden="true" />
            </span>
            <span>VoiceDesk</span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              Setup
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10 space-y-8">
        {/* Stepper with estimated time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="text-emerald-900 font-bold">Step {draft.step + 1} of 4</span>
              <span>·</span>
              <span className="text-zinc-400">about 5 min</span>
            </span>
            <span className="font-mono text-emerald-800">
              {Math.round(((draft.step + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80">
            <div
              className="h-full bg-emerald-700 transition-all duration-300 rounded-full"
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
                    ? "border-emerald-700 bg-emerald-50/70 text-emerald-950 font-semibold shadow-sm"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                    : "border-zinc-200 bg-white/70 text-zinc-500"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-emerald-900 text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-300 bg-white text-zinc-500"
                  }`}
                >
                  {isCompleted ? <Check size={13} /> : index + 1}
                </span>
                <span className="truncate">{step}</span>
              </li>
            );
          })}
        </ol>

        {/* 2-Column: Main Setup Form & Live Agent Preview */}
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          {/* Main Form Area */}
          {!ready ? (
            <div className="card animate-pulse py-12 text-center text-xs text-zinc-500" role="status">
              Loading draft state…
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={next} className="card space-y-6 shadow-sm" aria-busy={busy}>
                <fieldset disabled={busy || phoneBusy} className="min-w-0 space-y-6">
                  {/* Step 0: Business Basics & Visual Preset Picker */}
                  {draft.step === 0 && (
                    <div className="space-y-5">
                      <div className="border-b border-zinc-200 pb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                          Step 1
                        </span>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
                          Choose an industry template
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                          Each preset includes battle-tested greetings, booking logic, and sample FAQs.
                        </p>
                      </div>

                      {/* Visual Industry Cards */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {VERTICALS.map((v) => {
                          const preset = VERTICAL_PRESETS[v];
                          const Icon = preset.icon;
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
                                  name: draft.name || (v === "dental" ? "Northline Dental" : p.label),
                                  agent: {
                                    ...draft.agent,
                                    agent_name: p.agent,
                                    greeting: p.greeting,
                                    services: p.services,
                                    faq: p.faq,
                                  },
                                });
                              }}
                              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                isSelected
                                  ? "border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-700/20 shadow-sm"
                                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  isSelected
                                    ? "bg-emerald-900 text-white"
                                    : "border border-zinc-200 bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                <Icon size={18} aria-hidden="true" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-950">
                                    {preset.label}
                                  </span>
                                  <span className="text-[10px] font-medium text-emerald-800">
                                    Agent: {preset.agent}
                                  </span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500 leading-relaxed">
                                  {preset.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-4 pt-2 border-t border-zinc-200">
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
                            placeholder="e.g. Northline Dental"
                          />
                          <p className="mt-1 text-[11px] text-zinc-500">
                            The name your receptionist uses in greetings and booking confirmations.
                          </p>
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
                    </div>
                  )}

                  {/* Step 1: Knowledge Base */}
                  {draft.step === 1 && (
                    <AgentFields
                      section="knowledge"
                      value={draft.agent}
                      onChange={(agent) => setDraft({ ...draft, agent })}
                    />
                  )}

                  {/* Step 2: Call Handling */}
                  {draft.step === 2 && (
                    <AgentFields
                      section="handling"
                      value={draft.agent}
                      onChange={(agent) => setDraft({ ...draft, agent })}
                    />
                  )}

                  {/* Step 3: Finish, Celebration, Phone & Test */}
                  {draft.step === 3 && (
                    <div className="space-y-6">
                      {/* Celebration Card */}
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2.5 text-emerald-950">
                          <CheckCircle2 size={22} className="text-emerald-700 shrink-0" />
                          <h2 className="text-lg font-bold tracking-tight">
                            Setup Complete: Receptionist is live!
                          </h2>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          Your workspace has been created. The AI receptionist has loaded{" "}
                          <strong>{draft.name || "your business"}</strong> with{" "}
                          <strong>{servicesList.length} services</strong> and{" "}
                          <strong>{draft.agent.faq.length} FAQs</strong>.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={seedDemoData}
                            disabled={seeding || !businessId}
                            className="btn-accent !text-xs !py-1.5 gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles size={14} />
                            {seeding ? "Loading demo records…" : "Seed demo calls & bookings"}
                          </button>

                          {businessId && (
                            <Link
                              href={`/dashboard/${businessId}`}
                              className="btn-primary !text-xs !py-1.5 gap-1.5"
                            >
                              Open workspace dashboard
                              <ArrowRight size={13} />
                            </Link>
                          )}
                        </div>

                        {seedNotice && (
                          <p role="status" className="text-xs font-medium text-emerald-900">
                            {seedNotice}
                          </p>
                        )}
                      </div>

                      {/* Phone Connection Choice */}
                      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="border-b border-zinc-200 pb-2">
                          <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
                            Phone line routing
                          </h3>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Attach a real phone line now or forward calls from your existing carrier.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            ["new", "Get a new US telephone number"],
                            ["forward", "Forward from existing carrier"],
                          ].map(([mode, title]) => (
                            <label
                              key={mode}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium transition-all ${
                                phoneMode === mode
                                  ? "border-emerald-700 bg-emerald-50/70 text-zinc-950"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="phone-mode"
                                value={mode}
                                checked={phoneMode === mode}
                                onChange={() => setPhoneMode(mode)}
                                className="mt-0.5 accent-emerald-800"
                              />
                              <span>{title}</span>
                            </label>
                          ))}
                        </div>

                        {number ? (
                          <div
                            role="status"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950"
                          >
                            <p className="font-semibold">Assigned receptionist line:</p>
                            <p className="mt-1 font-mono text-lg font-bold">{number}</p>
                          </div>
                        ) : phoneMode === "new" ? (
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                            <label className="label">Preferred US Area Code</label>
                            <div className="flex items-center gap-3">
                              <input
                                className="input max-w-28 font-mono text-center"
                                inputMode="numeric"
                                maxLength={3}
                                value={areaCode}
                                onChange={(event) => setAreaCode(event.target.value)}
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
                            <p className="text-[11px] text-zinc-500">
                              Requires telephony carrier credentials in deployment. You can connect anytime.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600 space-y-1">
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Obtain an assigned destination line on VoiceDesk.</li>
                              <li>Enable call forwarding with your mobile or PBX carrier.</li>
                              <li>Simulate an inbound call to confirm VoiceDesk picks up.</li>
                            </ol>
                          </div>
                        )}

                        {phoneError && (
                          <p role="alert" className="text-xs text-rose-600">
                            {phoneError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </fieldset>

                {error && (
                  <p role="alert" className="text-xs text-rose-600 font-medium">
                    {error}
                  </p>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
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
                      ? "Open workspace dashboard"
                      : draft.step === 2
                      ? "Save & test receptionist"
                      : "Continue"}
                    <ArrowRight size={13} className="ml-1" />
                  </button>
                </div>
              </form>

              {/* Test chat active on final step */}
              {draft.step === 3 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    <Sparkles size={14} />
                    <span>Live Receptionist Test Call</span>
                  </div>
                  <TestChat businessId={businessId} />
                </div>
              )}
            </div>
          )}

          {/* Live Agent Preview Side Card */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="card space-y-4 shadow-sm border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900">
                  <Bot size={15} className="text-emerald-800" />
                  Live Agent Preview
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                  {draft.agent.agent_name || "Alex"}
                </span>
              </div>

              {/* Greeting Bubble */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Spoken Greeting
                </span>
                <p className="text-xs italic leading-relaxed text-zinc-700">
                  &ldquo;{draft.agent.greeting || "Thanks for calling! How can I help you today?"}&rdquo;
                </p>
              </div>

              {/* Status & Heuristics List */}
              <div className="space-y-2.5 text-xs text-zinc-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-zinc-400" />
                    Business
                  </span>
                  <strong className="text-zinc-900 truncate max-w-[140px]">
                    {draft.name || "Untitled"}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-zinc-400" />
                    Active days
                  </span>
                  <span className="font-mono text-zinc-900 font-medium">
                    {openDaysCount} days / week
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-zinc-400" />
                    FAQs loaded
                  </span>
                  <span className="font-mono text-zinc-900 font-medium">
                    {draft.agent.faq.length} questions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-zinc-400" />
                    Services
                  </span>
                  <span className="font-mono text-zinc-900 font-medium">
                    {servicesList.length} items
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 leading-relaxed">
                Changes update in real-time. Full testing enabled in Step 4.
              </div>
            </div>

            {/* Persistence & Reset Box */}
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-xs leading-relaxed text-zinc-500 shadow-sm space-y-2">
              <p>
                {createdBusinessId
                  ? "Workspace saved to API. Return anytime from your dashboard."
                  : draftSaved
                  ? "Draft state auto-saved on this browser."
                  : "Keep this tab open to retain active draft."}{" "}
                Zero carrier charges occur during setup.
              </p>
              {(draft.name || draft.businessId) && (
                <button
                  type="button"
                  onClick={startOver}
                  disabled={busy || phoneBusy}
                  className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700 underline underline-offset-4"
                >
                  <RotateCcw size={12} />
                  Start over with a fresh preset
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

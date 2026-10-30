"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CodeBlock,
  Cpu,
  Database,
  GitBranch,
  GithubLogo,
  Globe,
  MicrophoneStage,
  Phone,
  PhoneCall,
  ShieldCheck,
  Sparkle,
  Star,
  TerminalWindow,
  TreeStructure,
  Users,
} from "@phosphor-icons/react";

const repository = "https://github.com/opentoolsorg/voicedesk";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";

const templates = [
  { id: "dental", name: "Dental Clinic", agent: "Aria", tag: "Healthcare", desc: "Handles patient appointment bookings, insurance queries, and clinic directions." },
  { id: "restaurant", name: "Restaurant Host", agent: "Bella", tag: "Hospitality", desc: "Manages table reservations, dietary questions, and operating hours." },
  { id: "real-estate", name: "Real Estate Broker", agent: "Max", tag: "Sales", desc: "Qualifies inbound buyers, captures budget requirements, and schedules viewings." },
  { id: "ecommerce", name: "Support & Orders", agent: "Nova", tag: "E-Commerce", desc: "Answers shipping questions, checks order status, and processes return requests." },
  { id: "hr", name: "HR Screening", agent: "Sam", tag: "Recruitment", desc: "Performs initial candidate phone screenings and logs candidate answers." },
  { id: "custom", name: "Blank Scaffold", agent: "Alex", tag: "Flexible", desc: "Build custom prompts and tool calls for bespoke business logic." },
];

const selfHostFeatures = [
  { icon: Database, title: "Zero Database Overhead", desc: "Runs locally on SQLite with no external dependencies, or on Cloudflare D1 serverlessly." },
  { icon: ShieldCheck, title: "Self-Hosted & Private", desc: "Your customer data, call logs, and credentials stay entirely under your own infrastructure control." },
  { icon: PhoneCall, title: "Carrier Neutral", desc: "Integrates with Twilio PSTN or Exotel SIP without locking you into proprietary phone ecosystems." },
  { icon: Cpu, title: "Any LLM & Voice Stack", desc: "Pairs with LiveKit, Deepgram, Sarvam AI, OpenAI, and Cartesia voice models seamlessly." },
];

export default function Home() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/opentoolsorg/voicedesk")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif] selection:bg-emerald-200">
      <a href="#main" className={`sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-3 focus:not-sr-only ${focus}`}>
        Skip to content
      </a>

      {/* Sticky Top Banner / Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#f8f9f6]/90 backdrop-blur-md">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="VoiceDesk home" className={`flex items-center gap-2.5 rounded-md ${focus}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100 shadow-sm">
              <MicrophoneStage aria-hidden="true" weight="fill" size={20} />
            </span>
            <span className="text-xl font-semibold tracking-[-0.05em]">
              VoiceDesk<span className="text-emerald-700">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            <a href="#features" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Features</a>
            <a href="#templates" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Templates</a>
            <a href="#self-host" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Self-Host</a>
            <a href="#architecture" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Architecture</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={repository}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 ${focus}`}
              aria-label="Star VoiceDesk on GitHub"
            >
              <GithubLogo aria-hidden="true" size={17} weight="bold" />
              <span>Star</span>
              <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                <Star aria-hidden="true" size={12} weight="fill" className="text-amber-500" />
                {stars !== null ? stars : "13"}
              </span>
            </a>
            <a
              href="#self-host"
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 active:bg-emerald-950 ${focus}`}
            >
              Deploy now <ArrowRight aria-hidden="true" size={14} />
            </a>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section aria-labelledby="hero-title" className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:pb-24 lg:pt-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-700 animate-pulse" aria-hidden="true" />
              <span>100% Open Source · Self-Hosted Voice Infrastructure</span>
            </div>

            <h1 id="hero-title" className="mt-7 text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-zinc-950 sm:text-6xl lg:text-[4.5rem]">
              Autonomous phone agents.<br />
              <span className="text-emerald-800">Deployed on your terms.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
              VoiceDesk is the white-label AI voice platform you can inspect, customize, and self-host. Pick a template, design conversational flows, and connect real telephony—with zero vendor lock-in.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#self-host"
                className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-emerald-900 px-6 py-3.5 text-sm font-medium text-white shadow transition-all hover:bg-emerald-800 active:bg-emerald-950 ${focus}`}
              >
                <TerminalWindow aria-hidden="true" size={18} />
                Deploy in one command
              </a>
              <a
                href={repository}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 ${focus}`}
              >
                <GithubLogo aria-hidden="true" size={18} />
                Explore on GitHub
                <span className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-800">
                  ★ {stars !== null ? stars : "13"}
                </span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-zinc-200/80 pt-6 text-xs font-medium text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> MIT Licensed & Free
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Boots locally with Zero Keys
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Python Workers & D1 Native
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Carrier Agnostic (Twilio / Exotel)
              </span>
            </div>
          </div>

          {/* Interactive Platform Mockup */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_30px_90px_-40px_rgba(19,56,40,0.25)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-[#f9faf7] px-5 py-3.5 text-xs text-zinc-500">
              <div className="flex items-center gap-2 font-mono">
                <span className="h-3 w-3 rounded-full bg-red-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
                <span className="ml-2 font-sans font-medium text-zinc-700">voicedesk.princepal.dev/dashboard</span>
              </div>
              <span className="rounded border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-900">
                Self-Hosted Operational Core
              </span>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.9fr]">
              {/* Left Column: Flow Canvas & State */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Active Workflow: Receptionist & Triage</p>
                    <p className="text-xs text-zinc-500">Inbound caller routing & calendar booking</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Ready
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-[#fafbf9] p-4 font-mono text-xs text-zinc-700">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                    <span>CALL FLOW PIPELINE</span>
                    <span>LATENCY: &lt;500ms</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white border border-zinc-200 px-2.5 py-1.5 shadow-sm">1. Greeting</span>
                    <ArrowRight size={14} className="text-zinc-400" />
                    <span className="rounded bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 font-semibold text-emerald-900 shadow-sm">2. Intent Classification</span>
                    <ArrowRight size={14} className="text-zinc-400" />
                    <span className="rounded bg-white border border-zinc-200 px-2.5 py-1.5 shadow-sm">3. Calendar Tool</span>
                    <ArrowRight size={14} className="text-zinc-400" />
                    <span className="rounded bg-white border border-zinc-200 px-2.5 py-1.5 shadow-sm">4. SMS Confirm</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-[11px] text-zinc-500">Carrier</p>
                    <p className="mt-1 font-semibold text-zinc-900">Twilio / Exotel</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-[11px] text-zinc-500">Audio Transport</p>
                    <p className="mt-1 font-semibold text-zinc-900">LiveKit WebRTC</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-[11px] text-zinc-500">Voice Synthesis</p>
                    <p className="mt-1 font-semibold text-zinc-900">Cartesia / Sarvam</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-[11px] text-zinc-500">LLM Engine</p>
                    <p className="mt-1 font-semibold text-zinc-900">OpenAI / Claude</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Call Transcript Simulator */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-zinc-100 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> Real-time Call Preview
                    </span>
                    <span className="font-mono">+1 (415) 555-0184</span>
                  </div>
                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div className="rounded-lg bg-zinc-800/80 p-2.5">
                      <span className="font-semibold text-emerald-400">Agent:</span> Thank you for calling Northline Clinic. I can schedule your cleaning or check insurance eligibility. How can I help today?
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-2.5 text-zinc-300">
                      <span className="font-semibold text-zinc-400">Caller:</span> Hi, I need to book a cleaning for next Tuesday afternoon if possible.
                    </div>
                    <div className="rounded-lg bg-zinc-800/80 p-2.5">
                      <span className="font-semibold text-emerald-400">Agent:</span> I have a 2:30 PM slot with Dr. Taylor on Tuesday. Would that work for you?
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-zinc-800 pt-2.5 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Structured outcome: Booked Appointment</span>
                  <span className="font-mono text-emerald-400">Status: 200 OK</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" aria-labelledby="features-title" className="border-t border-zinc-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Enterprise Control</p>
              <h2 id="features-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                Everything you need to run AI voice in production.
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                Proprietary voice platforms bill high per-minute margins and keep your prompt logic in closed boxes. VoiceDesk gives you full autonomy.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {selfHostFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="rounded-xl border border-zinc-200 bg-[#fbfcf9] p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-900 text-emerald-100 shadow-sm">
                      <Icon size={22} weight="duotone" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-zinc-900">{feat.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Niche Templates Section */}
        <section id="templates" aria-labelledby="templates-title" className="border-t border-zinc-200/80 bg-[#f8f9f6] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Battle-tested Presets</p>
                <h2 id="templates-title" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                  Launch industry-ready agents in minutes.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-zinc-600">
                  Pre-configured prompt heuristics, function calling schemas, and recovery fallback routines for high-demand business verticals.
                </p>
              </div>
              <a
                href={repository}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 ${focus}`}
              >
                View template schemas on GitHub <ArrowUpRight size={15} />
              </a>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        {tmpl.tag}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">Agent: {tmpl.agent}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-900">{tmpl.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{tmpl.desc}</p>
                  </div>
                  <div className="mt-6 border-t border-zinc-100 pt-4 flex items-center justify-between text-xs font-medium text-emerald-800">
                    <span>Prompt & Tool schema included</span>
                    <Check size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Self-Host & Deployment Quickstart */}
        <section id="self-host" aria-labelledby="hosting-title" className="border-t border-zinc-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <CodeBlock size={17} /> Developer-First Architecture
                </p>
                <h2 id="hosting-title" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                  Run locally with zero keys.<br />Deploy to Cloudflare in one command.
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-zinc-600">
                  Start developing on your laptop without configuring credentials, databases, or API tokens. When you are ready for cloud hosting, deploy the FastAPI backend as a Cloudflare Python Worker backed by Cloudflare D1 with automatic assets binding.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">1</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Zero-Key Local Boot</p>
                      <p className="text-xs leading-5 text-zinc-600">Clone the repository and run <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800">make up</code>. The UI and REST endpoints run out-of-the-box.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">2</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Connect Telephony When Ready</p>
                      <p className="text-xs leading-5 text-zinc-600">Add an OpenAI or Sarvam key to <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800">backend/.env</code> and run <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800">make voice</code> for live WebRTC audio.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">3</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Deploy Serverlessly</p>
                      <p className="text-xs leading-5 text-zinc-600">Run <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800">make deploy-cf</code> to provision Cloudflare D1 and publish the Python Worker.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Quickstart Box */}
              <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-950 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <TerminalWindow size={15} />
                    <span className="font-mono">terminal — bash</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400">Local Quickstart</span>
                </div>
                <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed text-zinc-200">
                  <p className="text-zinc-500"># 1. Clone repository</p>
                  <p className="text-emerald-400">git clone https://github.com/opentoolsorg/voicedesk</p>
                  <p className="text-emerald-400">cd voicedesk</p>
                  <br />
                  <p className="text-zinc-500"># 2. Boot local dashboard & API (zero keys required)</p>
                  <p className="text-emerald-400">make up</p>
                  <br />
                  <p className="text-zinc-500"># 3. Optional: Deploy directly to Cloudflare</p>
                  <p className="text-emerald-400">make deploy-cf</p>
                </div>
                <div className="border-t border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Dashboard: <strong className="text-white">localhost:3000</strong></span>
                  <span>FastAPI Docs: <strong className="text-white">localhost:8000/docs</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture & Flow Diagram */}
        <section id="architecture" aria-labelledby="arch-title" className="border-t border-zinc-200/80 bg-[#f8f9f6] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">System Design</p>
              <h2 id="arch-title" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                A clean, modular data flow.
              </h2>
              <p className="mt-3 text-sm text-zinc-600">
                VoiceDesk cleanly separates the persistent audio WebRTC pipeline from the RESTful management and analytics plane.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-800 sm:text-sm">
{`Inbound / Outbound Phone Call (PSTN / SIP)
  │
  ▼
Telephony Carrier (Twilio PSTN or Exotel SIP)
  │
  ▼
LiveKit Cloud / Self-Hosted WebRTC Engine
  │
  ├── Audio In ──► Speech-to-Text (Deepgram / Sarvam Bulbul)
  │                      │
  │                      ▼
  ├── Agent Logic ◄── LLM Inference (OpenAI / Claude / Sarvam-30B)
  │                      │
  │                      ▼
  └── Audio Out ◄── Text-to-Speech (Cartesia / Sarvam Saaras)
  │
  ▼
FastAPI API Plane (Local Uvicorn or Cloudflare Python Worker)
  │
  ▼
Database Storage (Local SQLite, PostgreSQL, or Cloudflare D1)
  │
  ▼
Next.js 16 Web Dashboard (Call Records, Audio Transcripts, Lead Flow)`}
              </pre>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="border-t border-zinc-200/80 bg-zinc-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl text-white">
              Ready to own your voice agent stack?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400">
              Download the repository, customize your system prompts, and deploy on your server or Cloudflare in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={repository}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow transition-colors hover:bg-emerald-400 ${focus}`}
              >
                <GithubLogo size={18} weight="bold" /> View on GitHub
              </a>
              <a
                href="#self-host"
                className={`inline-flex min-h-12 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white ${focus}`}
              >
                <TerminalWindow size={18} /> Quickstart Guide
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-8 text-xs sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">VoiceDesk</span>
            <span>/</span>
            <span>Open-source AI Voice Infrastructure</span>
          </div>
          <nav aria-label="Footer links" className="flex flex-wrap items-center gap-6">
            <a href={repository} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://voicedesk.princepal.dev" className="hover:text-white transition-colors">Live Demo</a>
            <a href="https://tryshiba.dev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Shiba</a>
            <a href="https://getindexed.princepal.dev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GetIndexed</a>
            <a href={`${repository}/blob/main/LICENSE`} className="hover:text-white transition-colors">MIT License</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}


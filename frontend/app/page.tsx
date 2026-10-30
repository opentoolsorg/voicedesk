"use client";

import { InteractiveArchitectureDiagram } from "./components/InteractiveArchitectureDiagram";
import { DashboardPreview } from "./components/DashboardPreview";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  CodeBlock,
  Cpu,
  Database,
  GitBranch,
  GithubLogo,
  Globe,
  Headphones,
  MicrophoneStage,
  Phone,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkle,
  Star,
  TerminalWindow,
  TreeStructure,
  Users,
  Waves,
} from "@phosphor-icons/react";

const repository = "https://github.com/opentoolsorg/voicedesk";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";

type DemoScenario = {
  id: string;
  name: string;
  vertical: string;
  caller: string;
  callerNumber: string;
  outcome: string;
  duration: string;
  messages: Array<{ role: "agent" | "caller"; text: string }>;
  toolsUsed: Array<{ name: string; status: string; detail: string }>;
};

const scenarios: DemoScenario[] = [
  {
    id: "clinic",
    name: "Dental Appointment & Triage",
    vertical: "Healthcare · Northline Dental",
    caller: "Maya Chen",
    callerNumber: "+1 (415) 555-0184",
    outcome: "Booked Appointment",
    duration: "1m 42s",
    messages: [
      { role: "agent", text: "Thank you for calling Northline Dental. I can help schedule cleanings, check emergency slots, or verify insurance. How can I help today?" },
      { role: "caller", text: "Hi, I have a chipped molar and need an urgent appointment early next week." },
      { role: "agent", text: "I understand that can be uncomfortable. I have an emergency triage opening with Dr. Taylor on Tuesday at 10:15 AM or Wednesday at 2:00 PM. Which works best?" },
      { role: "caller", text: "Tuesday at 10:15 AM is perfect. Does she accept Delta Dental PPO?" },
      { role: "agent", text: "Yes, Dr. Taylor is in-network with Delta Dental PPO. I have reserved Tuesday at 10:15 AM for Maya Chen. A confirmation SMS has been sent to your number." },
    ],
    toolsUsed: [
      { name: "lookup_calendar_slots", status: "200 OK", detail: "found 2 emergency slots" },
      { name: "check_insurance_provider", status: "200 OK", detail: "in-network: Delta Dental PPO" },
      { name: "book_appointment", status: "201 Created", detail: "booking_id: bkg_9281a" },
      { name: "send_confirmation_sms", status: "200 OK", detail: "delivered to +14155550184" },
    ],
  },
  {
    id: "hospitality",
    name: "Restaurant Reservation & Inquiries",
    vertical: "Hospitality · Osteria Bella",
    caller: "Jordan Patel",
    callerNumber: "+1 (212) 555-0136",
    outcome: "Table Reserved",
    duration: "1m 15s",
    messages: [
      { role: "agent", text: "Good afternoon, Osteria Bella. I can reserve tables, share our daily specials, or take private dining inquiries." },
      { role: "caller", text: "Hey! Looking to book a booth for 4 people this Friday around 7:30 PM." },
      { role: "agent", text: "Let me check our dining room layout for Friday... I have an indoor booth ready at 7:45 PM, or a patio table at 7:30 PM. Would the 7:45 PM booth work for you?" },
      { role: "caller", text: "7:45 PM booth is great! Also, one guest is strictly gluten-free." },
      { role: "agent", text: "Noted! Our pasta kitchen provides dedicated gluten-free preparation. Your booth for 4 is confirmed for Friday at 7:45 PM under Jordan Patel." },
    ],
    toolsUsed: [
      { name: "query_table_availability", status: "200 OK", detail: "4 guests, party_type: booth" },
      { name: "log_dietary_restrictions", status: "200 OK", detail: "allergy: celiac/gluten-free" },
      { name: "confirm_reservation", status: "201 Created", detail: "table_id: bth_04, time: 19:45" },
    ],
  },
  {
    id: "realty",
    name: "Inbound Real Estate Qualification",
    vertical: "Sales · Skyline Properties",
    caller: "Marcus Brody",
    callerNumber: "+1 (305) 555-0912",
    outcome: "Agent Warm Transfer",
    duration: "2m 05s",
    messages: [
      { role: "agent", text: "Hello, Skyline Properties. Are you calling regarding our downtown listings or looking to sell a property?" },
      { role: "caller", text: "I'm calling about the 3-bedroom penthouse on Brickell Ave listed this morning." },
      { role: "agent", text: "That property has received strong interest. It features a private terrace and double parking. Are you pre-approved or looking for an all-cash closing?" },
      { role: "caller", text: "I have a pre-approval letter for up to $2.2M and want a walkthrough tomorrow." },
      { role: "agent", text: "Excellent. Because this listing requires verified escort, let me connect you immediately with Sarah Miller, the lead broker for this unit." },
    ],
    toolsUsed: [
      { name: "query_property_inventory", status: "200 OK", detail: "listing_id: brk_904 ($1.95M)" },
      { name: "qualify_lead_score", status: "200 OK", detail: "score: 95/100 (high intent)" },
      { name: "initiate_sip_transfer", status: "302 Redirect", detail: "transfer_target: +13055558110" },
    ],
  },
];

const selfHostFeatures = [
  { icon: Database, title: "Zero Database Overhead", desc: "Runs locally on SQLite with no external dependencies, or deployable to Cloudflare D1 serverlessly." },
  { icon: ShieldCheck, title: "Self-Hosted & Private", desc: "Your customer data, call recordings, and credentials stay entirely under your own infrastructure control." },
  { icon: PhoneCall, title: "Carrier Neutral", desc: "Integrates directly with Twilio PSTN or Exotel SIP without locking you into proprietary closed phone networks." },
  { icon: Cpu, title: "Pluggable AI Models", desc: "Works with LiveKit WebRTC, Deepgram, Sarvam AI, OpenAI, and Cartesia voice models out-of-the-box." },
];

export default function Home() {
  const [stars, setStars] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>("clinic");
  const [activeTab, setActiveTab] = useState<"transcript" | "tools" | "telephony">("transcript");
  const [activeNode, setActiveNode] = useState<number>(1);

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

  const scenario = scenarios.find((s) => s.id === activeScenario) ?? scenarios[0];

  const diagramSteps = [
    { id: 1, title: "1. Phone Carrier Ingestion", tag: "PSTN / SIP", desc: "Call initiated from customer handset via Twilio PSTN or Exotel SIP trunk.", detail: "E.164 caller identification (+14155550184) incoming webhook received at edge." },
    { id: 2, title: "2. LiveKit Audio Transport", tag: "WebRTC Engine", desc: "Sub-100ms ultra-low latency real-time bidirectional media streaming.", detail: "Opus audio packets routed through room dispatch to local or cloud voice worker." },
    { id: 3, title: "3. Fast Speech-to-Text", tag: "Deepgram / Sarvam", desc: "Streaming audio frames transcribed with real-time turn-taking heuristics.", detail: "Endpointing detection and interim transcript generation in under 200ms." },
    { id: 4, title: "4. Reasoning & Tool Invocation", tag: "OpenAI / Claude / Sarvam", desc: "LLM evaluates business prompt, executes function calls, or routes conversation.", detail: "Executes calendar bookings, CRM updates, or warm SIP transfers securely." },
    { id: 5, title: "5. Natural Voice Synthesis", tag: "Cartesia / Sarvam TTS", desc: "Synthesizes expressive human-sounding speech with interruption support.", detail: "High-fidelity audio stream dispatched immediately into active WebRTC track." },
    { id: 6, title: "6. REST Persistence & Analytics", tag: "FastAPI + D1 / SQLite", desc: "Transcripts, durations, and structured outcomes logged to workspace database.", detail: "Instantly visible in operator dashboard with zero external database dependencies." },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif] selection:bg-emerald-200">
      <a href="#main" className={`sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-3 focus:not-sr-only ${focus}`}>
        Skip to content
      </a>

      {/* Sticky Top Header */}
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
            <a href="#demo" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Live Preview</a>
            <a href="#architecture" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Architecture</a>
            <a href="#features" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Features</a>
            <a href="#self-host" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Self-Host</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 ${focus}`}
            >
              Dashboard
            </Link>
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
              Deploy in 1 command <ArrowRight aria-hidden="true" size={14} />
            </a>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section aria-labelledby="hero-title" className="relative mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24 lg:pb-20 lg:pt-28">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-700 animate-pulse" aria-hidden="true" />
              <span>100% Open Source · Self-Hosted AI Receptionist Platform</span>
            </div>

            <h1 id="hero-title" className="mt-7 text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-zinc-950 sm:text-6xl lg:text-[4.5rem]">
              Open-Source AI Receptionist.<br />
              <span className="text-emerald-800">Deployed on your terms.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
              VoiceDesk is the open-source, white-label AI receptionist platform you can inspect, customize, and self-host. Answer inbound phone calls 24/7, book appointments on calendar, take messages, and route callers—with zero vendor lock-in.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#demo"
                className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-emerald-900 px-6 py-3.5 text-sm font-medium text-white shadow transition-all hover:bg-emerald-800 active:bg-emerald-950 ${focus}`}
              >
                <Waves aria-hidden="true" size={18} />
                Explore real call simulator
              </a>
              <a
                href={repository}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 ${focus}`}
              >
                <GithubLogo aria-hidden="true" size={18} />
                GitHub Repository
                <span className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-800">
                  ★ {stars !== null ? stars : "13"}
                </span>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-zinc-200/80 pt-6 text-xs font-medium text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> MIT Licensed & Free to Self-Host
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Boots locally with Zero Keys (<code className="font-mono text-zinc-800 font-semibold">make up</code>)
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Cloudflare Python Worker + D1 Serverless
              </span>
              <span className="flex items-center gap-1.5">
                <Check aria-hidden="true" size={15} className="text-emerald-700" /> Carrier Agnostic (Twilio / Exotel)
              </span>
            </div>
          </div>
          <DashboardPreview />
        </section>

        {/* Real Interactive Call & Dashboard Feature Simulator */}
        <section id="demo" aria-labelledby="demo-title" className="border-t border-zinc-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Operational Transparency</p>
                <h2 id="demo-title" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                  Inspect the real conversation flow in action.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                  Select an industry scenario to inspect real-time dialogue turns, automated function calls, and structured telemetry captured during production phone calls.
                </p>
              </div>

              {/* Scenario Switcher Buttons */}
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Call scenarios">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    role="tab"
                    aria-selected={activeScenario === sc.id}
                    onClick={() => setActiveScenario(sc.id)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                      activeScenario === sc.id
                        ? "bg-emerald-900 text-white shadow"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Mockup Display */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-[#fafbf9] shadow-lg">
              {/* App Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
                    <Headphones size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{scenario.name}</h3>
                    <p className="text-xs text-zinc-500">{scenario.vertical} · Caller: {scenario.caller} ({scenario.callerNumber})</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    {scenario.outcome}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">Duration: {scenario.duration}</span>
                </div>
              </div>

              {/* Subnav Tabs */}
              <div role="tablist" aria-label="Simulator panels" className="flex border-b border-zinc-200 bg-zinc-50/60 px-5 text-xs font-medium text-zinc-600">
                <button
                  role="tab"
                  aria-selected={activeTab === "transcript"}
                  aria-pressed={activeTab === "transcript"}
                  onClick={() => setActiveTab("transcript")}
                  className={`border-b-2 px-4 py-3 transition-colors ${focus} ${
                    activeTab === "transcript" ? "border-emerald-800 font-semibold text-emerald-900 bg-white" : "border-transparent hover:text-zinc-950"
                  }`}
                >
                  Conversation Transcript
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "tools"}
                  aria-pressed={activeTab === "tools"}
                  onClick={() => setActiveTab("tools")}
                  className={`border-b-2 px-4 py-3 transition-colors ${focus} ${
                    activeTab === "tools" ? "border-emerald-800 font-semibold text-emerald-900 bg-white" : "border-transparent hover:text-zinc-950"
                  }`}
                >
                  Executed Tool Calls ({scenario.toolsUsed.length})
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "telephony"}
                  aria-pressed={activeTab === "telephony"}
                  onClick={() => setActiveTab("telephony")}
                  className={`border-b-2 px-4 py-3 transition-colors ${focus} ${
                    activeTab === "telephony" ? "border-emerald-800 font-semibold text-emerald-900 bg-white" : "border-transparent hover:text-zinc-950"
                  }`}
                >
                  Telephony & Session State
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {activeTab === "transcript" && (
                  <div className="space-y-3.5">
                    {scenario.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
                      >
                        {msg.role === "agent" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                            AI
                          </div>
                        )}
                        <div
                          className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                            msg.role === "agent"
                              ? "border border-zinc-200 bg-white text-zinc-800 shadow-sm"
                              : "bg-emerald-900 text-white shadow"
                          }`}
                        >
                          <p className="font-semibold text-[11px] mb-1 opacity-70 uppercase tracking-wider">
                            {msg.role === "agent" ? "VoiceDesk Agent" : scenario.caller}
                          </p>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "tools" && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-500 mb-2">
                      Real-time function execution logged during this phone call:
                    </p>
                    {scenario.toolsUsed.map((tool, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} weight="fill" className="text-emerald-700" />
                          <span className="font-semibold text-zinc-900">{tool.name}()</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500">{tool.detail}</span>
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {tool.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "telephony" && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-zinc-400 text-[11px]">CARRIER TRANSPORT</p>
                      <p className="mt-1 font-semibold text-zinc-900">Twilio PSTN (SIP Trunk)</p>
                      <p className="mt-2 text-[11px] text-zinc-500">Codec: PCMU (G.711u) @ 8kHz</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-zinc-400 text-[11px]">WEBRTC ROOM</p>
                      <p className="mt-1 font-semibold text-zinc-900">room_vd_71829a</p>
                      <p className="mt-2 text-[11px] text-zinc-500">RTT Latency: 32ms</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-zinc-400 text-[11px]">STREAMING STT/TTS</p>
                      <p className="mt-1 font-semibold text-zinc-900">Deepgram + Cartesia</p>
                      <p className="mt-2 text-[11px] text-zinc-500">Voice: British Natural (Aria)</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <p className="text-zinc-400 text-[11px]">DB PERSISTENCE</p>
                      <p className="mt-1 font-semibold text-zinc-900">D1 SQLite / Local</p>
                      <p className="mt-2 text-[11px] text-zinc-500">Audit Status: Saved</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Complete Interactive End-to-End System Diagram */}
        <section id="architecture" aria-labelledby="arch-heading" className="border-t border-zinc-200/80 bg-[#f8f9f6] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Modular Engineering</p>
              <h2 id="arch-heading" className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                Interactive end-to-end architecture.
              </h2>
              <p className="mt-3 text-base text-zinc-600">
                Click on any stage of the telephony pipeline below to inspect how audio streams, LLM inference, and database persistence coordinate without latency bottlenecks.
              </p>
            </div>

            {/* Interactive Pipeline Navigation */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {diagramSteps.map((step) => {
                const isSelected = activeNode === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveNode(step.id)}
                    className={`text-left rounded-xl border p-5 transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-white shadow-md ring-2 ring-emerald-600/10"
                        : "border-zinc-200 bg-white/70 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-800">STAGE 0{step.id}</span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {step.tag}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{step.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Deep Dive Card */}
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-emerald-200/60 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
                    Deep Dive: Stage 0{activeNode}
                  </span>
                  <h4 className="mt-1 text-xl font-semibold text-emerald-950">
                    {diagramSteps.find((s) => s.id === activeNode)?.title}
                  </h4>
                </div>
                <span className="rounded-full bg-emerald-900 px-3.5 py-1 text-xs font-medium text-white self-start sm:self-auto">
                  {diagramSteps.find((s) => s.id === activeNode)?.tag}
                </span>
              </div>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-emerald-900">
                {diagramSteps.find((s) => s.id === activeNode)?.detail}
              </p>
            </div>

            {/* Visual Interactive Architecture Flow */}
            <div className="mt-10">
              <InteractiveArchitectureDiagram />
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

        {/* Self-Host & Deployment Quickstart */}
        <section id="self-host" aria-labelledby="hosting-title" className="border-t border-zinc-200/80 bg-[#f8f9f6] py-16 sm:py-24">
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

        {/* Bottom CTA Banner */}
        <section className="border-t border-zinc-200/80 bg-zinc-950 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl text-white">
              Ready to deploy your open-source AI receptionist?
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
            <span>Open-Source AI Receptionist Platform</span>
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


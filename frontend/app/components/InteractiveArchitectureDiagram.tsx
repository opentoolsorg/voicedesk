"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Waves,
  Headphones,
  Cpu,
  SpeakerHigh,
  Database,
  CheckCircle,
} from "@phosphor-icons/react";

type Stage = {
  id: number;
  title: string;
  badge: string;
  protocol: string;
  icon: any;
  summary: string;
  details: string[];
  latency: string;
};

const stages: Stage[] = [
  {
    id: 1,
    title: "1. Carrier Ingestion",
    badge: "PSTN / SIP",
    protocol: "Twilio / Exotel SIP Trunk",
    icon: PhoneCall,
    summary: "Incoming calls from mobile or landline handsets trigger telephony webhooks at the edge.",
    details: [
      "Inbound caller ID validated via E.164 normalization",
      "Carrier negotiates audio stream directly with WebRTC media engine",
      "SIP warm-transfer targets configured for manual handoff fallback",
    ],
    latency: "< 80ms",
  },
  {
    id: 2,
    title: "2. WebRTC Audio Engine",
    badge: "Media Stream",
    protocol: "LiveKit Room Pipeline",
    icon: Waves,
    summary: "Real-time bidirectional media stream maintaining sub-50ms packet transmission.",
    details: [
      "Opus codec audio sampled dynamically at 8kHz / 16kHz",
      "Zero-latency barge-in monitoring to silence agent speech on interruption",
      "WebRTC tracks isolated per caller and dispatch worker",
    ],
    latency: "< 35ms",
  },
  {
    id: 3,
    title: "3. Streaming Transcription",
    badge: "STT Engine",
    protocol: "Deepgram / Sarvam Saaras",
    icon: Headphones,
    summary: "Continuous streaming speech recognition producing interim and final word tokens.",
    details: [
      "Endpointing heuristics detect speech pauses and turn completion",
      "Custom domain keyword boost for clinic and restaurant terminology",
      "Accented speech acoustic models tuned for multi-regional English",
    ],
    latency: "< 180ms",
  },
  {
    id: 4,
    title: "4. LLM & Tool Execution",
    badge: "Intelligence",
    protocol: "OpenAI / Claude / Sarvam",
    icon: Cpu,
    summary: "Agent reasons over business rules, knowledge FAQs, and triggers function calls.",
    details: [
      "Dynamic prompt injection with business hours and doctor availability",
      "Parallel tool execution: calendar lookup, CRM writes, SMS dispatch",
      "Strict structured output validation preventing prompt leakage",
    ],
    latency: "< 280ms",
  },
  {
    id: 5,
    title: "5. Voice Synthesis",
    badge: "TTS Stream",
    protocol: "Cartesia / Sarvam Bulbul",
    icon: SpeakerHigh,
    summary: "Ultra-expressive natural human speech generation delivered chunk-by-chunk.",
    details: [
      "Ultra-low time-to-first-audio chunk stream back into WebRTC track",
      "Natural breathing pauses and contextual conversational prosody",
      "Instant cancellation on caller speech interruption",
    ],
    latency: "< 120ms",
  },
  {
    id: 6,
    title: "6. Persistence & Audit",
    badge: "Storage",
    protocol: "FastAPI + D1 SQLite",
    icon: Database,
    summary: "Full conversation transcripts, durations, and outcomes logged for operator review.",
    details: [
      "Cloudflare D1 serverless SQLite audit trail or local SQLite file",
      "Automated appointment booking status & SMS notification tracking",
      "Zero external database dependencies or recurring SaaS subscriptions",
    ],
    latency: "< 15ms",
  },
];

export function InteractiveArchitectureDiagram() {
  const [activeStage, setActiveStage] = useState<number>(1);
  const current = stages.find((s) => s.id === activeStage) ?? stages[0];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-zinc-100 pb-5">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
            Interactive System Flow
          </span>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Live Telephony & Agent Execution Lifecycle
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Click any stage to inspect protocol</span>
        </div>
      </div>

      {/* Visual Step Pipeline */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isSelected = stage.id === activeStage;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                  : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 hover:bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-zinc-400">0{stage.id}</span>
                  <span className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600">
                    {stage.badge}
                  </span>
                </div>
                <div className={`mt-3 flex h-8 w-8 items-center justify-center rounded-lg ${
                  isSelected ? "bg-emerald-900 text-white" : "bg-white text-zinc-700 border border-zinc-200"
                }`}>
                  <Icon size={18} weight="duotone" />
                </div>
                <h4 className="mt-3 text-xs font-semibold text-zinc-900 leading-tight">
                  {stage.title.replace(/^\d+\.\s*/, "")}
                </h4>
              </div>
              <p className="mt-4 font-mono text-[10px] text-emerald-800 font-semibold">{stage.latency}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Deep-Dive Detail View */}
      <div className="mt-6 rounded-xl border border-emerald-200 bg-[#f9fbf8] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-white">
              {React.createElement(current.icon, { size: 20, weight: "duotone" })}
            </span>
            <div>
              <h4 className="text-base font-semibold text-emerald-950">{current.title}</h4>
              <p className="font-mono text-xs text-zinc-500">Protocol: {current.protocol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md">
              Target Latency: {current.latency}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-700 font-medium">
          {current.summary}
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {current.details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-white p-3 text-xs leading-relaxed text-zinc-700 shadow-sm">
              <CheckCircle size={16} weight="fill" className="text-emerald-700 shrink-0 mt-0.5" />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


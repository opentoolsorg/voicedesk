"use client";

import type { AgentConfig } from "@/lib/api";
import FaqEditor, { type FaqEntry } from "./FaqEditor";
import { BookOpen, Clock, Globe, Headphones, Sparkles, UserCheck } from "lucide-react";

// Short keys match the voice agent's format_hours; labels are display-only.
export const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const DAYS = Object.keys(DAY_LABELS);

type Service = { name: string; duration_min?: number; price?: number | string };

export interface AgentDraft {
  agent_name: string;
  greeting: string;
  voice_id: string;
  website_url: string;
  services: string;
  serviceMeta: Record<string, Service>;
  faq: FaqEntry[];
  knowledge_text: string;
  transfer_number: string;
  take_messages: boolean;
  booking_enabled: boolean;
  notify_email: string;
  business_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

export const DEFAULT_AGENT: AgentDraft = {
  agent_name: "Alex",
  greeting: "Thanks for calling! How can I help you today?",
  voice_id: "alloy",
  website_url: "",
  services: "",
  serviceMeta: {},
  faq: [],
  knowledge_text: "",
  transfer_number: "",
  take_messages: true,
  booking_enabled: true,
  notify_email: "",
  business_hours: Object.fromEntries(
    DAYS.map((day, i) => [
      day,
      { open: "09:00", close: "17:00", closed: i > 4 },
    ])
  ),
};

export function agentPayload(draft: AgentDraft): Partial<AgentConfig> {
  const { serviceMeta, ...rest } = draft;
  // Keep duration/price of services that still exist; the agent reads them as objects.
  const services = draft.services
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((name) => ({ ...serviceMeta[name], name }));
  return { ...rest, services };
}

export function configDraft(config: AgentConfig): AgentDraft {
  return {
    ...DEFAULT_AGENT,
    agent_name: config.agent_name || "",
    greeting: config.greeting || "",
    voice_id: config.voice_id || "alloy",
    website_url: config.website_url || "",
    knowledge_text: config.knowledge_text || "",
    transfer_number: config.transfer_number || "",
    take_messages: config.take_messages ?? true,
    booking_enabled: config.booking_enabled ?? true,
    notify_email: config.notify_email || "",
    services: (config.services || [])
      .map((item) => (typeof item === "string" ? item : item.name || ""))
      .filter(Boolean)
      .join("\n"),
    serviceMeta: Object.fromEntries(
      (config.services || [])
        .filter((item) => item && typeof item === "object" && item.name)
        .map((item) => [item.name, item])
    ),
    faq: (config.faq || []).map((item) => ({
      question: item.question || item.q || "",
      answer: item.answer || item.a || "",
    })),
    business_hours: Object.fromEntries(
      DAYS.map((day) => {
        const hours =
          config.business_hours?.[day] ??
          config.business_hours?.[DAY_LABELS[day].toLowerCase()];
        return [
          day,
          hours && typeof hours === "object"
            ? {
                open: hours.open || "09:00",
                close: hours.close || "17:00",
                closed: Boolean(hours.closed),
              }
            : DEFAULT_AGENT.business_hours[day],
        ];
      })
    ),
  };
}

export default function AgentFields({
  value,
  onChange,
  section = "all",
  showVoice = false,
}: {
  value: AgentDraft;
  onChange: (value: AgentDraft) => void;
  section?: "knowledge" | "handling" | "all";
  showVoice?: boolean;
}) {
  function field(key: keyof AgentDraft, next: unknown) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-8">
      {/* Knowledge Section */}
      {section !== "handling" && (
        <section className="space-y-5">
          <div className="border-b border-theme-border/60 pb-3">
            <h2 className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-800 dark:text-emerald-400" />
              What your agent knows
            </h2>
            <p className="mt-1 text-xs text-theme-label">
              Provide domain knowledge and clear answers so your receptionist sounds knowledgeable.
            </p>
          </div>

          <div>
            <label className="label">Website address</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3.5 top-3 text-theme-label" />
              <input
                className="input !pl-9"
                type="url"
                value={value.website_url}
                onChange={(event) => field("website_url", event.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <p className="mt-1 text-[11px] text-theme-label">
              Reference for links and business profile details.
            </p>
          </div>

          <div>
            <label className="label">
              Services offered <span className="font-normal text-theme-label">(one per line)</span>
            </label>
            <textarea
              className="input resize-y"
              rows={3}
              value={value.services}
              onChange={(event) => field("services", event.target.value)}
              placeholder={"General Check-up\nConsultation\nFollow-up appointment"}
            />
          </div>

          <FaqEditor value={value.faq} onChange={(next) => field("faq", next)} />

          <div>
            <label className="label">Additional knowledge & instructions</label>
            <textarea
              className="input resize-y"
              rows={4}
              value={value.knowledge_text}
              onChange={(event) => field("knowledge_text", event.target.value)}
              placeholder="Location directions, parking guidelines, payment methods accepted, policies, and anything else callers frequently ask about…"
            />
          </div>
        </section>
      )}

      {/* Handling Section */}
      {section !== "knowledge" && (
        <section className="space-y-5">
          <div className="border-b border-theme-border/60 pb-3">
            <h2 className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2">
              <Headphones size={16} className="text-emerald-800 dark:text-emerald-400" />
              How your agent handles calls
            </h2>
            <p className="mt-1 text-xs text-theme-label">
              Tone, greeting, operational hours, and automatic hand-offs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Agent display name</label>
              <input
                className="input"
                value={value.agent_name}
                onChange={(event) => field("agent_name", event.target.value)}
                placeholder="e.g. Aria"
                required
              />
            </div>

            {showVoice && (
              <div>
                <label className="label">AI voice model</label>
                <select
                  className="input capitalize"
                  value={value.voice_id}
                  onChange={(event) => field("voice_id", event.target.value)}
                >
                  {Array.from(new Set([value.voice_id, "alloy", "echo", "nova", "shimmer"])).map(
                    (voice) => (
                      <option key={voice} value={voice}>
                        {voice} ({voice === "alloy" || voice === "nova" ? "Standard" : "Warm"})
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">Initial greeting</label>
            <textarea
              className="input resize-y"
              rows={2}
              value={value.greeting}
              onChange={(event) => field("greeting", event.target.value)}
              placeholder="Thanks for calling! How can I help you today?"
              required
            />
            <p className="mt-1 text-[11px] text-theme-label">
              The first sentence the AI speaks when answering incoming calls.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Transfer phone number</label>
              <input
                className="input font-mono text-xs"
                type="tel"
                placeholder="+1 (415) 555-0100"
                value={value.transfer_number}
                onChange={(event) => field("transfer_number", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-theme-label">
                Number to route callers when escalation is requested.
              </p>
            </div>

            <div>
              <label className="label">Notification email</label>
              <input
                className="input"
                type="email"
                placeholder="team@yourbusiness.com"
                value={value.notify_email}
                onChange={(event) => field("notify_email", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-theme-label">
                Receive summaries for new leads and appointments.
              </p>
            </div>
          </div>

          {/* Action Capabilities Checkboxes */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["take_messages", "Take caller messages", "Capture caller name, callback number, and message notes."],
                ["booking_enabled", "Schedule appointments", "Allow callers to check available times and book calendar slots."],
              ] as const
            ).map(([key, title, detail]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  value[key]
                    ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/20"
                    : "border-theme-border bg-theme-surface hover:bg-theme-surface-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={value[key]}
                  checked={value[key]}
                  onChange={(event) => field(key, event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-800"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-theme-fg">{title}</span>
                  <span className="mt-0.5 block text-xs text-theme-label leading-relaxed">
                    {detail}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* Business Hours */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-theme-fg mb-2">
              Business operating hours
            </legend>
            <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border">
              {DAYS.map((day) => {
                const isClosed = value.business_hours[day].closed;
                return (
                  <div
                    key={day}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <span className="w-24 font-medium text-theme-fg">{DAY_LABELS[day]}</span>

                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`${DAY_LABELS[day]} opening time`}
                        type="time"
                        className="input !w-auto !py-1 !px-2 font-mono text-xs disabled:opacity-40"
                        disabled={isClosed}
                        value={value.business_hours[day].open}
                        onChange={(event) =>
                          field("business_hours", {
                            ...value.business_hours,
                            [day]: { ...value.business_hours[day], open: event.target.value },
                          })
                        }
                      />
                      <span className="text-theme-label font-mono text-xs">to</span>
                      <input
                        aria-label={`${DAY_LABELS[day]} closing time`}
                        type="time"
                        className="input !w-auto !py-1 !px-2 font-mono text-xs disabled:opacity-40"
                        disabled={isClosed}
                        value={value.business_hours[day].close}
                        onChange={(event) =>
                          field("business_hours", {
                            ...value.business_hours,
                            [day]: { ...value.business_hours[day], close: event.target.value },
                          })
                        }
                      />
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-theme-label">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(event) =>
                          field("business_hours", {
                            ...value.business_hours,
                            [day]: { ...value.business_hours[day], closed: event.target.checked },
                          })
                        }
                        className="h-3.5 w-3.5 rounded accent-emerald-800"
                      />
                      <span>Closed</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </section>
      )}
    </div>
  );
}

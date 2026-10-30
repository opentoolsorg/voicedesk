"use client";

import type { AgentConfig } from "@/lib/api";
import FaqEditor, { type FaqEntry } from "./FaqEditor";

// Short keys match the voice agent's format_hours; labels are display-only.
export const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};
export const DAYS = Object.keys(DAY_LABELS);
type Service = { name: string; duration_min?: number; price?: number | string };
export interface AgentDraft {
  agent_name: string; greeting: string; voice_id: string; website_url: string;
  services: string; serviceMeta: Record<string, Service>; faq: FaqEntry[]; knowledge_text: string; transfer_number: string;
  take_messages: boolean; booking_enabled: boolean; notify_email: string;
  business_hours: Record<string, { open: string; close: string; closed: boolean }>;
}
export const DEFAULT_AGENT: AgentDraft = {
  agent_name: "Alex", greeting: "Thanks for calling! How can I help you today?", voice_id: "alloy",
  website_url: "", services: "", serviceMeta: {}, faq: [], knowledge_text: "", transfer_number: "",
  take_messages: true, booking_enabled: true, notify_email: "",
  business_hours: Object.fromEntries(DAYS.map((day, i) => [day, { open: "09:00", close: "17:00", closed: i > 4 }])),
};
export function agentPayload(draft: AgentDraft): Partial<AgentConfig> {
  const { serviceMeta, ...rest } = draft;
  // Keep duration/price of services that still exist; the agent reads them as objects.
  const services = draft.services.split("\n").map(value => value.trim()).filter(Boolean)
    .map(name => ({ ...serviceMeta[name], name }));
  return { ...rest, services };
}
export function configDraft(config: AgentConfig): AgentDraft {
  return {
    ...DEFAULT_AGENT,
    agent_name: config.agent_name || "", greeting: config.greeting || "", voice_id: config.voice_id || "alloy",
    website_url: config.website_url || "", knowledge_text: config.knowledge_text || "", transfer_number: config.transfer_number || "",
    take_messages: config.take_messages ?? true, booking_enabled: config.booking_enabled ?? true, notify_email: config.notify_email || "",
    services: (config.services || []).map(item => typeof item === "string" ? item : item.name || "").filter(Boolean).join("\n"),
    serviceMeta: Object.fromEntries((config.services || []).filter(item => item && typeof item === "object" && item.name).map(item => [item.name, item])),
    faq: (config.faq || []).map(item => ({ question: item.question || item.q || "", answer: item.answer || item.a || "" })),
    business_hours: Object.fromEntries(DAYS.map(day => {
      const hours = config.business_hours?.[day] ?? config.business_hours?.[DAY_LABELS[day].toLowerCase()];
      return [day, hours && typeof hours === "object" ? { open: hours.open || "09:00", close: hours.close || "17:00", closed: Boolean(hours.closed) } : DEFAULT_AGENT.business_hours[day]];
    })),
  };
}

export default function AgentFields({ value, onChange, section = "all", showVoice = false }: { value: AgentDraft; onChange: (value: AgentDraft) => void; section?: "knowledge" | "handling" | "all"; showVoice?: boolean }) {
  function field(key: keyof AgentDraft, next: unknown) { onChange({ ...value, [key]: next }); }
  return <div className="space-y-7">
    {section !== "handling" && <section className="space-y-5">
      <div><h2 className="text-lg font-semibold tracking-tight">What your agent knows</h2><p className="mt-1 text-sm text-theme-label">Give callers helpful, accurate answers. Website content is not automatically imported.</p></div>
      <label className="block text-sm font-medium">Website URL<input className="input mt-2" type="url" value={value.website_url} onChange={event => field("website_url", event.target.value)} placeholder="https://yourbusiness.com" /></label>
      <label className="block text-sm font-medium">Services <span className="font-normal text-theme-label">· one per line</span><textarea className="input mt-2" rows={3} value={value.services} onChange={event => field("services", event.target.value)} placeholder={"Consultations\nFollow-up appointments"} /></label>
      <FaqEditor value={value.faq} onChange={next => field("faq", next)} />
      <label className="block text-sm font-medium">Additional knowledge<textarea className="input mt-2" rows={5} value={value.knowledge_text} onChange={event => field("knowledge_text", event.target.value)} placeholder="Location, parking, policies, pricing, and anything else callers should know…" /></label>
    </section>}
    {section !== "knowledge" && <section className="space-y-5">
      <div><h2 className="text-lg font-semibold tracking-tight">How your agent handles calls</h2><p className="mt-1 text-sm text-theme-label">Set the introduction, availability, and next steps.</p></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">Agent name<input className="input mt-2" value={value.agent_name} onChange={event => field("agent_name", event.target.value)} required /></label>
        {showVoice && <label className="block text-sm font-medium">Voice<select className="input mt-2" value={value.voice_id} onChange={event => field("voice_id", event.target.value)}>{Array.from(new Set([value.voice_id, "alloy", "echo", "nova", "shimmer"])).map(voice => <option key={voice} value={voice}>{voice}</option>)}</select></label>}
      </div>
      <label className="block text-sm font-medium">Greeting<textarea className="input mt-2" rows={2} value={value.greeting} onChange={event => field("greeting", event.target.value)} required /></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Transfer number<input className="input mt-2" type="tel" placeholder="+1 415 555 0100" value={value.transfer_number} onChange={event => field("transfer_number", event.target.value)} /></label><label className="block text-sm font-medium">Notification email<input className="input mt-2" type="email" placeholder="team@yourbusiness.com" value={value.notify_email} onChange={event => field("notify_email", event.target.value)} /></label></div>
      <div className="grid gap-3 sm:grid-cols-2">{([['take_messages', 'Take messages', 'Capture caller details and requests.'], ['booking_enabled', 'Accept bookings', 'Let callers request appointments.']] as const).map(([key, title, detail]) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-theme-border p-4"><input type="checkbox" role="switch" aria-checked={value[key]} checked={value[key]} onChange={event => field(key, event.target.checked)} className="mt-1 h-4 w-4 accent-violet-600" /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-theme-label">{detail}</span></span></label>)}</div>
      <fieldset><legend className="mb-3 text-sm font-semibold">Business hours</legend><div className="space-y-2">{DAYS.map(day => <div key={day} className="flex flex-wrap items-center gap-2 rounded-xl border border-theme-border p-3">
        <span className="w-24 text-sm">{DAY_LABELS[day]}</span><label className="ml-auto flex items-center gap-2 text-xs sm:order-last"><input type="checkbox" checked={value.business_hours[day].closed} onChange={event => field("business_hours", { ...value.business_hours, [day]: { ...value.business_hours[day], closed: event.target.checked } })} />Closed</label>
        <input aria-label={`${DAY_LABELS[day]} opening time`} type="time" className="input !w-auto min-w-0 flex-1 !px-2 !py-2" disabled={value.business_hours[day].closed} value={value.business_hours[day].open} onChange={event => field("business_hours", { ...value.business_hours, [day]: { ...value.business_hours[day], open: event.target.value } })} /><span className="hidden text-xs sm:block">to</span><input aria-label={`${DAY_LABELS[day]} closing time`} type="time" className="input !w-auto min-w-0 flex-1 !px-2 !py-2" disabled={value.business_hours[day].closed} value={value.business_hours[day].close} onChange={event => field("business_hours", { ...value.business_hours, [day]: { ...value.business_hours[day], close: event.target.value } })} />
      </div>)}</div></fieldset>
    </section>}
  </div>;
}

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Business {
  id: string;
  name: string;
  vertical: string;
  phone_number: string | null;
  telephony_provider: string;
  timezone: string;
  plan: string;
  active: boolean;
  created_at: string;
}

export interface AgentConfig {
  id: string;
  business_id: string;
  template: string;
  agent_name: string;
  voice_id: string;
  system_prompt: string;
  business_hours: Record<string, any> | null;
  services: any[] | null;
  faq: any[] | null;
  flow_data: Record<string, any> | null;
  greeting: string | null;
  transfer_number: string | null;
  website_url: string | null;
  knowledge_text: string | null;
  take_messages: boolean;
  booking_enabled: boolean;
  notify_email: string | null;
}

/** null while in progress */
export type CallOutcome =
  | "booked" | "message" | "lead" | "faq" | "transferred" | "spam" | "missed" | "voicemail" | "failed";

export interface Call {
  id: string;
  business_id: string;
  direction: string;
  caller_number: string | null;
  caller_name: string | null;
  status: string;
  outcome: CallOutcome | string | null;
  summary: string | null;
  recording_url: string | null;
  duration_sec: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface Booking {
  id: string;
  business_id: string;
  call_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  service: string | null;
  appointment_at: string | null;
  duration_min: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show" | string;
  notes: string | null;
  created_at: string;
}

export interface CallDetail extends Call {
  transcript: Array<{ role: string; text: string }> | null;
  bookings: Booking[];
}

export interface Message {
  id: string;
  caller_number: string | null;
  caller_name: string | null;
  summary: string | null;
  outcome: string;
  started_at: string;
}

export interface Analytics {
  days: number;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  minutes_used: number;
  avg_duration_sec: number;
  bookings_count: number;
  leads_count: number;
  messages_count: number;
  spam_count: number;
  outcomes: Record<string, number>;
  daily: Array<{ date: string; calls: number; minutes: number }>;
  /** 24 entries, hour 0-23 in the business timezone */
  hourly: Array<{ hour: number; calls: number }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const PLANS = [
  { id: "starter", name: "Starter", price: 29, minutes: 150, overage: 0.2 },
  { id: "pro", name: "Pro", price: 99, minutes: 1000, overage: 0.15 },
  { id: "agency", name: "Agency", price: 149, minutes: 3000, overage: 0.12 },
] as const;

export interface FlowVersion {
  id: string;
  business_id: string;
  name: string;
  nodes: Array<Record<string, any>>;
  start_node_id: string | null;
  version: number;
  active: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string | null;
  phone_number: string;
  extra_data: Record<string, any> | null;
  active: boolean;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  location: string;
  score: number;
  status: "new" | "queued" | "called";
  summary?: string;
}

export const api = {
  businesses: {
    list: () => req<Business[]>(`/api/v1/businesses/`),
    get: (id: string) => req<Business>(`/api/v1/businesses/${id}`),
    create: (data: { name: string; vertical: string; timezone?: string }) =>
      req<Business>("/api/v1/businesses/", {
        method: "POST",
        body: JSON.stringify({ timezone: "America/New_York", ...data }),
      }),
    provision: (id: string, area_code = "415") =>
      req<{ phone_number: string; provider: string }>(`/api/v1/numbers/business/${id}/provision`, {
        method: "POST",
        body: JSON.stringify({ area_code }),
      }),
    update: (id: string, data: Partial<Pick<Business, "name" | "vertical" | "timezone" | "plan">>) =>
      req<Business>(`/api/v1/businesses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    analytics: (id: string, days = 30) => req<Analytics>(`/api/v1/businesses/${id}/analytics?days=${days}`),
    bookings: (id: string, upcoming?: boolean) =>
      req<Booking[]>(`/api/v1/businesses/${id}/bookings${upcoming === undefined ? "" : `?upcoming=${upcoming}`}`),
    messages: (id: string) => req<Message[]>(`/api/v1/businesses/${id}/messages`),
    seedDemo: (id: string) =>
      req<{ calls: number; bookings: number }>(`/api/v1/businesses/${id}/demo-data`, { method: "POST" }),
    testChat: (id: string, messages: ChatMessage[]) =>
      req<{ reply: string; provider: string }>(`/api/v1/businesses/${id}/test-chat`, {
        method: "POST",
        body: JSON.stringify({ messages }),
      }),
    getConfig: (id: string) => req<AgentConfig>(`/api/v1/businesses/${id}/config`),
    updateConfig: (id: string, data: Partial<AgentConfig>) =>
      req<AgentConfig>(`/api/v1/businesses/${id}/config`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  calls: {
    list: (businessId?: string, opts: { outcome?: string; q?: string; limit?: number; offset?: number } = {}) => {
      const params = new URLSearchParams();
      if (businessId) params.set("business_id", businessId);
      for (const [k, v] of Object.entries(opts)) if (v !== undefined && v !== "") params.set(k, String(v));
      return req<Call[]>(`/api/v1/calls/?${params.toString()}`);
    },
    get: (id: string) => req<CallDetail>(`/api/v1/calls/${id}`),
    /** Plain link target (browser download), not a fetch. */
    exportUrl: (businessId: string, opts: { outcome?: string; q?: string } = {}) => {
      const params = new URLSearchParams({ business_id: businessId });
      for (const [k, v] of Object.entries(opts)) if (v) params.set(k, v);
      return `${API}/api/v1/calls/export?${params.toString()}`;
    },
    outbound: (data: { business_id: string; phone_number: string; flow_version_id?: string }) =>
      req<Record<string, string>>(`/api/v1/calls/outbound`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  flows: {
    list: (businessId: string) => req<FlowVersion[]>(`/api/v1/businesses/${businessId}/flows`),
    create: (businessId: string, data: { name: string; nodes: Array<Record<string, any>>; start_node_id?: string }) =>
      req<FlowVersion>(`/api/v1/businesses/${businessId}/flows`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  contacts: {
    list: (businessId: string) => req<Contact[]>(`/api/v1/businesses/${businessId}/contacts`),
    create: (businessId: string, data: { name?: string; phone_number: string }) =>
      req<Contact>(`/api/v1/businesses/${businessId}/contacts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  bookings: {
    update: (id: string, data: { status?: string; notes?: string }) =>
      req<Booking>(`/api/v1/bookings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  campaigns: {
    create: (businessId: string, data: { name: string; flow_version_id: string; contact_ids: string[] }) =>
      req<Record<string, any>>(`/api/v1/businesses/${businessId}/campaigns`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    start: (campaignId: string) =>
      req<Record<string, any>>(`/api/v1/campaigns/${campaignId}/start`, { method: "POST" }),
  },
};

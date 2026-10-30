"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Headphones } from "lucide-react";
import { api } from "@/lib/api";
import AgentFields, { DEFAULT_AGENT, DAYS, DAY_LABELS, agentPayload, type AgentDraft } from "../components/AgentFields";
import TestChat from "../components/TestChat";

const STEPS = ["Business", "Knowledge", "Call handling", "Phone & test"];
const VERTICALS = ["restaurant", "dental", "real_estate", "hr", "ecommerce", "salon", "repair", "general"];
const DRAFT_KEY = "voicedesk-receptionist-draft-v1";
interface Draft { name: string; vertical: string; timezone: string; agent: AgentDraft; businessId?: string; phoneNumber?: string; step: number }
const INITIAL: Draft = { name: "", vertical: "general", timezone: "America/New_York", agent: DEFAULT_AGENT, step: 0 };

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
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const parsed = JSON.parse(saved); if (parsed && typeof parsed.name === "string" && parsed.agent && Array.isArray(parsed.agent.faq) && Number.isInteger(parsed.step)) { setDraft({ ...INITIAL, ...parsed, businessId: parsed.step === 3 ? undefined : parsed.businessId, step: Math.max(0, Math.min(2, parsed.step)), agent: { ...DEFAULT_AGENT, ...parsed.agent, business_hours: Object.fromEntries(DAYS.map(day => [day, parsed.agent.business_hours?.[day] ?? parsed.agent.business_hours?.[DAY_LABELS[day].toLowerCase()] ?? DEFAULT_AGENT.business_hours[day]])) } }); setNumber(parsed.businessId && parsed.step !== 3 ? parsed.phoneNumber || "" : ""); } } } catch { /* Storage may be unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { if (createdBusinessId) localStorage.removeItem(DRAFT_KEY); else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setDraftSaved(true); } catch { setDraftSaved(false); } } }, [draft, ready, createdBusinessId]);

  async function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!draft.name.trim()) { setError("Enter a business name, not just spaces."); return; }
    if (draft.step < 2) { setDraft({ ...draft, step: draft.step + 1 }); return; }
    if (draft.step === 3) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* Storage may be unavailable. */ }
      if (!businessId) { setDraft(current => ({ ...current, step: 2 })); return; }
      router.push(`/dashboard/${businessId}`); return;
    }
    if (!draft.agent.agent_name.trim() || !draft.agent.greeting.trim()) { setError("Enter an agent name and greeting, not just spaces."); return; }
    submitting.current = true; setBusy(true);
    try {
      const fields = { name: draft.name.trim(), vertical: draft.vertical, timezone: draft.timezone };
      // A restored draft can point at a deleted workspace; recreate instead of failing forever.
      const business = businessId
        ? await api.businesses.update(businessId, fields).catch(err => {
            if (err instanceof Error && /not found|404/i.test(err.message)) {
              setCreatedBusinessId(undefined);
              setDraft(current => ({ ...current, businessId: undefined }));
              return api.businesses.create(fields);
            }
            throw err;
          })
        : await api.businesses.create(fields);
      // Keep the ID before saving config so retries never create duplicate workspaces.
      setDraft(current => ({ ...current, businessId: business.id }));
      await api.businesses.updateConfig(business.id, agentPayload(draft.agent));
      setCreatedBusinessId(business.id);
      setDraft(current => ({ ...current, businessId: undefined, step: 3 }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save setup. Your draft is still here."); }
    finally { submitting.current = false; setBusy(false); }
  }

  function startOver() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* Storage may be unavailable. */ }
    setCreatedBusinessId(undefined); setDraft(INITIAL); setNumber(""); setError(""); setPhoneError("");
  }

  async function provision() {
    if (!businessId || phoneBusy) return;
    if (!/^\d{3}$/.test(areaCode)) { setPhoneError("Enter a three-digit area code."); return; }
    setPhoneBusy(true); setPhoneError("");
    try { const result = await api.businesses.provision(businessId, areaCode); setNumber(result.phone_number); setDraft(current => ({ ...current, phoneNumber: result.phone_number })); }
    catch (err) { setPhoneError(`${err instanceof Error ? err.message : "Number provisioning is unavailable."} You can finish setup and connect a number later.`); }
    finally { setPhoneBusy(false); }
  }

  return <main className="min-h-screen bg-theme-bg text-theme-fg">
    <header className="border-b border-theme-border bg-theme-surface"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5"><Link href="/" className="flex items-center gap-2 font-semibold tracking-tight"><Headphones size={21} />VoiceDesk</Link><Link href="/dashboard" className="flex items-center gap-2 text-sm text-theme-label"><ArrowLeft size={15} />Dashboard</Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
      <ol aria-label="Setup progress" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">{STEPS.map((step, index) => <li key={step} aria-current={draft.step === index ? "step" : undefined} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${index === draft.step ? "border-theme-border-muted bg-theme-surface-muted font-semibold" : "border-theme-border text-theme-label"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs">{index < draft.step ? <Check size={14} /> : index + 1}</span>{step}</li>)}</ol>
      <div className="grid items-start gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14"><aside><p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-label">Your next great first impression</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em]">{["Meet your new receptionist.", "Make it your business expert.", "Every call, handled your way.", "Give your agent a line."][draft.step]}</h1><p className="mt-5 text-sm leading-7 text-theme-label">{["A few details help us tailor your agent. You can change everything later.", "Start with the essentials. Clear answers help your agent feel like part of your team.", "Choose how your agent greets callers, captures requests, and hands off to you.", "Try your agent before going live. Phone setup is optional and requires a configured provider."][draft.step]}</p><p className="mt-7 rounded-xl border border-theme-border p-4 text-xs leading-6 text-theme-label">{createdBusinessId ? "Your setup is saved. Open your dashboard to return to this agent later." : draftSaved ? "Draft saved on this device." : "Browser storage unavailable. Keep this tab open to retain your draft."} No phone calls are placed during setup.</p>{(draft.name || draft.businessId) && <button type="button" onClick={startOver} disabled={busy || phoneBusy} className="mt-3 text-sm text-theme-label underline">Start over with a new business</button>}</aside>
      {!ready ? <div className="card" role="status">Loading your draft…</div> : <div className="space-y-5"><form onSubmit={next} className="card space-y-6" aria-busy={busy}>
        <fieldset disabled={busy || phoneBusy} className="min-w-0 space-y-6">
          {draft.step === 0 && <><div><h2 className="text-xl font-semibold">The business essentials</h2><p className="mt-2 text-sm text-theme-label">Who will your agent answer for?</p></div><label className="block text-sm font-medium">Business name<input className="input mt-2" autoComplete="organization" required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Juniper Dental" /></label><label className="block text-sm font-medium">Business type<select className="input mt-2" value={draft.vertical} onChange={event => setDraft({ ...draft, vertical: event.target.value })}>{VERTICALS.map(vertical => <option key={vertical} value={vertical}>{({ real_estate: "Real estate", hr: "HR", ecommerce: "E-commerce", salon: "Salon / spa", repair: "Repair shop" } as Record<string, string>)[vertical] || vertical[0].toUpperCase() + vertical.slice(1)}</option>)}</select></label><label className="block text-sm font-medium">Timezone<select className="input mt-2" value={draft.timezone} onChange={event => setDraft({ ...draft, timezone: event.target.value })}>{["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "UTC"].map(zone => <option key={zone}>{zone}</option>)}</select></label></>}
          {draft.step === 1 && <AgentFields section="knowledge" value={draft.agent} onChange={agent => setDraft({ ...draft, agent })} />}
          {draft.step === 2 && <AgentFields section="handling" value={draft.agent} onChange={agent => setDraft({ ...draft, agent })} />}
          {draft.step === 3 && <><h2 className="text-xl font-semibold">Connect when you’re ready</h2><div className="grid gap-3 sm:grid-cols-2">{[["new", "Get a new number"], ["forward", "Forward my existing number"]].map(([mode, title]) => <label key={mode} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-4 text-sm ${phoneMode === mode ? "border-theme-border-muted bg-theme-surface-muted" : "border-theme-border"}`}><input type="radio" name="phone-mode" value={mode} checked={phoneMode === mode} onChange={() => setPhoneMode(mode)} />{title}</label>)}</div>{number ? <p role="status" className="rounded-xl bg-theme-surface-muted p-4 text-sm">Your number is ready: <strong>{number}</strong></p> : phoneMode === "new" ? <div className="space-y-3"><label className="block text-sm font-medium">Preferred area code<input className="input mt-2" inputMode="numeric" maxLength={3} value={areaCode} onChange={event => setAreaCode(event.target.value)} /></label><button type="button" onClick={provision} className="btn-secondary" disabled={phoneBusy}>{phoneBusy ? "Connecting…" : "Provision number"}</button><p className="text-xs text-theme-label">Requires a configured telephony provider. Provider charges may apply.</p></div> : <div className="rounded-xl bg-theme-bg p-4 text-sm leading-7"><ol className="list-decimal pl-4"><li>Get a VoiceDesk destination number here or on the Phone page.</li><li>Ask your carrier to forward unanswered or all calls to that number.</li><li>Place a test call from another phone to confirm routing.</li></ol><p className="mt-3 text-xs text-theme-label">Carrier codes vary. Check with your carrier before enabling forwarding.</p><button type="button" className="mt-3 text-sm underline" onClick={() => setPhoneMode("new")}>Get a destination number</button></div>}{phoneError && <p role="alert" className="text-sm text-red-700">{phoneError}</p>}</>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border pt-5"><button type="button" className="btn-secondary" disabled={!draft.step || busy || phoneBusy} onClick={() => { setError(""); setDraft({ ...draft, step: draft.step - 1 }); }}><ArrowLeft size={15} className="mr-2" />Back</button><button type="submit" className="btn-primary disabled:opacity-50" disabled={busy || phoneBusy}>{busy ? "Saving setup…" : draft.step === 3 ? "Open dashboard" : draft.step === 2 ? "Save & test agent" : "Continue"}<ArrowRight size={15} className="ml-2" /></button></div>
      </form>{draft.step === 3 && <TestChat businessId={businessId} />}</div>}
      </div>
    </div>
  </main>;
}

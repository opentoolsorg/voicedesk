"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Buildings, Check, MicrophoneStage } from "@phosphor-icons/react";
import { api } from "@/lib/api";

const VERTICALS = [
  { value: "salon", label: "Salon / spa", prompt: "A starting point for booking questions, reminders, and missed-call follow-up." },
  { value: "restaurant", label: "Restaurant", prompt: "A starting point for reservations, menu questions, and busy-hour inquiries." },
  { value: "repair", label: "Repair shop", prompt: "A starting point for collecting issue details and organizing service inquiries." },
  { value: "general", label: "General business", prompt: "A flexible starting point for an AI receptionist. Tailor the conversation to your business." },
];
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";
const input = "min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-zinc-500 hover:border-zinc-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-zinc-50 disabled:text-zinc-500";

export default function NewBusiness() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const submitting = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const selectedVertical = VERTICALS.find((item) => item.value === vertical) ?? VERTICALS[3];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!name.trim()) {
      setNameError("Enter a business name, not just spaces.");
      nameInput.current?.focus();
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    setNameError("");
    try {
      const business = await api.businesses.create({ name: name.trim(), vertical });
      router.push(`/dashboard/${business.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the business. Please try again.");
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif]">
      <header className="border-b border-zinc-200 bg-white">
        <nav aria-label="Setup navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className={`flex items-center gap-2.5 rounded-md text-lg font-semibold tracking-tight ${focus}`}><span className="rounded-lg bg-emerald-900 p-2 text-emerald-100"><MicrophoneStage aria-hidden="true" size={18} weight="fill" /></span>VoiceDesk</Link>
          <Link href="/dashboard" className={`inline-flex min-h-10 items-center gap-2 rounded-sm text-xs text-zinc-500 transition-colors hover:text-emerald-800 ${focus}`}><ArrowLeft aria-hidden="true" size={15} />Back to dashboard</Link>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-9 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500" aria-label="Setup progress"><span className="font-medium text-emerald-800" aria-current="step">01 / Business</span><span aria-hidden="true">—</span><span>02 / Agent configuration</span><span aria-hidden="true">—</span><span>03 / Voice connection</span></div>
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-x-20 lg:gap-y-8">
          <div className="lg:pt-3">
            <p className="text-xs font-medium text-emerald-800">A home for your agent</p>
            <h1 className="mt-4 max-w-md text-4xl font-medium leading-[1.12] tracking-[-0.05em] sm:text-5xl">Create a business workspace</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600">Start with a name and a business type. Next, you’ll configure the agent’s instructions, conversation flow, and phone connection.</p>
          </div>

          <form onSubmit={submit} aria-busy={loading} aria-labelledby="form-title" className="min-w-0 overflow-hidden rounded-2xl lg:col-start-2 lg:row-start-1 lg:row-span-2 border border-zinc-200 bg-white shadow-[0_20px_60px_-40px_rgba(19,56,40,0.25)]">
            <div className="border-b border-zinc-200 px-6 py-6 sm:px-8"><span className="mb-3 inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-800"><Buildings aria-hidden="true" size={20} /></span><h2 id="form-title" className="text-xl font-medium tracking-tight">The essentials</h2><p className="mt-2 text-sm text-zinc-500">Two details to get started.</p></div>
            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <label htmlFor="business-name" className="mb-2 block text-sm font-medium">Business name <span className="font-normal text-zinc-500">(required)</span></label>
                <input ref={nameInput} id="business-name" name="business-name" autoComplete="organization" className={input} placeholder="e.g. Juniper Dental" value={name} onChange={(event) => { setName(event.target.value); setNameError(""); }} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "name-error" : "name-hint"} disabled={loading} required />
                {nameError ? <p id="name-error" role="alert" className="mt-2 text-xs text-red-700">{nameError}</p> : <p id="name-hint" className="mt-2 text-xs leading-5 text-zinc-500">Use the name you want to see in your dashboard.</p>}
              </div>
              <div>
                <label htmlFor="business-type" className="mb-2 block text-sm font-medium">Business type</label>
                <select id="business-type" name="business-type" className={input} value={vertical} onChange={(event) => setVertical(event.target.value)} aria-describedby="type-hint" disabled={loading}>
                  {VERTICALS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <p id="type-hint" className="mt-2 text-xs leading-5 text-zinc-500">Choose the closest fit, or start with general business.</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-4" aria-live="polite"><p className="text-xs font-medium text-emerald-900">{selectedVertical.label}</p><p className="mt-1.5 text-xs leading-6 text-emerald-900/75">{selectedVertical.prompt}</p></div>
              {error && <div role="alert" className="break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"><p className="font-medium">Could not create the workspace.</p><p>{error}</p><p className="mt-1 text-xs">Your details are still here. Check the connection and try again.</p></div>}
              <div><button type="submit" disabled={loading} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-900/60 ${focus}`}>{loading ? "Creating workspace…" : <>Create workspace <ArrowRight aria-hidden="true" size={17} /></>}</button><p role="status" className="mt-3 text-center text-xs leading-5 text-zinc-500">{loading ? "Saving your business. You’ll be taken to its workspace." : "Next: configure your agent inside the workspace."}</p></div>
            </div>
          </form>
          <aside className="lg:col-start-1 lg:row-start-2">
            <div className="border-t border-zinc-200 pt-7">
              <h2 className="text-sm font-medium">What you’re creating</h2>
              <ul className="mt-4 space-y-4 text-sm text-zinc-500">
                {["A separate workspace for this business", "A place to manage the agent and its call flow", "A view of this business’s recorded calls"].map((item) => <li key={item} className="flex items-start gap-3"><Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-emerald-700" /><span>{item}</span></li>)}
              </ul>
            </div>
            <p className="mt-8 max-w-md text-xs leading-6 text-zinc-500">Creating a workspace does not connect a phone number or place a call. Voice requires provider credentials and telephony configuration.</p>
          </aside>
        </div>
        <footer className="mt-14 border-t border-zinc-200 pt-5 text-xs text-zinc-500">VoiceDesk · Open-source, self-hosted voice agents.</footer>
      </div>
    </main>
  );
}

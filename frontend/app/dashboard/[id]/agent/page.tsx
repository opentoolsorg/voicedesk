"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Save } from "lucide-react";
import { api, type Business } from "@/lib/api";
import AgentFields, { agentPayload, configDraft, type AgentDraft } from "../../components/AgentFields";
import TestChat from "../../components/TestChat";

export default function AgentPage() {
  const id = usePathname().split("/")[2];
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  const dirty = Boolean(draft && JSON.stringify({ agent: draft, name: business?.name, timezone: business?.timezone, vertical: business?.vertical }) !== baseline);

  useEffect(() => {
    let live = true;
    setLoading(true); setError(""); setDraft(null);
    Promise.all([api.businesses.getConfig(id), api.businesses.get(id)]).then(([config, result]) => {
      if (!live) return;
      const next = configDraft(config); setDraft(next); setBusiness(result);
      setBaseline(JSON.stringify({ agent: next, name: result.name, timezone: result.timezone, vertical: result.vertical }));
    }).catch(err => { if (live) setError(err instanceof Error ? err.message : "Could not load agent settings."); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id, retry]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!draft || !business || busy) return;
    if (!business.name.trim() || !draft.agent_name.trim() || !draft.greeting.trim()) { setError("Business name, agent name, and greeting cannot be blank."); return; }
    setBusy(true); setError(""); setSaved(false);
    try {
      const updated = await api.businesses.update(id, { name: business.name.trim(), timezone: business.timezone, vertical: business.vertical });
      setBusiness(updated);
      const config = await api.businesses.updateConfig(id, agentPayload(draft));
      const next = configDraft(config); setDraft(next);
      setBaseline(JSON.stringify({ agent: next, name: updated.name, timezone: updated.timezone, vertical: updated.vertical })); setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings. Your changes are still here."); }
    finally { setBusy(false); }
  }

  if (loading) return <div role="status" className="card animate-pulse">Loading agent settings…</div>;
  if (!draft || !business) return <div className="card space-y-3"><h1 className="text-xl font-semibold">Agent settings unavailable</h1><p role="alert" className="text-sm text-theme-label">{error || "No configuration found for this business."}</p><button className="btn-secondary" onClick={() => setRetry(retry + 1)}>Try again</button></div>;

  return <div className="space-y-7"><header><p className="text-xs font-semibold uppercase tracking-widest text-theme-label">The voice of your business</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Agent settings</h1><p className="mt-2 text-sm text-theme-label">Teach your receptionist, then try a conversation before going live.</p></header><div className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.8fr]">
    <form onSubmit={save} className="card space-y-7" aria-busy={busy}><fieldset disabled={busy} className="min-w-0 space-y-7"><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Business name<input required className="input mt-2" value={business.name} onChange={event => setBusiness({ ...business, name: event.target.value })} /></label><label className="block text-sm font-medium">Timezone<select className="input mt-2" value={business.timezone} onChange={event => setBusiness({ ...business, timezone: event.target.value })}>{Array.from(new Set([business.timezone, "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "UTC"])).map(zone => <option key={zone}>{zone}</option>)}</select></label><label className="block text-sm font-medium">Business type<select className="input mt-2" value={business.vertical} onChange={event => setBusiness({ ...business, vertical: event.target.value })}>{Array.from(new Set([business.vertical, "restaurant", "dental", "real_estate", "hr", "ecommerce", "salon", "repair", "general"])).map(vertical => <option key={vertical} value={vertical}>{vertical.replaceAll("_", " ")}</option>)}</select></label></div><AgentFields value={draft} onChange={value => { setDraft(value); setSaved(false); }} showVoice /></fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error} Your changes are still here.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border pt-5"><p role="status" className="text-sm text-theme-label">{busy ? "Saving…" : dirty ? "Unsaved changes" : saved ? "All changes saved" : "Settings are up to date"}</p><button type="submit" className="btn-primary disabled:opacity-50" disabled={busy || !dirty}><Save size={15} className="mr-2" />{busy ? "Saving…" : "Save changes"}</button></div></form>
    <aside className="space-y-3 xl:sticky xl:top-6"><TestChat key={id} businessId={id} />{dirty && <p className="px-2 text-xs leading-5 text-theme-label">Save changes before testing to hear the latest version.</p>}</aside>
  </div></div>;
}

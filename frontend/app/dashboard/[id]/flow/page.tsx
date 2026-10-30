"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, FloppyDisk, PhoneCall, Plus, TreeStructure, Users } from "@phosphor-icons/react";
import { api, type Contact, type FlowVersion } from "@/lib/api";

type DraftNode = { type: "message" | "question" | "end"; text: string };
type Notice = { kind: "success" | "error"; text: string } | null;
type Action = "save" | "contact" | "call" | null;
const starterNodes: DraftNode[] = [
  { type: "message", text: "Hello, this is calling from our team." },
  { type: "question", text: "Are you available to speak with us today?" },
  { type: "end", text: "Thank you. Have a great day." },
];
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";
const button = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
const input = "min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-zinc-50 disabled:text-zinc-500";

function Feedback({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-4 break-words rounded-lg border px-4 py-3 text-sm leading-6 ${notice.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{notice.text}</p>;
}

export default function FlowPage() {
  // Static export ships one "_" shell for every id, so read the real id from the URL.
  const id = usePathname().split("/")[2];
  const [mounted, setMounted] = useState(false);
  const [flows, setFlows] = useState<FlowVersion[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("Customer call flow");
  const [nodes, setNodes] = useState<DraftNode[]>(starterNodes);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFlow, setSelectedFlow] = useState("");
  const [flowsLoading, setFlowsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [flowError, setFlowError] = useState("");
  const [contactError, setContactError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [action, setAction] = useState<Action>(null);
  const actionLock = useRef(false);
  const [saveNotice, setSaveNotice] = useState<Notice>(null);
  const [contactNotice, setContactNotice] = useState<Notice>(null);
  const [callNotice, setCallNotice] = useState<Notice>(null);
  const [callTarget, setCallTarget] = useState<Contact | null>(null);
  const busy = action !== null;

  useEffect(() => {
    let cancelled = false;
    setMounted(true);
    setFlowsLoading(true);
    setContactsLoading(true);
    setFlowError("");
    setContactError("");
    setCallTarget(null);
    api.flows.list(id)
      .then((data) => {
        if (cancelled) return;
        setFlows(data);
        setSelectedFlow((current) => data.some((flow) => flow.id === current) ? current : data[0]?.id ?? "");
      })
      .catch(() => {
        if (cancelled) return;
        setFlows([]);
        setSelectedFlow("");
        setFlowError("Could not load saved flows. Check the API connection and retry.");
      })
      .finally(() => { if (!cancelled) setFlowsLoading(false); });
    api.contacts.list(id)
      .then((data) => { if (!cancelled) setContacts(data); })
      .catch(() => {
        if (cancelled) return;
        setContacts([]);
        setContactError("Could not load customers. Check the API connection and retry.");
      })
      .finally(() => { if (!cancelled) setContactsLoading(false); });
    return () => { cancelled = true; };
  }, [id, refresh]);

  function updateNode(index: number, patch: Partial<DraftNode>) {
    setNodes((current) => current.map((node, i) => (i === index ? { ...node, ...patch } : node)));
  }

  async function saveFlow(event: React.FormEvent) {
    event.preventDefault();
    if (actionLock.current) return;
    if (!name.trim()) {
      setSaveNotice({ kind: "error", text: "Enter a flow name, not just spaces." });
      return;
    }
    actionLock.current = true;
    setAction("save");
    setSaveNotice(null);
    try {
      const saved = await api.flows.create(id, {
        name,
        nodes: nodes.map((node, index) => ({
          id: `node-${index + 1}`,
          type: node.type,
          text: node.text,
          ...(index < nodes.length - 1 ? { next: `node-${index + 2}` } : {}),
        })),
        start_node_id: "node-1",
      });
      setFlows((current) => [saved, ...current]);
      setSelectedFlow(saved.id);
      setSaveNotice({ kind: "success", text: "Flow saved and activated. It is now selected for calls." });
    } catch (error) {
      setSaveNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not save the flow. Your draft is still here." });
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  }

  async function addContact(event: React.FormEvent) {
    event.preventDefault();
    if (actionLock.current) return;
    if (!phone.trim()) {
      setContactNotice({ kind: "error", text: "Enter a customer phone number, not just spaces." });
      return;
    }
    actionLock.current = true;
    setAction("contact");
    setContactNotice(null);
    try {
      const contact = await api.contacts.create(id, { name: contactName || undefined, phone_number: phone });
      setContacts((current) => [contact, ...current]);
      setContactName("");
      setPhone("");
      setContactNotice({ kind: "success", text: "Customer added. No call has been placed." });
    } catch (error) {
      setContactNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not add the customer. Your details are still here." });
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  }

  async function startCall(contact: Contact) {
    if (actionLock.current) return;
    if (!selectedFlow) {
      setCallNotice({ kind: "error", text: "Save or choose a flow before placing a call." });
      return;
    }
    actionLock.current = true;
    setAction("call");
    setCallNotice(null);
    try {
      const result = await api.calls.outbound({ business_id: id, phone_number: contact.phone_number, flow_version_id: selectedFlow });
      setCallTarget(null);
      setCallNotice({ kind: "success", text: `Call request accepted for ${contact.phone_number}. Room: ${result.room_name}. This does not confirm the customer answered.` });
    } catch (error) {
      setCallTarget(null);
      setCallNotice({ kind: "error", text: `${error instanceof Error ? error.message : "Could not confirm the call request."} Check call activity before retrying; the request may have reached your provider.` });
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif]">
      <header className="border-b border-zinc-200 bg-white">
        <nav aria-label="Flow workspace navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href={mounted ? `/dashboard/${id}` : "/dashboard"} className={`inline-flex min-h-10 items-center gap-2 rounded-sm text-sm text-zinc-600 hover:text-emerald-800 ${focus}`}><ArrowLeft aria-hidden="true" size={16} />Back to workspace</Link>
          <span className="flex items-center gap-2 text-xs font-medium text-emerald-800"><TreeStructure aria-hidden="true" size={17} />VoiceDesk / Call flow</span>
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <p className="text-xs font-medium text-emerald-800">Configure → save → call</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Shape the conversation.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">Write the agent’s steps, save a flow, and choose a customer to call. Draft changes are not used in calls until you save them.</p>
        {(flowError || contactError) && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><div className="text-sm leading-6 text-amber-900">{flowError && <p>{flowError}</p>}{contactError && <p>{contactError}</p>}</div><button type="button" disabled={(flowsLoading && contactsLoading) || busy} onClick={() => setRefresh((current) => current + 1)} className={`${button} border border-amber-300 bg-white text-amber-950 hover:bg-amber-100`}>Retry loading</button></div>}
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section aria-labelledby="flow-title" className="min-w-0 rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="flow-title" className="text-lg font-medium tracking-tight">1. Build your flow</h2><span className="text-xs tabular-nums text-zinc-500">{nodes.length} steps · draft</span></div><p className="mt-2 text-xs leading-6 text-zinc-500">Steps run in order. An end-call step finishes the conversation.</p></div>
            <form onSubmit={saveFlow} aria-busy={action === "save"} className="p-5 sm:p-6">
              <label htmlFor="flow-name" className="mb-2 block text-sm font-medium">Flow name</label>
              <input id="flow-name" className={input} value={name} onChange={(event) => setName(event.target.value)} disabled={busy || flowsLoading} required />
              <ol className="mt-6 space-y-4">
                {nodes.map((node, index) => <li key={index} className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4"><div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-500"><span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 bg-white tabular-nums">{index + 1}</span>Conversation step</div><div className="grid gap-3 sm:grid-cols-[9rem_1fr]"><div><label htmlFor={`step-type-${index}`} className="mb-1.5 block text-xs text-zinc-600">Step {index + 1} type</label><select id={`step-type-${index}`} className={input} value={node.type} disabled={busy || flowsLoading} onChange={(event) => updateNode(index, { type: event.target.value as DraftNode["type"] })}><option value="message">Say something</option><option value="question">Ask a question</option><option value="end">End call</option></select></div><div><label htmlFor={`step-text-${index}`} className="mb-1.5 block text-xs text-zinc-600">Step {index + 1} text</label><textarea id={`step-text-${index}`} rows={3} className={`${input} resize-y`} value={node.text} disabled={busy || flowsLoading} onChange={(event) => updateNode(index, { text: event.target.value })} placeholder="What should the agent say?" /></div></div></li>)}
              </ol>
              <button type="button" disabled={busy || flowsLoading} onClick={() => setNodes((current) => [...current, { type: "message", text: "" }])} className={`${button} mt-4 border border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50`}><Plus aria-hidden="true" size={16} />Add step</button>
              <div className="mt-6 border-t border-zinc-200 pt-5"><button type="submit" disabled={busy || flowsLoading} className={`${button} w-full bg-emerald-900 text-white hover:bg-emerald-800 sm:w-auto`}><FloppyDisk aria-hidden="true" size={17} />{action === "save" ? "Saving flow…" : "Save and activate flow"}</button><p role="status" className="mt-3 text-xs leading-6 text-zinc-500">{action === "save" ? "Saving these steps to your API…" : "Saving creates a new flow version. It does not place a call."}</p></div>
              <Feedback notice={saveNotice} />
            </form>
          </section>
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="contact-title" className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
              <h2 id="contact-title" className="text-lg font-medium tracking-tight">2. Add a customer</h2><p className="mt-2 text-xs leading-6 text-zinc-500">Use a number you have permission to call. Adding a customer does not contact them.</p>
              <form onSubmit={addContact} aria-busy={action === "contact"} className="mt-5 space-y-4"><div><label htmlFor="customer-name" className="mb-2 block text-sm font-medium">Customer name <span className="font-normal text-zinc-500">(optional)</span></label><input id="customer-name" autoComplete="name" className={input} value={contactName} disabled={busy || contactsLoading} onChange={(event) => setContactName(event.target.value)} /></div><div><label htmlFor="customer-phone" className="mb-2 block text-sm font-medium">Phone number</label><input id="customer-phone" type="tel" autoComplete="tel" aria-describedby="phone-hint" className={input} value={phone} disabled={busy || contactsLoading} onChange={(event) => setPhone(event.target.value)} placeholder="+919876543210" required /><p id="phone-hint" className="mt-2 text-xs text-zinc-500">Include the country code, for example +91.</p></div><button type="submit" disabled={busy || contactsLoading} className={`${button} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`}><Plus aria-hidden="true" size={16} />{action === "contact" ? "Adding customer…" : "Add customer"}</button><p role="status" className="text-xs text-zinc-500">{action === "contact" ? "Saving the customer to your API…" : ""}</p></form>
              <Feedback notice={contactNotice} />
            </section>
            <section aria-labelledby="call-title" className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><h2 id="call-title" className="text-lg font-medium tracking-tight">3. Place a call</h2><Users aria-hidden="true" size={20} className="text-zinc-500" /></div><p className="mt-2 text-xs leading-6 text-zinc-500">This sends a real outbound request through your configured voice and telephony providers. Provider charges may apply.</p>
              {flowsLoading ? <div role="status" className="mt-5 space-y-3"><span className="sr-only">Loading saved flows…</span><div className="h-11 rounded-lg bg-zinc-100 motion-safe:animate-pulse" /><div className="h-20 rounded-lg bg-zinc-100 motion-safe:animate-pulse" /></div> : <><label htmlFor="call-flow" className="mb-2 mt-5 block text-sm font-medium">Saved flow for calls</label><select id="call-flow" className={input} value={selectedFlow} disabled={busy || flows.length === 0} onChange={(event) => { setSelectedFlow(event.target.value); setCallTarget(null); }}><option value="">Choose a saved flow</option>{flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name} v{flow.version}</option>)}</select>{!flows.length && !flowError && <p className="mt-2 text-xs leading-6 text-zinc-500">No saved flows yet. Save your draft to enable calling.</p>}</>}
              {contactsLoading ? <div role="status" className="mt-5 h-20 rounded-lg bg-zinc-100 motion-safe:animate-pulse"><span className="sr-only">Loading customers…</span></div> : <>{contactError && <p className="mt-5 text-sm text-zinc-600">The full customer list is unavailable. Retry loading above.</p>}{!contacts.length && !contactError ? <div className="mt-5 rounded-lg border border-dashed border-zinc-300 px-4 py-7"><p className="text-sm font-medium">No customers yet.</p><p className="mt-2 text-xs leading-6 text-zinc-500">Add a customer’s phone number above, then review the saved flow before calling.</p></div> : <ul className="mt-5 divide-y divide-zinc-200">{contacts.map((contact) => <li key={contact.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words text-sm font-medium">{contact.name || "Unnamed customer"}</p><p className="mt-1 break-all font-mono text-xs text-zinc-500">{contact.phone_number}</p></div><button type="button" disabled={busy || flowsLoading || !selectedFlow} aria-label={`Prepare call to ${contact.name || contact.phone_number}`} onClick={() => { setCallTarget(contact); setCallNotice(null); }} className={`${button} border border-zinc-200 text-emerald-800 hover:bg-emerald-50`}><PhoneCall aria-hidden="true" size={16} />Prepare call</button></li>)}</ul>}</>}
              {callTarget && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-medium text-amber-950">Confirm this real call</p><p className="mt-2 break-words text-xs leading-6 text-amber-900">Call {callTarget.name || "this customer"} at <span className="break-all font-mono">{callTarget.phone_number}</span> using {flows.find((flow) => flow.id === selectedFlow)?.name}?</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => startCall(callTarget)} className={`${button} bg-emerald-900 text-white hover:bg-emerald-800`}><ArrowRight aria-hidden="true" size={16} />{action === "call" ? "Requesting call…" : "Place real call"}</button><button type="button" disabled={busy} onClick={() => setCallTarget(null)} className={`${button} text-zinc-600 hover:bg-white`}>Cancel</button></div><p role="status" className="mt-2 text-xs text-amber-900">{action === "call" ? "Sending the outbound request. Do not submit it again." : "No call has been placed yet."}</p></div>}
              <Feedback notice={callNotice} />
            </section>
          </div>
        </div>
        <footer className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-500">VoiceDesk · Open-source, self-hosted voice operations.</footer>
      </div>
    </main>
  );
}

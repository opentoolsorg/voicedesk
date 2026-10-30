"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  HelpCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { api, type Contact, type FlowVersion } from "@/lib/api";

type DraftNode = { type: "message" | "question" | "end"; text: string };
type Notice = { kind: "success" | "error"; text: string } | null;
type Action = "save" | "contact" | "call" | null;

const starterNodes: DraftNode[] = [
  { type: "message", text: "Hello! Thanks for calling. How can I help you today?" },
  { type: "question", text: "Are you calling to schedule an appointment or ask a question?" },
  { type: "end", text: "Thank you for reaching out. Have a wonderful day!" },
];

function Feedback({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const isError = notice.kind === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mt-4 rounded-lg border p-3 text-xs leading-relaxed ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
    >
      {notice.text}
    </div>
  );
}

export default function FlowPage() {
  const id = usePathname().split("/")[2];
  const [flows, setFlows] = useState<FlowVersion[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("Standard Inbound Flow");
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
    setFlowsLoading(true);
    setContactsLoading(true);
    setFlowError("");
    setContactError("");
    setCallTarget(null);

    api.flows
      .list(id)
      .then((data) => {
        if (cancelled) return;
        setFlows(data);
        setSelectedFlow((current) =>
          data.some((flow) => flow.id === current) ? current : data[0]?.id ?? ""
        );
      })
      .catch(() => {
        if (cancelled) return;
        setFlows([]);
        setSelectedFlow("");
        setFlowError("Could not load saved flows. Check the API connection and retry.");
      })
      .finally(() => {
        if (!cancelled) setFlowsLoading(false);
      });

    api.contacts
      .list(id)
      .then((data) => {
        if (cancelled) return;
        setContacts(data);
      })
      .catch(() => {
        if (cancelled) return;
        setContacts([]);
        setContactError("Could not load customers. Check the API connection and retry.");
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, refresh]);

  function updateNode(index: number, patch: Partial<DraftNode>) {
    setNodes((current) =>
      current.map((node, i) => (i === index ? { ...node, ...patch } : node))
    );
  }

  function removeNode(index: number) {
    if (nodes.length <= 1) return;
    setNodes((current) => current.filter((_, i) => i !== index));
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
        name: name.trim(),
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
      setSaveNotice({
        kind: "success",
        text: "Flow saved and activated. Selected for subsequent calls.",
      });
    } catch (error) {
      setSaveNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save the flow. Your draft is still here.",
      });
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
      const contact = await api.contacts.create(id, {
        name: contactName.trim() || undefined,
        phone_number: phone.trim(),
      });
      setContacts((current) => [contact, ...current]);
      setContactName("");
      setPhone("");
      setContactNotice({ kind: "success", text: "Customer added to directory. Ready for calls." });
    } catch (error) {
      setContactNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not add customer. Details are still here.",
      });
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
      const result = await api.calls.outbound({
        business_id: id,
        phone_number: contact.phone_number,
        flow_version_id: selectedFlow,
      });
      setCallTarget(null);
      setCallNotice({
        kind: "success",
        text: `Outbound call requested for ${contact.phone_number}. Room: ${result.room_name}.`,
      });
    } catch (error) {
      setCallTarget(null);
      setCallNotice({
        kind: "error",
        text: `${error instanceof Error ? error.message : "Could not dispatch call request."} Check provider credentials.`,
      });
    } finally {
      actionLock.current = false;
      setAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
          Call-flow builder
        </h1>
        <p className="mt-1 text-sm text-theme-label">
          Design step-by-step receptionist dialogue sequences and test outbound flows.
        </p>
      </div>

      {(flowError || contactError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <div>
            {flowError && <p>{flowError}</p>}
            {contactError && <p>{contactError}</p>}
          </div>
          <button
            type="button"
            disabled={(flowsLoading && contactsLoading) || busy}
            onClick={() => setRefresh((current) => current + 1)}
            className="btn-secondary !text-xs !py-1"
          >
            Retry loading
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Step Flow Editor */}
        <section
          aria-labelledby="flow-title"
          className="card space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-theme-border/60 pb-4">
            <div>
              <h2 id="flow-title" className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2">
                <GitBranch size={16} className="text-indigo-600 dark:text-indigo-400" />
                1. Conversation script & steps
              </h2>
              <p className="mt-0.5 text-xs text-theme-label">
                Dialogue executed in linear order during calls.
              </p>
            </div>
            <span className="rounded border border-theme-border bg-theme-surface-muted px-2 py-0.5 font-mono text-xs text-theme-label">
              {nodes.length} steps
            </span>
          </div>

          <form onSubmit={saveFlow} aria-busy={action === "save"} className="space-y-5">
            <div>
              <label htmlFor="flow-name" className="label">
                Flow template name
              </label>
              <input
                id="flow-name"
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={busy || flowsLoading}
                required
              />
            </div>

            <ol className="space-y-3.5">
              {nodes.map((node, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-theme-border bg-theme-surface-muted/20 p-4 transition-colors focus-within:border-theme-border-muted"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-theme-fg">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                      <span>Step {index + 1}</span>
                    </div>

                    {nodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNode(index)}
                        disabled={busy || flowsLoading}
                        className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                    <div>
                      <label htmlFor={`step-type-${index}`} className="label !text-[11px]">
                        Step type
                      </label>
                      <select
                        id={`step-type-${index}`}
                        className="input !text-xs"
                        value={node.type}
                        disabled={busy || flowsLoading}
                        onChange={(event) =>
                          updateNode(index, { type: event.target.value as DraftNode["type"] })
                        }
                      >
                        <option value="message">Speak message</option>
                        <option value="question">Ask question</option>
                        <option value="end">End call</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`step-text-${index}`} className="label !text-[11px]">
                        Spoken script
                      </label>
                      <textarea
                        id={`step-text-${index}`}
                        rows={2}
                        className="input !text-xs resize-y"
                        value={node.text}
                        disabled={busy || flowsLoading}
                        onChange={(event) => updateNode(index, { text: event.target.value })}
                        placeholder="What should the receptionist say?"
                        required
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              disabled={busy || flowsLoading}
              onClick={() => setNodes((current) => [...current, { type: "message", text: "" }])}
              className="btn-secondary w-full border-dashed !py-2 !text-xs gap-1.5"
            >
              <Plus size={14} aria-hidden="true" />
              Add dialogue step
            </button>

            <div className="border-t border-theme-border/60 pt-4 flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-xs text-theme-label">
                {action === "save"
                  ? "Saving steps to your API…"
                  : "Saving commits a new version to use for calls."}
              </p>

              <button
                type="submit"
                disabled={busy || flowsLoading}
                className="btn-primary gap-1.5 disabled:opacity-50"
              >
                <Save size={14} aria-hidden="true" />
                {action === "save" ? "Saving flow…" : "Save & activate flow"}
              </button>
            </div>

            <Feedback notice={saveNotice} />
          </form>
        </section>

        {/* Right Column: Add Contact + Outbound Calling */}
        <div className="space-y-6">
          {/* Add Customer Directory */}
          <section
            aria-labelledby="contact-title"
            className="card space-y-4 shadow-sm"
          >
            <div className="border-b border-theme-border/60 pb-3">
              <h2 id="contact-title" className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2">
                <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                2. Test contact directory
              </h2>
              <p className="mt-0.5 text-xs text-theme-label">
                Add numbers authorized for test calls.
              </p>
            </div>

            <form onSubmit={addContact} aria-busy={action === "contact"} className="space-y-3">
              <div>
                <label htmlFor="customer-name" className="label">
                  Contact name <span className="font-normal text-theme-label">(optional)</span>
                </label>
                <input
                  id="customer-name"
                  autoComplete="name"
                  className="input"
                  value={contactName}
                  disabled={busy || contactsLoading}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="e.g. Jordan Miller"
                />
              </div>

              <div>
                <label htmlFor="customer-phone" className="label">
                  Phone number
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  autoComplete="tel"
                  aria-describedby="phone-hint"
                  className="input font-mono text-xs"
                  value={phone}
                  disabled={busy || contactsLoading}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+14155550199"
                  required
                />
                <p id="phone-hint" className="mt-1 text-[11px] text-theme-label">
                  Include international country code prefix (e.g. +1 for US).
                </p>
              </div>

              <button
                type="submit"
                disabled={busy || contactsLoading}
                className="btn-secondary w-full !text-xs !py-2 gap-1.5"
              >
                <Plus size={14} aria-hidden="true" />
                {action === "contact" ? "Adding contact…" : "Add contact"}
              </button>
            </form>

            <Feedback notice={contactNotice} />
          </section>

          {/* Place Outbound Call */}
          <section
            aria-labelledby="call-title"
            className="card space-y-4 shadow-sm"
          >
            <div className="border-b border-theme-border/60 pb-3">
              <h2 id="call-title" className="text-base font-semibold tracking-tight text-theme-fg flex items-center gap-2">
                <PhoneCall size={16} className="text-indigo-600 dark:text-indigo-400" />
                3. Place outbound test call
              </h2>
              <p className="mt-0.5 text-xs text-theme-label">
                Dispatches a real outbound call via telephony worker.
              </p>
            </div>

            {flowsLoading ? (
              <div role="status" className="space-y-2">
                <div className="h-9 rounded-lg bg-theme-surface-muted animate-pulse" />
                <div className="h-16 rounded-lg bg-theme-surface-muted animate-pulse" />
              </div>
            ) : (
              <div>
                <label htmlFor="call-flow" className="label">
                  Active flow version
                </label>
                <select
                  id="call-flow"
                  className="input !text-xs"
                  value={selectedFlow}
                  disabled={busy || flows.length === 0}
                  onChange={(event) => {
                    setSelectedFlow(event.target.value);
                    setCallTarget(null);
                  }}
                >
                  <option value="">Select a saved flow</option>
                  {flows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name} (v{flow.version})
                    </option>
                  ))}
                </select>
                {!flows.length && !flowError && (
                  <p className="mt-1 text-[11px] text-theme-label">
                    Save the flow on the left to activate calling.
                  </p>
                )}
              </div>
            )}

            {contactsLoading ? (
              <div role="status" className="h-16 rounded-lg bg-theme-surface-muted animate-pulse" />
            ) : (
              <>
                {!contacts.length && !contactError ? (
                  <div className="rounded-lg border border-dashed border-theme-border p-4 text-center">
                    <p className="text-xs text-theme-label">No contacts in directory yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-theme-border border-t border-theme-border/60 pt-2">
                    {contacts.map((contact) => (
                      <li
                        key={contact.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-theme-fg">
                            {contact.name || "Guest contact"}
                          </p>
                          <p className="font-mono text-[11px] text-theme-label">
                            {contact.phone_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy || flowsLoading || !selectedFlow}
                          aria-label={`Prepare call to ${contact.name || contact.phone_number}`}
                          onClick={() => {
                            setCallTarget(contact);
                            setCallNotice(null);
                          }}
                          className="btn-secondary !text-xs !py-1.5 gap-1.5"
                        >
                          <PhoneCall size={12} aria-hidden="true" />
                          Call
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {/* Call Confirmation Dialog / Banner */}
            {callTarget && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 space-y-3">
                <p className="font-semibold">Confirm live outbound call</p>
                <p>
                  Dial{" "}
                  <strong className="font-mono text-theme-fg">{callTarget.phone_number}</strong>{" "}
                  using flow &ldquo;{flows.find((f) => f.id === selectedFlow)?.name}&rdquo;?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startCall(callTarget)}
                    className="btn-primary !text-xs !py-1.5 gap-1.5"
                  >
                    <ArrowRight size={13} aria-hidden="true" />
                    {action === "call" ? "Dialing…" : "Place call"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCallTarget(null)}
                    className="btn-secondary !text-xs !py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <Feedback notice={callNotice} />
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { api, type ChatMessage } from "@/lib/api";

export default function TestChat({ businessId }: { businessId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!businessId || !text.trim() || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text.trim() }];
    setBusy(true); setError("");
    try {
      const result = await api.businesses.testChat(businessId, next);
      setMessages([...next, { role: "assistant", content: result.reply }]);
      setProvider(result.provider); setText("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reach your agent. Try again."); }
    finally { setBusy(false); }
  }

  return <section className="card space-y-4" aria-labelledby="test-chat-title">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-theme-label">Try a conversation</p><h2 id="test-chat-title" className="mt-2 text-xl font-semibold tracking-tight">Test your agent</h2><p className="mt-2 text-sm text-theme-label">Uses saved settings. No phone call or minutes required.</p></div>
    <div role="log" aria-live="polite" aria-label="Test conversation" className="max-h-96 min-h-44 space-y-3 overflow-y-auto rounded-xl bg-theme-bg p-3">
      {!messages.length && <div className="py-7 text-center text-sm text-theme-label"><p>{businessId ? "Your agent is ready for a question." : "Save your setup to start testing."}</p><p className="mt-2 text-xs">Try “What services do you offer?”</p></div>}
      {messages.map((message, i) => <div key={i} className={`rounded-xl border border-theme-border p-3 text-sm ${message.role === "user" ? "ml-5 bg-theme-surface-muted" : "mr-5 bg-theme-surface"}`}><p className="mb-1 text-xs font-semibold">{message.role === "user" ? "You" : "Agent"}</p><p className="whitespace-pre-wrap break-words">{message.content}</p></div>)}
      {busy && <p role="status" className="text-sm text-theme-label">Agent is thinking…</p>}
    </div>
    {provider && <p className="text-xs text-theme-label">Answered by {provider === "faq" ? "FAQ fallback" : provider}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} Your message is still here.</p>}
    <label className="block text-sm font-medium">Your message<textarea className="input mt-2" rows={2} value={text} onChange={event => setText(event.target.value)} disabled={!businessId || busy} placeholder="Ask a caller’s question…" /></label>
    <div className="flex flex-wrap justify-between gap-2"><button type="button" className="btn-secondary" disabled={busy || !messages.length} onClick={() => { setMessages([]); setProvider(""); setError(""); }}>Reset chat</button><button type="button" className="btn-primary disabled:opacity-50" disabled={!businessId || busy || !text.trim()} onClick={send}>{busy ? "Sending…" : "Send message"}</button></div>
  </section>;
}

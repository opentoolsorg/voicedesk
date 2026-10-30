"use client";

import { useState } from "react";
import { Bot, RotateCcw, Send, Sparkles, User } from "lucide-react";
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
    setBusy(true);
    setError("");
    try {
      const result = await api.businesses.testChat(businessId, next);
      setMessages([...next, { role: "assistant", content: result.reply }]);
      setProvider(result.provider);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach your agent. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <section
      className="card space-y-4 shadow-sm"
      aria-labelledby="test-chat-title"
    >
      <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Bot size={15} aria-hidden="true" />
          </span>
          <div>
            <h2 id="test-chat-title" className="text-sm font-semibold tracking-tight text-theme-fg">
              Test conversation
            </h2>
            <p className="text-[11px] text-theme-label">Simulate caller interaction with your agent</p>
          </div>
        </div>

        {provider && (
          <span className="rounded border border-theme-border bg-theme-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-theme-label">
            {provider === "faq" ? "FAQ match" : provider}
          </span>
        )}
      </div>

      {/* Message Stream */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Test conversation log"
        className="max-h-96 min-h-56 space-y-3 overflow-y-auto rounded-lg border border-theme-border bg-theme-surface-muted/30 p-3.5 text-xs"
      >
        {!messages.length && (
          <div className="py-8 text-center text-theme-label">
            <Sparkles size={22} className="mx-auto mb-2 text-emerald-700 opacity-80" aria-hidden="true" />
            <p className="font-medium text-theme-fg">
              {businessId ? "Agent is ready for your test call" : "Save your agent setup to start testing"}
            </p>
            <p className="mt-1 text-[11px]">
              Try asking: &ldquo;What are your business hours?&rdquo; or &ldquo;Can I book an appointment?&rdquo;
            </p>
          </div>
        )}

        {messages.map((message, i) => {
          const isUser = message.role === "user";
          return (
            <div
              key={i}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                  isUser
                    ? "bg-theme-btn-primary text-theme-btn-primary-fg shadow-sm"
                    : "border border-theme-border bg-theme-surface text-theme-fg shadow-sm"
                }`}
              >
                <div
                  className={`mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                    isUser ? "opacity-75" : "text-emerald-800 dark:text-emerald-400"
                  }`}
                >
                  {isUser ? <User size={10} /> : <Bot size={10} />}
                  <span>{isUser ? "You (Caller)" : "AI Receptionist"}</span>
                </div>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-theme-label italic py-1">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-600" />
            <span>Receptionist is formulating response…</span>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      )}

      {/* Input Form */}
      <div>
        <label className="label !text-[11px]" htmlFor="test-message-input">
          Your test question
        </label>
        <textarea
          id="test-message-input"
          className="input !text-xs resize-none"
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!businessId || busy}
          placeholder={businessId ? "Type a question and press Enter…" : "Save configuration first to enable chat"}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className="btn-secondary !text-xs !py-1.5 gap-1.5"
          disabled={busy || !messages.length}
          onClick={() => {
            setMessages([]);
            setProvider("");
            setError("");
          }}
        >
          <RotateCcw size={12} aria-hidden="true" />
          Reset chat
        </button>
        <button
          type="button"
          className="btn-primary !text-xs !py-1.5 gap-1.5 disabled:opacity-50"
          disabled={!businessId || busy || !text.trim()}
          onClick={send}
        >
          <Send size={12} aria-hidden="true" />
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
    </section>
  );
}

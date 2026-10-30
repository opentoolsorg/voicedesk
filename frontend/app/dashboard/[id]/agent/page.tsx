"use client";

import { useBusinessId } from "../ui";
import { useEffect, useState } from "react";
import { Bot, CheckCircle2, RotateCcw, Save, Sparkles } from "lucide-react";
import { api, type Business } from "@/lib/api";
import AgentFields, {
  agentPayload,
  configDraft,
  type AgentDraft,
} from "../../components/AgentFields";
import TestChat from "../../components/TestChat";

export default function AgentPage() {
  const id = useBusinessId();
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);

  const dirty = Boolean(
    draft &&
      JSON.stringify({
        agent: draft,
        name: business?.name,
        timezone: business?.timezone,
        vertical: business?.vertical,
      }) !== baseline
  );

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setDraft(null);
    Promise.all([api.businesses.getConfig(id), api.businesses.get(id)])
      .then(([config, result]) => {
        if (!live) return;
        const next = configDraft(config);
        setDraft(next);
        setBusiness(result);
        setBaseline(
          JSON.stringify({
            agent: next,
            name: result.name,
            timezone: result.timezone,
            vertical: result.vertical,
          })
        );
      })
      .catch((err) => {
        if (live)
          setError(
            err instanceof Error ? err.message : "Could not load agent settings."
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, retry]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || !business || busy) return;
    if (
      !business.name.trim() ||
      !draft.agent_name.trim() ||
      !draft.greeting.trim()
    ) {
      setError("Business name, agent name, and greeting cannot be blank.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.businesses.update(id, {
        name: business.name.trim(),
        timezone: business.timezone,
        vertical: business.vertical,
      });
      setBusiness(updated);
      const config = await api.businesses.updateConfig(id, agentPayload(draft));
      const next = configDraft(config);
      setDraft(next);
      setBaseline(
        JSON.stringify({
          agent: next,
          name: updated.name,
          timezone: updated.timezone,
          vertical: updated.vertical,
        })
      );
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save settings. Your changes are still here."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-theme-surface-muted animate-pulse" />
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
          <div className="h-96 rounded-xl border border-theme-border bg-theme-surface p-6 animate-pulse" />
          <div className="h-96 rounded-xl border border-theme-border bg-theme-surface p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!draft || !business) {
    return (
      <div className="card space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-theme-fg">
          Agent settings unavailable
        </h1>
        <p role="alert" className="text-xs text-theme-label">
          {error || "No configuration found for this business."}
        </p>
        <button
          type="button"
          className="btn-secondary !text-xs"
          onClick={() => setRetry(retry + 1)}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-fg sm:text-3xl">
          Receptionist settings
        </h1>
        <p className="mt-1 text-sm text-theme-label">
          Configure business details, speech personality, and operational rules for your AI agent.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        {/* Settings Form */}
        <form onSubmit={save} className="card space-y-7 shadow-sm" aria-busy={busy}>
          <fieldset disabled={busy} className="min-w-0 space-y-7">
            {/* Core Business Metadata */}
            <div className="border-b border-theme-border/60 pb-6">
              <h2 className="text-base font-semibold tracking-tight text-theme-fg">
                Workspace profile
              </h2>
              <p className="mt-1 text-xs text-theme-label">
                Basic identity and scheduling timezone for this location.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Business name</label>
                  <input
                    required
                    className="input"
                    value={business.name}
                    onChange={(event) =>
                      setBusiness({ ...business, name: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">Timezone</label>
                  <select
                    className="input text-xs"
                    value={business.timezone}
                    onChange={(event) =>
                      setBusiness({ ...business, timezone: event.target.value })
                    }
                  >
                    {Array.from(
                      new Set([
                        business.timezone,
                        "America/New_York",
                        "America/Chicago",
                        "America/Denver",
                        "America/Los_Angeles",
                        "Europe/London",
                        "Europe/Paris",
                        "Asia/Kolkata",
                        "Asia/Singapore",
                        "Australia/Sydney",
                        "UTC",
                      ])
                    ).map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Business category</label>
                  <select
                    className="input text-xs capitalize"
                    value={business.vertical}
                    onChange={(event) =>
                      setBusiness({ ...business, vertical: event.target.value })
                    }
                  >
                    {Array.from(
                      new Set([
                        business.vertical,
                        "restaurant",
                        "dental",
                        "real_estate",
                        "hr",
                        "ecommerce",
                        "salon",
                        "repair",
                        "general",
                      ])
                    ).map((vertical) => (
                      <option key={vertical} value={vertical}>
                        {vertical.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Agent Voice & Call Handling Fields */}
            <AgentFields
              value={draft}
              onChange={(value) => {
                setDraft(value);
                setSaved(false);
              }}
              showVoice
            />
          </fieldset>

          {error && (
            <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {error} Your changes are still intact.
            </p>
          )}

          {/* Sticky/Card Save Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme-border/60 pt-4">
            <div className="flex items-center gap-2 text-xs">
              {busy ? (
                <span className="text-theme-label">Saving configuration…</span>
              ) : dirty ? (
                <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              ) : saved ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  All changes saved
                </span>
              ) : (
                <span className="text-theme-label">Settings up to date</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary gap-1.5 disabled:opacity-50"
              disabled={busy || !dirty}
            >
              <Save size={14} aria-hidden="true" />
              {busy ? "Saving changes…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Test Chat Panel */}
        <aside className="space-y-4 xl:sticky xl:top-20">
          <TestChat key={id} businessId={id} />
          {dirty && (
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
              Save changes above to apply new instructions to test conversations.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

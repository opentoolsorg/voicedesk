"use client";

import { HelpCircle, Plus, Trash2 } from "lucide-react";

export interface FaqEntry {
  question: string;
  answer: string;
}

export default function FaqEditor({
  value,
  onChange,
}: {
  value: FaqEntry[];
  onChange: (value: FaqEntry[]) => void;
}) {
  return (
    <fieldset className="space-y-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold tracking-tight text-theme-fg">
          Frequently asked questions ({value.length})
        </legend>
        <button
          type="button"
          className="btn-secondary !py-1.5 !px-2.5 !text-xs gap-1.5"
          onClick={() => onChange([...value, { question: "", answer: "" }])}
        >
          <Plus size={13} aria-hidden="true" />
          Add FAQ
        </button>
      </div>

      {!value.length && (
        <div className="rounded-lg border border-dashed border-theme-border p-4 text-center">
          <HelpCircle size={20} className="mx-auto text-theme-label mb-1.5" />
          <p className="text-xs text-theme-label">
            No FAQs added yet. Give your receptionist instant answers to common caller questions.
          </p>
        </div>
      )}

      {value.map((entry, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-theme-border bg-theme-surface-muted/20 p-4 transition-colors focus-within:border-theme-border-muted"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-label">
              Question #{index + 1}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={`Remove question ${index + 1}`}
            >
              <Trash2 size={13} aria-hidden="true" />
              Remove
            </button>
          </div>

          <div>
            <label className="label !text-[11px]">Caller question</label>
            <input
              className="input text-xs"
              value={entry.question}
              onChange={(event) =>
                onChange(
                  value.map((item, i) =>
                    i === index ? { ...item, question: event.target.value } : item
                  )
                )
              }
              placeholder="e.g. Do you accept walk-in consultations?"
              required
            />
          </div>

          <div>
            <label className="label !text-[11px]">Agent answer</label>
            <textarea
              className="input text-xs"
              rows={2}
              value={entry.answer}
              onChange={(event) =>
                onChange(
                  value.map((item, i) =>
                    i === index ? { ...item, answer: event.target.value } : item
                  )
                )
              }
              placeholder="e.g. Yes! We accept walk-ins on weekdays between 9 AM and 4 PM."
              required
            />
          </div>
        </div>
      ))}
    </fieldset>
  );
}

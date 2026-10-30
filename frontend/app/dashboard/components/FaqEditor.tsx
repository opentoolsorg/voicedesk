"use client";

export interface FaqEntry { question: string; answer: string }

export default function FaqEditor({ value, onChange }: { value: FaqEntry[]; onChange: (value: FaqEntry[]) => void }) {
  return <fieldset className="space-y-3">
    <legend className="mb-2 text-sm font-semibold">Frequently asked questions</legend>
    {!value.length && <p className="text-sm text-theme-label">No FAQs yet. Add answers your callers ask for most.</p>}
    {value.map((entry, index) => <div key={index} className="rounded-xl border border-theme-border p-4 space-y-3">
      <label className="block text-sm">Question {index + 1}<input className="input mt-1" value={entry.question} onChange={event => onChange(value.map((item, i) => i === index ? { ...item, question: event.target.value } : item))} placeholder="Do you accept walk-ins?" required /></label>
      <label className="block text-sm">Answer<textarea className="input mt-1" rows={2} value={entry.answer} onChange={event => onChange(value.map((item, i) => i === index ? { ...item, answer: event.target.value } : item))} required /></label>
      <button type="button" className="text-xs font-medium underline underline-offset-4" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label={`Remove question ${index + 1}`}>Remove question</button>
    </div>)}
    <button type="button" className="btn-secondary" onClick={() => onChange([...value, { question: "", answer: "" }])}>+ Add question</button>
  </fieldset>;
}

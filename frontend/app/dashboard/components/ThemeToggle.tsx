"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Choice = "light" | "dark" | "system";
const KEY = "voicedesk-theme";
const OPTIONS: { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export default function ThemeToggle() {
  // Light is the product default; the layout script already applied any saved choice before paint.
  const [choice, setChoice] = useState<Choice>("light");

  useEffect(() => {
    let saved: Choice = "light";
    try { saved = (localStorage.getItem(KEY) as Choice) || "light"; } catch { /* storage blocked */ }
    setChoice(saved);
  }, []);

  useEffect(() => {
    apply(choice);
    if (choice !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  function select(next: Choice) {
    setChoice(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage blocked */ }
  }

  return (
    <div role="group" aria-label="Color theme" className="inline-flex items-center gap-0.5 rounded-lg border border-theme-border bg-theme-surface p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => select(value)}
          aria-pressed={choice === value}
          title={`${label} theme`}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
            choice === value
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "text-theme-label hover:bg-theme-surface-muted hover:text-theme-fg"
          }`}
        >
          <Icon size={15} aria-hidden="true" />
          <span className="sr-only">{label} theme</span>
        </button>
      ))}
    </div>
  );
}

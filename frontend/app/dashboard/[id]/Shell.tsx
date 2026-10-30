"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BarChart3, CalendarDays, GitBranch, Menu, MessageSquare, Mic, Phone, PhoneCall, Settings2, Wallet, X } from "lucide-react";
import { api } from "@/lib/api";
import { useBusinessId, useResource } from "./ui";

const links = [
  ["Overview", "", BarChart3], ["Calls", "/calls", PhoneCall], ["Messages", "/messages", MessageSquare],
  ["Appointments", "/appointments", CalendarDays], ["Agent", "/agent", Settings2], ["Phone", "/phone", Phone],
  ["Billing", "/billing", Wallet], ["Call flows", "/flow", GitBranch],
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const id = useBusinessId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: business, loading, error, retry } = useResource(useCallback(() => api.businesses.get(id), [id]));
  const base = `/dashboard/${id}`;
  return <div className="min-h-screen bg-theme-bg text-theme-fg">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-theme-surface focus:p-3">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-theme-border bg-theme-surface p-5 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-3 text-lg font-bold tracking-tight"><span className="rounded-xl bg-theme-btn-primary p-2 text-theme-btn-primary-fg"><Mic size={18} aria-hidden="true" /></span>VoiceDesk</Link>
      <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-label">Your workspace</p>
      <nav aria-label="Workspace" className="space-y-1">{links.map(([name, suffix, Icon]) => <Link key={name} href={`${base}${suffix}`} aria-current={pathname.replace(/\/$/, "") === `${base}${suffix}` ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${pathname.replace(/\/$/, "") === `${base}${suffix}` ? "bg-theme-surface-muted text-theme-fg" : "text-theme-label hover:bg-theme-bg"}`}><Icon size={18} aria-hidden="true" />{name}</Link>)}</nav>
      <div className="mt-auto rounded-2xl border border-theme-border bg-theme-bg p-4"><p className="text-sm font-medium">A warmer welcome.</p><p className="mt-1 text-xs leading-5 text-theme-label">Every conversation, in one place.</p><Link href={`${base}/agent`} className="mt-3 inline-block text-xs font-semibold underline underline-offset-4">Meet your receptionist</Link></div>
    </aside>
    <div className="lg:pl-60">
      <header className="border-b border-theme-border bg-theme-surface px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><button type="button" className="btn-secondary !p-2 lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-workspace-nav" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button><div className="min-w-0"><p className="truncate text-sm font-semibold">{business?.name ?? (loading ? "Loading workspace…" : "Workspace unavailable")}</p>{error ? <button className="text-xs underline" onClick={retry}>Retry workspace details</button> : <Link href={`${base}/phone`} className="text-xs text-theme-label hover:underline">{business?.phone_number ?? "No number yet"}</Link>}</div></div>
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-xs font-medium text-theme-label"><ArrowLeft size={15} aria-hidden="true" /><span className="hidden sm:inline">All businesses</span><span className="sm:hidden">Businesses</span></Link>
        </div>
        {open && <nav id="mobile-workspace-nav" aria-label="Mobile workspace" className="mt-4 grid grid-cols-2 gap-1 border-t border-theme-border pt-3 lg:hidden">{links.map(([name, suffix, Icon]) => <Link key={name} href={`${base}${suffix}`} onClick={() => setOpen(false)} aria-current={pathname.replace(/\/$/, "") === `${base}${suffix}` ? "page" : undefined} className={`flex items-center gap-2 rounded-xl p-3 text-sm ${pathname.replace(/\/$/, "") === `${base}${suffix}` ? "bg-theme-surface-muted font-semibold" : "text-theme-label"}`}><Icon size={16} aria-hidden="true" />{name}</Link>)}</nav>}
      </header>
      <main id="workspace-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  </div>;
}

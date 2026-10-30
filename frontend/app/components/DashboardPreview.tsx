import Link from "next/link";

// Real screenshot of the seeded demo dashboard; regenerate public/dashboard-preview.png when the UI changes.
export function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
      <div aria-hidden="true" className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-transparent blur-2xl" />
      <Link
        href="/dashboard"
        aria-label="Open the VoiceDesk dashboard"
        className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_24px_60px_-20px_rgba(6,78,59,0.25)] ring-1 ring-zinc-950/5 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 font-mono text-[11px] text-zinc-500 ring-1 ring-zinc-200">
            voicedesk.princepal.dev/dashboard
          </span>
        </div>
        <img
          src="/dashboard-preview.png"
          alt="VoiceDesk dashboard overview showing call volume, answer rate, bookings, outcomes and recent calls"
          width={1440}
          height={900}
          className="block h-auto w-full"
          fetchPriority="high"
        />
      </Link>
    </div>
  );
}

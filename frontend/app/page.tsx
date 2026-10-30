import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CodeBlock,
  GithubLogo,
  MicrophoneStage,
  Phone,
  Stack,
  TerminalWindow,
  TreeStructure,
} from "@phosphor-icons/react/dist/ssr";

const repository = "https://github.com/princepal9120/voicedesk";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";

const steps = [
  {
    title: "Give your agent a business.",
    description: "Create a workspace, choose a business type, and keep each client’s configuration in its own place.",
    detail: "01 / Set the context",
  },
  {
    title: "Make the conversation yours.",
    description: "Configure the prompt, knowledge, and call flow. Inspect the logic before connecting it to a phone number.",
    detail: "02 / Shape the flow",
  },
  {
    title: "Connect voice. Review the calls.",
    description: "Configure your voice and telephony providers, then use call logs and transcripts to understand what happened.",
    detail: "03 / Connect and learn",
  },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-[#f8f9f6] text-zinc-900 [font-family:var(--font-geist-sans),sans-serif] selection:bg-emerald-200">
      <a href="#main" className={`sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-3 focus:not-sr-only ${focus}`}>
        Skip to content
      </a>
      <header className="border-b border-zinc-200/80">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="VoiceDesk home" className={`flex items-center gap-2.5 rounded-md ${focus}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100">
              <MicrophoneStage aria-hidden="true" weight="fill" size={20} />
            </span>
            <span className="text-xl font-semibold tracking-[-0.05em]">VoiceDesk<span className="text-emerald-700">.</span></span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-zinc-600 md:flex">
            <a href="#workflow" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>How it works</a>
            <a href="#self-host" className={`rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>Self-host</a>
            <a href={repository} className={`flex items-center gap-1.5 rounded-sm transition-colors hover:text-zinc-950 ${focus}`}>
              <GithubLogo aria-hidden="true" size={17} /> Source code
            </a>
          </div>
          <Link href="/dashboard" className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-900 active:bg-emerald-950 ${focus}`}>
            Open dashboard <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </nav>
      </header>

      <main id="main">
        <section aria-labelledby="hero-title" className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" aria-hidden="true" />
              Open source. Self-hosted. Yours to build.
            </p>
            <h1 id="hero-title" className="mt-6 max-w-xl text-5xl font-medium leading-[1.06] tracking-[-0.065em] [text-wrap:balance] sm:text-6xl lg:text-[4.25rem]">
              Your voice agents.<br /><span className="text-emerald-800">Your own stack.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
              Build AI phone agents for real businesses. Manage workspaces, shape conversations, and review calls in one open-source dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/dashboard" className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800 active:bg-emerald-950 ${focus}`}>
                Explore the workspace <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <a href="#self-host" className={`inline-flex min-h-12 items-center gap-2 rounded-sm text-sm font-medium underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-emerald-800 ${focus}`}>
                Run it locally <TerminalWindow aria-hidden="true" size={18} />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 border-t border-zinc-200 pt-5 text-xs text-zinc-600">
              {["MIT licensed", "Docker quickstart", "No keys needed to boot"].map((item) => (
                <span key={item} className="flex items-center gap-1.5"><Check aria-hidden="true" size={14} className="text-emerald-700" />{item}</span>
              ))}
            </div>
          </div>

          <figure className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_24px_70px_-35px_rgba(19,56,40,0.3)] sm:p-3">
            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-2"><Stack aria-hidden="true" size={15} /> Inside VoiceDesk</span>
              <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium">Illustrative workflow · not live data</span>
            </figcaption>
            <div className="rounded-xl border border-zinc-200 bg-[#fafbf9]">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-4 sm:px-5">
                <div><p className="text-sm font-semibold">Business workspace</p><p className="mt-1 text-xs text-zinc-500">Configure → connect → review</p></div>
                <span className="rounded-md bg-emerald-50 p-2 text-emerald-800"><TreeStructure aria-hidden="true" size={20} /></span>
              </div>
              <div className="grid grid-cols-[2rem_1fr] gap-x-3 px-4 py-6 sm:px-6">
                <div className="flex flex-col items-center" aria-hidden="true"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-emerald-800"><Stack size={17} /></span><span className="min-h-8 w-px flex-1 bg-zinc-200" /></div>
                <div className="pb-6"><p className="text-sm font-medium">Business context</p><p className="mt-1.5 text-xs leading-5 text-zinc-500">Name, business type, and agent configuration</p></div>
                <div className="flex flex-col items-center" aria-hidden="true"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800"><TreeStructure size={17} /></span><span className="min-h-8 w-px flex-1 bg-zinc-200" /></div>
                <div className="pb-6">
                  <p className="text-sm font-medium">Conversation flow</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                    <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-2">Greeting</span><ArrowRight aria-hidden="true" size={12} /><span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-900">Understand intent</span><ArrowRight aria-hidden="true" size={12} /><span className="rounded-md border border-zinc-200 bg-white px-2.5 py-2">Respond</span>
                  </div>
                </div>
                <div className="flex justify-center" aria-hidden="true"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-emerald-800"><Phone size={17} /></span></div>
                <div><p className="text-sm font-medium">Voice connection</p><p className="mt-1.5 text-xs leading-5 text-zinc-500">Requires provider credentials and telephony setup</p></div>
              </div>
              <div className="mx-4 mb-4 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 sm:mx-5">
                <p className="text-xs font-medium">Call history and transcripts</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Review actual activity after your agent is connected.</p>
              </div>
            </div>
            <Link href="/dashboard" className={`m-2 flex items-center justify-between rounded-md px-2 py-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-50 ${focus}`}>
              Open the real dashboard <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          </figure>
        </section>

        <section aria-label="Platform capabilities" className="border-y border-zinc-200 bg-white/60">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8">
            {[
              ["Built for multiple businesses", "Separate workspaces, one place to manage."],
              ["Inspectable by design", "Prompts, flows, and source you can change."],
              ["Hosted on your terms", "Run the dashboard and API on your infrastructure."],
            ].map(([title, description]) => (
              <div key={title}><h2 className="text-sm font-medium">{title}</h2><p className="mt-1.5 text-xs leading-5 text-zinc-500">{description}</p></div>
            ))}
          </div>
        </section>

        <section id="workflow" aria-labelledby="workflow-title" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <div>
            <p className="text-xs font-medium text-emerald-800">From business context to conversation</p>
            <h2 id="workflow-title" className="mt-4 max-w-md text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-4xl">A clear path from<br />setup to the phone.</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-600">Start with the dashboard. Add your voice stack when you’re ready. Keep the configuration and the operational view together.</p>
            <Link href="/dashboard/new" className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-emerald-800 transition-colors hover:text-emerald-950 ${focus}`}>Create a business <ArrowRight aria-hidden="true" size={16} /></Link>
          </div>
          <ol className="divide-y divide-zinc-200 border-y border-zinc-200">
            {steps.map((step) => (
              <li key={step.title} className="py-7 first:pt-6">
                <p className="font-mono text-[11px] text-emerald-800">{step.detail}</p>
                <h3 className="mt-3 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-zinc-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="self-host" aria-labelledby="hosting-title" className="border-y border-zinc-200 bg-[#eef2ec]">
          <div className="mx-auto grid max-w-7xl gap-9 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium text-emerald-800"><CodeBlock aria-hidden="true" size={16} /> Not a black box</p>
              <h2 id="hosting-title" className="mt-4 text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-4xl">Clone it. Run it.<br />Make it your own.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600">With Docker Compose and Make installed, boot the API and dashboard without API keys. SQLite is the default—no separate database to set up.</p>
              <a href={`${repository}/blob/main/README.md#-quickstart-one-command`} className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 hover:text-emerald-950 ${focus}`}>Read the setup guide <ArrowUpRight aria-hidden="true" size={16} /></a>
            </div>
            <div className="min-w-0 self-center rounded-xl border border-zinc-300 bg-[#f8faf6]">
              <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3 text-xs text-zinc-500"><TerminalWindow aria-hidden="true" size={15} /> Local quickstart</div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-8 text-zinc-800 sm:text-sm"><code>{`git clone https://github.com/princepal9120/voicedesk
cd voicedesk
make up`}</code></pre>
              <div className="border-t border-zinc-200 px-5 py-4 text-xs leading-6 text-zinc-600">
                <p>Dashboard: <code className="text-zinc-900">localhost:3000</code></p>
                <p>API docs: <code className="text-zinc-900">localhost:8000/docs</code></p>
                <p className="mt-2 text-zinc-500">Voice needs provider credentials. Real phone calls also need telephony configuration; booting the dashboard does not place calls.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="start-title" className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 sm:py-20 md:flex-row md:items-center">
          <div><p className="text-xs font-medium text-emerald-800">Start with a workspace</p><h2 id="start-title" className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Build the agent your business needs.</h2></div>
          <Link href="/dashboard" className={`inline-flex min-h-12 shrink-0 items-center gap-3 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-900 active:bg-emerald-950 ${focus}`}>Open dashboard <ArrowRight aria-hidden="true" size={18} /></Link>
        </section>
      </main>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-7 text-xs text-zinc-500 sm:px-8">
          <p><span className="font-semibold text-zinc-800">VoiceDesk</span> / Open-source voice infrastructure</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5">
            <a href={repository} className={`rounded-sm hover:text-emerald-800 ${focus}`}>GitHub</a>
            <a href={`${repository}/blob/main/SETUP.md`} className={`rounded-sm hover:text-emerald-800 ${focus}`}>Documentation</a>
            <a href={`${repository}/blob/main/LICENSE`} className={`rounded-sm hover:text-emerald-800 ${focus}`}>MIT license</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

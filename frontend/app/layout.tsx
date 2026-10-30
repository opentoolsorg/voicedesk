import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceDesk | Open-source AI receptionist platform",
  description:
    "VoiceDesk is an open-source white-label AI receptionist platform with an OpenAI-first demo path and a production voice stack for live deployments.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

// Runs before paint so a saved dark choice never flashes light. Dashboard only; the landing page stays light.
const themeScript = `try{if(location.pathname.startsWith("/dashboard")){var t=localStorage.getItem("voicedesk-theme")||"light";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-theme-bg text-theme-fg min-h-[100dvh] font-sans antialiased selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}

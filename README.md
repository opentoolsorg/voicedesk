# VoiceDesk ☎ — Open-Source AI Voice Agent Platform

[![Site](https://img.shields.io/badge/Site-voicedesk.princepal.dev-0B9F95?style=flat-square&logo=cloudflare&logoColor=white)](https://voicedesk.princepal.dev)
[![API Docs](https://img.shields.io/badge/API_Docs-localhost%3A8000%2Fdocs-teal?style=flat-square)](http://localhost:8000/docs)
[![Dashboard](https://img.shields.io/badge/Dashboard-voicedesk.princepal.dev%2Fdashboard-0B9F95?style=flat-square&logo=cloudflare&logoColor=white)](https://voicedesk.princepal.dev/dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

## Sponsors

[![Awesome Solo Founder OSS](https://img.shields.io/badge/Awesome%20Solo%20Founder%20OSS-Curated%20OSS%20stack%20for%20solo%20founders-teal?style=flat-square)](https://github.com/princepal9120/awesome-solo-founder-oss)
[![Shiba](https://img.shields.io/badge/Shiba-AI%20Coworker%20on%20Cloudflare-0B9F95?style=flat-square&logo=cloudflare&logoColor=white)](https://github.com/opentoolsorg/shiba)

VoiceDesk is an open-source, white-label AI voice-agent platform: configure niche phone agents (restaurant, dental, real estate, support), design conversational call flows, provision telephony numbers, and review call recordings and transcripts. Run locally in one command with zero keys, or deploy the API and dashboard serverlessly to Cloudflare Python Workers backed by Cloudflare D1.

**Live Deployment:** [https://voicedesk.princepal.dev](https://voicedesk.princepal.dev)

- **Landing Page:** [https://voicedesk.princepal.dev/](https://voicedesk.princepal.dev/)
- **Operations Dashboard:** [https://voicedesk.princepal.dev/dashboard](https://voicedesk.princepal.dev/dashboard)
- **Local API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (when running locally)

---

## Repository layout

~~~text
.
├── Makefile                # one-command targets: up, voice, deploy-cf, test
├── docker-compose.yml      # local multi-container stack (api + frontend + voice)
├── backend/                # FastAPI application + LiveKit voice agent
│   ├── app/                # REST endpoints, core database models, telephony services
│   ├── agent/              # LiveKit voice worker runtime (Sarvam / OpenAI)
│   ├── src/worker.py       # Cloudflare Python Worker entrypoint (Pyodide FastAPI)
│   ├── wrangler.jsonc      # Cloudflare Worker configuration + D1 bindings
│   └── pyproject.toml      # Python dependencies (split: Pyodide core vs server extras)
├── frontend/               # Next.js 16 (React 19, Tailwind CSS)
│   ├── app/                # App router: landing, dashboard overview, business, flow builder
│   ├── lib/api.ts          # API client with same-origin and fallback resolution
│   └── wrangler.jsonc      # Static assets configuration
└── scripts/
    ├── deploy-cloudflare.sh # One-command Cloudflare build, D1 setup, and deploy script
    └── smoke_e2e.py        # End-to-end deployment verification harness
~~~

---

## ✨ Features & Capabilities

| Feature | Description |
|---|---|
| 🎙 **Live Voice Telephony** | Real phone calls via Twilio or Exotel + LiveKit, Deepgram, and Sarvam voice models |
| 🧠 **Niche Agent Presets** | Battle-tested prompt and tool templates for Dental, Restaurant, Real Estate, HR, and Support |
| 📊 **Operational Dashboard** | Real-time call tracking, call duration metrics, transcript summaries, and lead management |
| 🌳 **Visual Flow Builder** | Step-by-step conversational call flow designer with linear routing and dynamic nodes |
| 🗄 **Zero-Install Database** | SQLite by default locally — no external Postgres or Redis required to get started |
| ☁️ **Cloudflare Native** | Deployable as a Cloudflare Python Worker + D1 SQLite database in one command |
| 🔒 **Self-Hosted & Private** | Your customer data, call logs, and credentials stay under your infrastructure control |

---

## ⚡ Quickstart (Local Development)

Requirements: Docker Engine or Python 3.12+ with Node.js 20+.

### 1. Zero-key dashboard (recommended)

Boot the entire API and dashboard locally with zero configuration and zero API keys:

~~~bash
git clone https://github.com/opentoolsorg/voicedesk
cd voicedesk
make up
~~~

Open **http://localhost:3000** for the dashboard, and **http://localhost:8000/docs** for the FastAPI interactive documentation.

### 2. Connect voice worker (one key)

To enable live telephone calling and voice agent processing:

~~~bash
cp backend/.env.example backend/.env
# Edit backend/.env and set SARVAM_API_KEY=sk_... (or OPENAI_API_KEY=sk-...)
make voice
~~~

The voice agent worker only starts under the `voice` profile, so `make up` never blocks on missing provider keys.

### 3. Manual development (without Docker)

Run services directly in separate terminals:

~~~bash
# Terminal 1 - Backend API
cd backend && uv pip install --system -e . && uvicorn app.main:app --reload

# Terminal 2 - Frontend Dashboard
cd frontend && npm install && npm run dev
~~~

---

## ☁️ Deploy to Cloudflare (one command)

Run the FastAPI API as a **Cloudflare Python Worker** backed by **Cloudflare D1** (serverless SQLite), with the Next.js static export served directly from the same Worker.

~~~bash
make deploy-cf
~~~

The deployment script (`scripts/deploy-cloudflare.sh`):
1. Verifies `wrangler` authentication.
2. Compiles the Next.js frontend with `npm run build:cf` into static export assets.
3. Automatically creates and binds the Cloudflare D1 database.
4. Deploys the Python Worker and pushes allowlisted secrets from `backend/.env`.
5. Runs `scripts/smoke_e2e.py` against the live URL to verify API and dashboard health.

For multi-account Cloudflare users:
~~~bash
CLOUDFLARE_ACCOUNT_ID=<id> make deploy-cf
~~~

Local Cloudflare Worker emulation:
~~~bash
cd backend && uv run --group workers pywrangler dev
~~~

*Note:* Because the LiveKit voice worker (`run_agent.py`) maintains persistent audio WebSockets, it runs on any long-lived container or VM. Point it at your deployed D1 database over REST:
`DATABASE_URL=cloudflare_d1+async://<ACCOUNT_ID>:<API_TOKEN>@<D1_DATABASE_ID>`

---

## 🧩 Templates

Each template bundles a specialized system prompt, domain tools, and question-answering heuristics:

| Template | Use Case | Default Agent Name |
|---|---|---|
| `restaurant` | Table reservations, opening hours, menu FAQs | Bella |
| `dental` | Patient scheduling, insurance coverage, clinic directions | Aria |
| `real-estate` | Inbound lead qualification, scheduling property viewings | Max |
| `hr` | Automated candidate phone screening | Sam |
| `ecommerce` | Order status lookup, returns processing, support triage | Nova |
| `custom` | Blank scaffold for custom business logic and prompts | Alex |

---

## 🏗 Architecture & Data Flow

~~~text
Inbound / Outbound Phone Call
  │
  ▼
Telephony Carrier (Twilio PSTN / Exotel SIP)
  │
  ▼
LiveKit Cloud / Self-Hosted WebRTC Room
  │
  ├── Audio In ──► Speech-to-Text (Deepgram / Sarvam Bulbul)
  │                      │
  │                      ▼
  ├── Agent Logic ◄── LLM Inference (OpenAI / Sarvam-30B)
  │                      │
  │                      ▼
  └── Audio Out ◄── Text-to-Speech (Cartesia / Sarvam Saaras)
  │
  ▼
FastAPI API (Local Uvicorn / Cloudflare Python Worker)
  │
  ▼
Database Layer (Local SQLite / PostgreSQL / Cloudflare D1)
  │
  ▼
Next.js 16 Dashboard (Call Records, Transcripts, Business Workspaces)
~~~

### Environments

- **Default Local**: SQLite file database (`voicedesk.db`), in-memory rate limiting, LiveKit / Sarvam models.
- **Enterprise Container**: PostgreSQL (`DATABASE_URL=postgresql+asyncpg://...`), Redis rate limiting.
- **Serverless Cloudflare**: Cloudflare Python Worker, Cloudflare D1 storage, Cloudflare Pages assets.

---

## 🧪 Testing & Verification

Run the verification test suite:

~~~bash
# Backend unit & integration tests
pytest backend/tests

# Frontend typecheck & static export build
cd frontend && npx tsc --noEmit && npm run build:cf
~~~

---

## License

MIT License. See [LICENSE](LICENSE).


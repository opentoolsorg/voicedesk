# Contributing to VoiceDesk ☎

Thank you for your interest in contributing to VoiceDesk! We want to build the most developer-friendly, robust, and zero-config AI voice receptionist platform.

Here is how you can help.

---

## 🛠 Local Setup

VoiceDesk is divided into two core components:
1. **`backend/`** — FastAPI + SQLAlchemy + LiveKit voice agent server and Cloudflare Python Worker.
2. **`frontend/`** — Next.js operational dashboard and static export assets.

### Prerequisites

- Python 3.10+
- Node.js 18+

### Step-by-Step Installation

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/princepal9120/voicedesk
   cd voicedesk
   ```

2. **Initialize Local Database & Environment:**
   Run the interactive CLI setup wizard to bootstrap the environment variables and SQLite database:
   ```bash
   make up
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   # Install dependencies (virtualenv recommended)
   pip install -r requirements.txt
   # Start local dev server
   uvicorn app.main:app --reload --port 8000
   ```

4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧩 Adding Niche Presets

One of the best ways to contribute is by adding template presets for specific industries. 

Templates live in `backend/app/template_data.py`, one entry per preset in the `TEMPLATES` dict:
```python
"veterinary": {
  "id": "veterinary",
  "name": "Veterinary Clinic",
  "agent_name": "Oliver",
  "system_prompt": "You are a professional veterinary assistant...",
  "tools": [
    {
      "name": "book_appointment",
      "description": "Schedule a pet checkup",
      "parameters": { ... }
    }
  ]
}
```

If you add a new template, make sure to add it to the table in the main `README.md`.

---

## 🤝 Code Style & Guidelines

- **Python (Backend & CLI):** Follow PEP 8 guidelines. Write clean, asynchronous code. Use standard type hinting.
- **TypeScript/React (Frontend):** Avoid generic layouts. Follow the Bento Grid 2.0 design layout using Framer Motion animations and Phosphor Icons as established in the dashboard.
- **Git Commit Messages:** Keep them descriptive:
  - `feat: add veterinary template preset`
  - `fix: correct SQLite WAL mode connection pool issue`
  - `docs: update deployment guidelines`

---

## 🚀 Pull Request Process

1. Create a fresh branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes and write automated tests if applicable.
3. Push to your fork and submit a Pull Request to our `main` branch.
4. Ensure your PR description lists the issue it solves and outlines how you tested the changes.

By contributing, you agree your work is licensed under the same [MIT](https://opensource.org/licenses/MIT) license as this project.

Thank you again for making VoiceDesk amazing! 🚀

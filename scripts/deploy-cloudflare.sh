#!/usr/bin/env bash
# One-command Cloudflare deploy: D1 + FastAPI Python Worker + dashboard (Workers Static Assets).
# Usage: scripts/deploy-cloudflare.sh   (optional backend/.env supplies secrets)
set -euo pipefail
cd "$(dirname "$0")/.."

for bin in uv npm python3; do
  command -v "$bin" >/dev/null || { echo "missing: $bin (uv: https://docs.astral.sh/uv/)"; exit 1; }
done

echo "→ installing wrangler"
npm --prefix backend install --silent
wrangler() { (cd backend && npx wrangler "$@"); }
wrangler whoami >/dev/null 2>&1 || wrangler login

echo "→ building dashboard (static export, same-origin API)"
npm --prefix frontend ci --silent
npm --prefix frontend run build:cf

echo "→ deploying Python Worker (creates the D1 database on first run)"
# The ~17 MB Python bundle upload sometimes drops on slow links (EPIPE); retry, keyed on a URL in the output.
for attempt in 1 2 3; do
  out=$(cd backend && uv run --group workers pywrangler deploy 2>&1 | tee /dev/stderr) || true
  # Prefer the custom domain from wrangler.jsonc routes, else workers.dev.
  domain=$(grep -Eo '[a-z0-9.-]+ \(custom domain\)' <<<"$out" | head -1 | cut -d' ' -f1 || true)
  url=${domain:+https://$domain}
  url=${url:-$(grep -Eo 'https://[a-z0-9.-]+\.workers\.dev' <<<"$out" | head -1)}
  [ -n "$url" ] && break
  echo "↻ deploy attempt $attempt failed, retrying"
done
[ -n "$url" ] || { echo "✘ deploy failed (no URL in wrangler output)"; exit 1; }

echo "→ setting secrets"
# Only known secret keys are pushed; local-only settings like DATABASE_URL stay behind.
trap 'rm -f backend/.secrets.json' EXIT
umask 077
python3 - "$url" > backend/.secrets.json <<'PY'
import json, pathlib, sys
keys = {"APP_SECRET_KEY", "OPENAI_API_KEY", "SARVAM_API_KEY", "DEEPGRAM_API_KEY", "CARTESIA_API_KEY",
        "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER", "TELEPHONY_PROVIDER", "EXOTEL_API_KEY", "EXOTEL_API_TOKEN",
        "EXOTEL_ACCOUNT_SID", "EXOTEL_CALLER_ID", "EXOTEL_FLOW_URL", "EXOTEL_WEBHOOK_TOKEN"}
env = pathlib.Path("backend/.env")
pairs = [l.split("=", 1) for l in env.read_text().splitlines() if "=" in l and not l.lstrip().startswith("#")] if env.exists() else []
secrets = {k.strip(): v.strip().strip('"') for k, v in pairs if k.strip() in keys and v.strip()}
if sys.argv[1]:
    secrets["PUBLIC_BASE_URL"] = sys.argv[1]
print(json.dumps(secrets))
PY
wrangler secret bulk .secrets.json

echo "→ smoke test"
# workers.dev resolves immediately; a fresh custom domain can take minutes to appear in DNS.
smoke_url=$(grep -Eo 'https://[a-z0-9.-]+\.workers\.dev' <<<"$out" | head -1)
python3 scripts/smoke_e2e.py "${smoke_url:-$url}"
echo "✓ VoiceDesk is live: $url"

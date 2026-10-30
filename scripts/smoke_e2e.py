"""End-to-end smoke for VoiceDesk on a Worker URL: python3 e2e.py <base_url>"""
import json, sys, time, urllib.request, urllib.error

base = sys.argv[1].rstrip("/")


def call(method, path, body=None, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={"content-type": "application/json", "user-agent": "voicedesk-smoke/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            text = r.read().decode()
            return r.status, (text if raw else (json.loads(text) if text else None))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


for _ in range(60):
    try:
        if call("GET", "/health")[0] == 200: break
    except Exception: pass
    time.sleep(2)

checks = []
def check(name, cond, detail=""):
    checks.append(bool(cond)); print(("PASS" if cond else "FAIL"), name, "" if cond else detail)

s, h = call("GET", "/health"); check("health", s == 200, h)
s, ag = call("GET", "/api/v1/agencies/me"); check("agency", s == 200, ag)
s, biz = call("POST", "/api/v1/businesses/", {"name": "E2E Bistro", "vertical": "restaurant"}); check("create business", s == 201, biz)
bid = biz["id"] if s == 201 else "x"
s, cfg = call("GET", f"/api/v1/businesses/{bid}/config"); check("get config", s == 200, cfg)
s, cfg = call("PATCH", f"/api/v1/businesses/{bid}/config", {"agent_name": "Bella2"}); check("patch config", s == 200 and cfg.get("agent_name") == "Bella2", cfg)
s, lst = call("GET", "/api/v1/businesses/"); check("list businesses", s == 200 and any(b["id"] == bid for b in lst), lst)
s, c = call("GET", f"/api/v1/calls/?business_id={bid}"); check("list calls", s == 200, c)
s, st = call("GET", f"/api/v1/calls/business/{bid}/stats"); check("call stats", s == 200, st)
s, fl = call("POST", f"/api/v1/businesses/{bid}/flows", {"name": "f1", "nodes": [{"id": "n1", "type": "message", "text": "hi"}]}); check("create flow", s in (200, 201), fl)
s, fl = call("GET", f"/api/v1/businesses/{bid}/flows"); check("list flows", s == 200, fl)
s, ct = call("POST", f"/api/v1/businesses/{bid}/contacts", {"name": "Ann", "phone_number": "+14155550100"}); check("create contact", s in (200, 201), ct)
s, html = call("GET", f"/dashboard/{bid}", raw=True); check("dashboard deep link", s == 200 and "<html" in html, html[:120])
s, html = call("GET", f"/dashboard/{bid}/flow", raw=True); check("flow deep link", s == 200 and "<html" in html, html[:120])
s, html = call("GET", "/dashboard/new", raw=True); check("new page", s == 200 and "<html" in html, html[:120])
s, txt = call("GET", f"/dashboard/{bid}.txt", raw=True); check("rsc payload", s == 200, txt[:120])
s, x = call("POST", "/webhooks/twilio/voice", None); check("twilio webhook rejects junk", s in (403, 422), x)

# AI-receptionist dashboard
s, seeded = call("POST", f"/api/v1/businesses/{bid}/demo-data"); check("seed demo data", s == 200 and seeded.get("calls", 0) > 0, seeded)
s, an = call("GET", f"/api/v1/businesses/{bid}/analytics?days=30")
check("analytics", s == 200 and an["total_calls"] == seeded["calls"] and len(an["daily"]) == 30 and len(an["hourly"]) == 24, an)
s, booked = call("GET", f"/api/v1/calls/?business_id={bid}&outcome=booked"); check("calls outcome filter", s == 200 and booked and all(c["outcome"] == "booked" for c in booked), booked)
s, detail = call("GET", f"/api/v1/calls/{booked[0]['id']}" if booked else "/api/v1/calls/x"); check("call detail", s == 200 and detail.get("transcript") and detail.get("bookings"), detail)
s, csv = call("GET", f"/api/v1/calls/export?business_id={bid}", raw=True); check("csv export", s == 200 and csv.startswith("started_at"), csv[:80])
s, msgs = call("GET", f"/api/v1/businesses/{bid}/messages"); check("messages", s == 200 and all(m["outcome"] in ("message", "lead") for m in msgs), msgs)
s, bks = call("GET", f"/api/v1/businesses/{bid}/bookings"); check("bookings", s == 200 and len(bks) > 0, bks)
s, bk = call("PATCH", f"/api/v1/bookings/{bks[0]['id']}" if bks else "/api/v1/bookings/x", {"status": "completed"}); check("booking status", s == 200 and bk.get("status") == "completed", bk)
s, cfg = call("PATCH", f"/api/v1/businesses/{bid}/config", {"faq": [{"question": "Do you have parking?", "answer": "Yes, free parking behind the building."}]}); check("save faq", s == 200, cfg)
s, chat = call("POST", f"/api/v1/businesses/{bid}/test-chat", {"messages": [{"role": "user", "content": "Is there parking?"}]}); check("test chat", s == 200 and chat.get("reply"), chat)
s, pl = call("PATCH", f"/api/v1/businesses/{bid}", {"plan": "pro"}); check("change plan", s == 200 and pl.get("plan") == "pro", pl)
for page in ("calls", "messages", "appointments", "agent", "phone", "billing"):
    s, html = call("GET", f"/dashboard/{bid}/{page}", raw=True); check(f"page /{page}", s == 200 and "<html" in html, html[:80])
s, _ = call("DELETE", f"/api/v1/businesses/{bid}"); check("delete business", s == 204, _)
print(f"\n{sum(checks)}/{len(checks)} passed")
sys.exit(0 if all(checks) else 1)

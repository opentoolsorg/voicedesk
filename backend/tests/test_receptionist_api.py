import os
import tempfile

_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_db.name}"
os.environ["OPENAI_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.main import app, init_db  # noqa: E402

API = "/api/v1"


def test_receptionist_flow():
    with TestClient(app) as c:
        biz = c.post(f"{API}/businesses/", json={"name": "Smile Dental", "vertical": "dental"}).json()
        bid = biz["id"]
        assert biz["plan"] == "starter"

        seeded = c.post(f"{API}/businesses/{bid}/demo-data").json()
        assert seeded["calls"] >= 30 and seeded["bookings"] > 0
        assert c.post(f"{API}/businesses/{bid}/demo-data").json() == seeded  # idempotent
        assert len(c.get(f"{API}/calls/?business_id={bid}&limit=200").json()) == seeded["calls"]

        a = c.get(f"{API}/businesses/{bid}/analytics?days=30").json()
        assert a["total_calls"] == seeded["calls"] and a["bookings_count"] == seeded["bookings"]
        assert sum(a["outcomes"].values()) == seeded["calls"]
        assert len(a["daily"]) == 30 and sum(d["calls"] for d in a["daily"]) == seeded["calls"]
        assert a["outcomes"]["booked"] == seeded["bookings"]
        assert a["outcomes"]["voicemail"] and a["outcomes"]["failed"]
        assert [h["hour"] for h in a["hourly"]] == list(range(24))
        assert sum(h["calls"] for h in a["hourly"]) == seeded["calls"]

        export = c.get(f"{API}/calls/export?business_id={bid}&outcome=booked")
        assert export.headers["content-type"].startswith("text/csv")
        assert "attachment" in export.headers["content-disposition"]
        lines = export.text.strip().splitlines()
        assert lines[0] == "started_at,direction,caller_name,caller_number,duration_sec,outcome,summary"
        assert len(lines) == 1 + a["outcomes"]["booked"]

        booked = c.get(f"{API}/calls/?business_id={bid}&outcome=booked&limit=200").json()
        assert len(booked) == a["outcomes"]["booked"]
        assert all(x["outcome"] == "booked" for x in booked)
        name = booked[0]["caller_name"]
        found = c.get(f"{API}/calls/?business_id={bid}&q={name}").json()
        assert found and all(name in (x["caller_name"] or "") for x in found)

        detail = c.get(f"{API}/calls/{booked[0]['id']}").json()
        assert 4 <= len(detail["transcript"]) <= 8 and "text" in detail["transcript"][0]
        assert len(detail["bookings"]) == 1

        bookings = c.get(f"{API}/businesses/{bid}/bookings").json()
        assert len(bookings) == seeded["bookings"]
        assert c.get(f"{API}/businesses/{bid}/bookings?upcoming=true").json()
        c.patch(f"{API}/bookings/{bookings[1]['id']}", json={"notes": "x"})
        from app.core.database import engine
        with engine.begin() as conn:
            conn.execute(text("UPDATE bookings SET appointment_at = NULL WHERE id = :i"), {"i": bookings[1]["id"]})
        assert bookings[1]["id"] in [b["id"] for b in c.get(f"{API}/businesses/{bid}/bookings?upcoming=true").json()]
        patched = c.patch(f"{API}/bookings/{bookings[0]['id']}", json={"status": "cancelled", "notes": "n"}).json()
        assert patched["status"] == "cancelled" and patched["notes"] == "n"

        msgs = c.get(f"{API}/businesses/{bid}/messages").json()
        assert len(msgs) == a["messages_count"] + a["leads_count"]
        assert all(m["outcome"] in ("message", "lead") for m in msgs)

        faq = c.get(f"{API}/businesses/{bid}/config").json()["faq"][0]
        chat = c.post(f"{API}/businesses/{bid}/test-chat", json={"messages": [{"role": "user", "content": faq["question"]}]}).json()
        assert chat == {"reply": faq["answer"], "provider": "faq"}  # templates seed normalized FAQs

        def ask(question):
            r = c.post(f"{API}/businesses/{bid}/test-chat", json={"messages": [{"role": "user", "content": question}]})
            return r.json()

        c.patch(f"{API}/businesses/{bid}/config", json={"faq": [{"question": "Where is parking?", "answer": "Behind the building."}], "services": ["Cleaning"]})
        assert ask("Where is parking?") == {"reply": "Behind the building.", "provider": "faq"}
        assert c.get(f"{API}/businesses/{bid}/config").json()["services"] == [{"name": "Cleaning"}]
        c.patch(f"{API}/businesses/{bid}/config", json={"faq": [{"q": "Pets allowed?", "a": "Yes, on leashes."}]})
        assert ask("Pets allowed?")["reply"] == "Yes, on leashes."
        with engine.begin() as conn:  # legacy rows written straight to the DB still answer
            conn.execute(text("UPDATE agent_configs SET faq = :f WHERE business_id = :b"), {"f": '[{"q": "Wifi password?", "a": "Ask at the desk."}]', "b": bid})
        assert ask("Wifi password?")["reply"] == "Ask at the desk."

        assert c.patch(f"{API}/businesses/{bid}", json={"plan": "pro"}).json()["plan"] == "pro"
        assert c.patch(f"{API}/businesses/{bid}", json={"plan": "gold"}).status_code == 422
        cfg = c.patch(f"{API}/businesses/{bid}/config", json={"greeting": "Hi", "take_messages": False}).json()
        assert cfg["greeting"] == "Hi" and cfg["take_messages"] is False and cfg["booking_enabled"] is True


def test_init_db_adds_missing_columns():
    with tempfile.NamedTemporaryFile(suffix=".db") as f:
        eng = create_engine(f"sqlite:///{f.name}")
        with eng.begin() as conn:
            conn.execute(text("CREATE TABLE businesses (id VARCHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL)"))
            conn.execute(text("INSERT INTO businesses VALUES ('b1', 'Old')"))
        init_db(eng)
        with eng.connect() as conn:
            cols = {r[1] for r in conn.execute(text("PRAGMA table_info(businesses)"))}
            assert {"plan", "timezone", "created_at"} <= cols
            assert conn.execute(text("SELECT plan FROM businesses")).scalar() == "starter"

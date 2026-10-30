"""Receptionist dashboard endpoints: analytics, bookings, messages, demo data, agent test chat."""

from __future__ import annotations

import random
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Literal

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import Session

from app.api.calls import BookingOut
from app.api.deps import get_current_agency
from app.api.workflows import owned_business
from app.core.agent_data import normalize_faq, normalize_services
from app.core.config import get_settings
from app.core.database import get_db
from app.models.agency import Agency
from app.models.business import AgentConfig, Business
from app.models.call import Booking, Call

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()

WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"


class BookingUpdate(BaseModel):
    status: Literal["confirmed", "completed", "cancelled", "no_show"] | None = None
    notes: str | None = None


class MessageOut(BaseModel):
    id: str
    caller_number: str | None
    caller_name: str | None
    summary: str | None
    outcome: str
    started_at: datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatIn(BaseModel):
    messages: list[ChatMessage]


async def _config(db: Session, business_id: str) -> AgentConfig:
    config = db.execute(
        select(AgentConfig).where(AgentConfig.business_id == business_id)
    ).scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return config


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/businesses/{business_id}/analytics")
async def get_analytics(
    business_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    business = await owned_business(db, agency.id, business_id)
    days = max(1, min(days, 365))
    today = datetime.utcnow().date()
    first = today - timedelta(days=days - 1)
    calls = db.execute(
        select(Call).where(
            Call.business_id == business.id,
            Call.started_at >= datetime.combine(first, datetime.min.time()),
        )
    ).scalars().all()

    try:
        tz = ZoneInfo(business.timezone)
    except Exception:
        tz = timezone.utc  # Pyodide may lack tzdata; bucket hours in UTC rather than fail.
    hourly = [0] * 24
    daily = {first + timedelta(days=i): [0, 0] for i in range(days)}
    outcomes: dict[str, int] = {}
    total_sec = 0
    for c in calls:
        sec = c.duration_sec or 0
        total_sec += sec
        bucket = daily.get(c.started_at.date())
        if bucket:
            bucket[0] += 1
            bucket[1] += sec
        hourly[c.started_at.replace(tzinfo=timezone.utc).astimezone(tz).hour] += 1
        if c.outcome:
            outcomes[c.outcome] = outcomes.get(c.outcome, 0) + 1

    call_ids = [c.id for c in calls]
    bookings_count = (
        len(db.execute(select(Booking.id).where(Booking.call_id.in_(call_ids))).all()) if call_ids else 0
    )
    answered = sum(1 for c in calls if c.status == "answered")
    return {
        "days": days,
        "total_calls": len(calls),
        "answered_calls": answered,
        "missed_calls": outcomes.get("missed", 0),
        "minutes_used": round(total_sec / 60, 1),
        "avg_duration_sec": round(total_sec / answered, 1) if answered else 0,
        "bookings_count": bookings_count,
        "leads_count": outcomes.get("lead", 0),
        "messages_count": outcomes.get("message", 0),
        "spam_count": outcomes.get("spam", 0),
        "outcomes": outcomes,
        "hourly": [{"hour": h, "calls": n} for h, n in enumerate(hourly)],
        "daily": [
            {"date": d.isoformat(), "calls": n, "minutes": round(sec / 60, 1)}
            for d, (n, sec) in daily.items()
        ],
    }


# ── Bookings & messages ───────────────────────────────────────────────────────

@router.get("/businesses/{business_id}/bookings", response_model=list[BookingOut])
async def list_bookings(
    business_id: str,
    upcoming: bool | None = None,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    business = await owned_business(db, agency.id, business_id)
    query = select(Booking).where(Booking.business_id == business.id)
    now = datetime.utcnow()
    if upcoming is True:
        query = query.where(
            or_(Booking.appointment_at >= now, Booking.appointment_at.is_(None))
        ).order_by(Booking.appointment_at)
    else:
        if upcoming is False:
            query = query.where(Booking.appointment_at < now)
        query = query.order_by(desc(Booking.appointment_at))
    return db.execute(query).scalars().all()


@router.patch("/bookings/{booking_id}", response_model=BookingOut)
async def update_booking(
    booking_id: str,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    await owned_business(db, agency.id, booking.business_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/businesses/{business_id}/messages", response_model=list[MessageOut])
async def list_messages(
    business_id: str,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    business = await owned_business(db, agency.id, business_id)
    return db.execute(
        select(Call)
        .where(Call.business_id == business.id, Call.outcome.in_(["message", "lead"]))
        .order_by(desc(Call.started_at))
    ).scalars().all()


# ── Demo data ─────────────────────────────────────────────────────────────────

FIRST = ["Maria", "James", "Priya", "Daniel", "Aisha", "Tom", "Sofia", "Ravi", "Emily", "Marcus", "Hana", "Luis"]
LAST = ["Alvarez", "Chen", "Patel", "Okafor", "Nguyen", "Brooks", "Silva", "Kapoor", "Reed", "Walker"]

# Per-vertical flavour: (services, a topical FAQ question, a lead/ message topic)
FLAVOUR = {
    "dental": (["Teeth cleaning", "Check-up", "Whitening", "Filling"], "Do you accept my insurance?", "a toothache"),
    "restaurant": (["Table for 2", "Table for 4", "Table for 6", "Private dining"], "Do you have vegan options?", "a catering order"),
    "real-estate": (["Home viewing", "Valuation visit", "Buyer consult"], "Is the listing on Elm Street still available?", "selling their house"),
    "hr": (["Screening call", "Interview", "Onboarding session"], "What is the status of my application?", "an open role"),
    "ecommerce": (["Order support call", "Returns consult"], "Where is my order?", "a bulk order"),
    "salon": (["Haircut", "Color", "Manicure", "Blow-dry"], "How much is a haircut?", "a wedding party booking"),
    "repair": (["Diagnostic visit", "Screen repair", "Battery swap"], "How long does a repair take?", "a broken device"),
}
GENERAL = (["Consultation", "Appointment", "Site visit"], "What are your opening hours?", "a quote")

OUTCOMES = (
    ["booked"] * 11 + ["faq"] * 9 + ["message"] * 6 + ["lead"] * 4 + ["missed"] * 3
    + ["transferred"] * 2 + ["spam"] * 2 + ["voicemail"] * 2 + ["failed"]
)

# outcome -> (call status, summary) for calls the agent never talked on
UNANSWERED = {
    "missed": ("missed", "Caller hung up before the agent answered."),
    "voicemail": ("voicemail", "Caller left a voicemail."),
    "failed": ("failed", "Call failed to connect."),
}


def _script(outcome: str, name: str, service: str, faq_q: str, faq_a: str, topic: str, agent: str, biz: str, rng: random.Random):
    """Return (transcript turns as (role, text), summary) for one call."""
    hello = (agent, f"Thanks for calling {biz}, this is {agent}. How can I help?")
    if outcome == "booked":
        day = rng.choice(["Tuesday", "Thursday", "Friday", "Saturday"])
        return [
            hello,
            ("user", f"Hi, I'd like to book a {service.lower()}."),
            (agent, "Happy to help. Which day works best for you?"),
            ("user", f"Does {day} afternoon work?"),
            (agent, f"Yes, {day} at 2 PM is open. Can I get your name?"),
            ("user", f"It's {name}."),
            (agent, f"You're all set, {name.split()[0]}. {service} on {day} at 2 PM. See you then!"),
        ], f"{name} booked a {service.lower()} for {day} at 2 PM."
    if outcome == "faq":
        return [
            hello,
            ("user", faq_q),
            (agent, faq_a),
            ("user", "Great, that's all I needed. Thanks."),
            (agent, "Anytime. Have a great day!"),
        ], f"Caller asked: \"{faq_q}\" and got an answer from the knowledge base."
    if outcome == "message":
        return [
            hello,
            ("user", f"I need to talk to someone about {topic}."),
            (agent, "They're unavailable right now. Can I take a message?"),
            ("user", f"Sure, it's {name}. Please call me back this afternoon."),
            (agent, "Got it, I'll pass that along. Anything else?"),
            ("user", "No, thank you."),
        ], f"{name} left a message about {topic} and asked for a callback."
    if outcome == "lead":
        return [
            hello,
            ("user", f"I'm interested in {topic}. Can someone reach out?"),
            (agent, "Absolutely. May I have your name and the best number?"),
            ("user", f"{name}, you can use this number."),
            (agent, "Thanks, the team will follow up shortly."),
        ], f"New lead: {name} is interested in {topic}."
    if outcome == "transferred":
        return [
            hello,
            ("user", "I have an urgent issue, let me speak to a person."),
            (agent, "Of course, transferring you now. Please hold."),
            ("user", "Thank you."),
        ], f"{name} asked for a person and was transferred to the business line."
    return [  # spam
        hello,
        ("user", "Hello, we're calling about your extended vehicle warranty."),
        (agent, "We're not interested. Please remove this number from your list."),
    ], "Automated sales call, flagged as spam."


@router.post("/businesses/{business_id}/demo-data")
async def load_demo_data(
    business_id: str,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    business = await owned_business(db, agency.id, business_id)
    config = await _config(db, business.id)

    # Bookings first: their call FK is SET NULL, which would orphan them.
    old_ids = [
        r[0]
        for r in db.execute(
            select(Call.id).where(Call.business_id == business.id, Call.provider_call_id.like("demo-%"))
        )
    ]
    if old_ids:
        for b in db.execute(select(Booking).where(Booking.call_id.in_(old_ids))).scalars():
            db.delete(b)
        for c in db.execute(select(Call).where(Call.id.in_(old_ids))).scalars():
            db.delete(c)
        db.flush()

    rng = random.Random(business.id)
    services, topical_q, topic = FLAVOUR.get(business.vertical or "", GENERAL)
    faq = normalize_faq(config.faq)
    now = datetime.utcnow()
    n_bookings = 0
    outcomes = list(OUTCOMES)
    rng.shuffle(outcomes)
    for i, outcome in enumerate(outcomes):
        name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
        started = now - timedelta(days=rng.randint(0, 29), hours=rng.randint(0, 10), minutes=rng.randint(0, 59))
        service = rng.choice(services)
        qa = rng.choice(faq) if faq else {"question": topical_q, "answer": "Let me check, one moment. Our team will confirm the details."}
        turns, summary = _script(outcome, name, service, qa["question"], qa["answer"], topic, config.agent_name, business.name, rng)
        unanswered = UNANSWERED.get(outcome)
        duration = (
            rng.randint(15, 60) if outcome == "voicemail" else 0 if unanswered
            else rng.randint(25, 70) if outcome == "spam" else rng.randint(45, 300)
        )
        call = Call(
            business_id=business.id,
            agency_id=business.agency_id,
            provider_call_id=f"demo-{business.id}-{i}",
            direction="inbound",
            caller_number=f"+1{rng.choice(['415', '212', '312', '646'])}555{rng.randint(100, 199):04d}",
            caller_name=None if outcome in ("spam", "missed", "failed") else name,
            duration_sec=duration,
            status=unanswered[0] if unanswered else "answered",
            outcome=outcome,
            summary=unanswered[1] if unanswered else summary,
            transcript=None if unanswered else [
                {"role": "agent" if role == config.agent_name else "user", "content": text, "timestamp": started.isoformat()}
                for role, text in turns
            ],
            recording_url=None,
            started_at=started,
            ended_at=started + timedelta(seconds=duration),
        )
        db.add(call)
        db.flush()
        if outcome == "booked":
            # Alternate future/past so both appointment tabs have rows.
            if n_bookings % 2 == 0:
                at = (now + timedelta(days=rng.randint(1, 14))).replace(minute=0, second=0, microsecond=0)
                status = "confirmed"
            else:
                at = (started + timedelta(days=rng.randint(1, 4))).replace(minute=0, second=0, microsecond=0)
                at = min(at, now - timedelta(hours=1))
                status = rng.choice(["completed", "completed", "completed", "cancelled", "no_show"])
            db.add(Booking(
                business_id=business.id,
                call_id=call.id,
                customer_name=name,
                customer_phone=call.caller_number,
                service=service,
                appointment_at=at,
                duration_min=rng.choice([30, 45, 60]),
                status=status,
                created_at=started,
            ))
            n_bookings += 1
    db.commit()
    return {"calls": len(outcomes), "bookings": n_bookings}


# ── Test chat ─────────────────────────────────────────────────────────────────

def _system_prompt(business: Business, config: AgentConfig) -> str:
    parts = [config.system_prompt, f"Business name: {business.name}."]
    if config.greeting:
        parts.append(f"Greeting: {config.greeting}")
    if config.knowledge_text:
        parts.append(f"Business knowledge:\n{config.knowledge_text}")
    faq = normalize_faq(config.faq)
    if faq:
        parts.append("FAQ:\n" + "\n".join(f"Q: {f['question']}\nA: {f['answer']}" for f in faq))
    # Receptionists must not invent prices, providers, or policies.
    parts.append(
        "Only state facts given above. If you don't know, say so and offer to take a message "
        "or have the team call back. Keep replies to two or three short sentences."
    )
    return "\n\n".join(parts)


def _words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9']+", text.lower()) if len(w) > 2}


def _faq_reply(question: str, business: Business, config: AgentConfig) -> str:
    """Keyword-overlap answer from FAQ, services, hours and knowledge text."""
    asked = _words(question)
    faq = normalize_faq(config.faq)
    candidates = [f"{f['question']} {f['answer']}" for f in faq]
    answers = [f["answer"] for f in faq]
    names = [s["name"] for s in normalize_services(config.services)]
    if names:
        candidates += names
        answers += [f"We offer: {', '.join(names)}."] * len(names)
    if config.business_hours:
        parts = []
        for day, v in config.business_hours.items():
            if isinstance(v, dict):
                v = "closed" if v.get("closed") else f"{v.get('open', '')}-{v.get('close', '')}"
            parts.append(f"{day}: {v}")
        hours = ", ".join(parts)
        candidates.append(f"hours open close when {hours}")
        answers.append(f"Our hours are {hours}.")
    for line in (config.knowledge_text or "").splitlines():
        if line.strip():
            candidates.append(line)
            answers.append(line.strip())
    best, best_score = None, 0
    for text, answer in zip(candidates, answers):
        score = len(asked & _words(text))
        if score > best_score:
            best, best_score = answer, score
    if best:
        return best
    greeting = config.greeting or f"Thanks for calling {business.name}."
    if config.take_messages:
        return f"{greeting} I'm not sure about that one, but I can take a message and have someone call you back."
    return f"{greeting} I'm not sure about that one. Could you rephrase your question?"


async def _workers_ai(env, messages: list[dict]) -> str:
    # Only importable inside the Workers runtime.
    from js import Object
    from pyodide.ffi import to_js

    result = await env.AI.run(WORKERS_AI_MODEL, to_js({"messages": messages}, dict_converter=Object.fromEntries))
    return str(result.response)


async def _openai(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": "gpt-4o-mini", "messages": messages},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


@router.post("/businesses/{business_id}/test-chat")
async def test_chat(
    business_id: str,
    payload: ChatIn,
    request: Request,
    db: Session = Depends(get_db),
    agency: Agency = Depends(get_current_agency),
):
    business = await owned_business(db, agency.id, business_id)
    config = await _config(db, business.id)
    messages = [{"role": "system", "content": _system_prompt(business, config)}] + [
        m.model_dump() for m in payload.messages
    ]

    env = request.scope.get("env")
    if env is not None and getattr(env, "AI", None) is not None:
        try:
            return {"reply": await _workers_ai(env, messages), "provider": "workers-ai"}
        except Exception:
            logger.exception("Workers AI failed, falling back")
    if settings.openai_api_key:
        try:
            return {"reply": await _openai(messages), "provider": "openai"}
        except Exception:
            logger.exception("OpenAI failed, falling back")
    last_user = next((m.content for m in reversed(payload.messages) if m.role == "user"), "")
    return {"reply": _faq_reply(last_user, business, config), "provider": "faq"}

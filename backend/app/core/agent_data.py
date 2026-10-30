"""Canonical shapes for agent FAQ/services; accepts legacy rows already stored in the DB."""


def normalize_faq(items) -> list[dict]:
    """[{q,a}] or [{question,answer}] -> [{question, answer}], dropping empty entries."""
    out = []
    for f in items or []:
        if not isinstance(f, dict):
            continue
        q, a = f.get("question") or f.get("q"), f.get("answer") or f.get("a")
        if q and a:
            out.append({"question": q, "answer": a})
    return out


def normalize_services(items) -> list[dict]:
    """Plain strings become {name}; dicts keep their fields."""
    out = []
    for s in items or []:
        if isinstance(s, str):
            s = {"name": s}
        if isinstance(s, dict) and s.get("name"):
            out.append(s)
    return out

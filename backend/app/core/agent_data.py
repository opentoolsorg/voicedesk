"""Canonical shapes for agent FAQ/services; accepts legacy rows already stored in the DB."""


def normalize_faq(items) -> list[dict]:
    """[{q,a}] or [{question,answer}] -> [{question, answer}], dropping empty entries."""
    out = []
    for f in items or []:
        if not isinstance(f, dict):
            continue
        q = f.get("question") if f.get("question") is not None else f.get("q")
        a = f.get("answer") if f.get("answer") is not None else f.get("a")
        if isinstance(q, str) and isinstance(a, str) and q.strip() and a.strip():
            out.append({"question": q.strip(), "answer": a.strip()})
    return out


def normalize_services(items) -> list[dict]:
    """Plain strings become {name}; dicts keep their fields; duplicate names keep the first."""
    out, seen = [], set()
    for s in items or []:
        if isinstance(s, str):
            s = {"name": s}
        if isinstance(s, dict):
            name = s.get("name")
            if isinstance(name, str) and name.strip() and name.strip() not in seen:
                clean_name = name.strip()
                seen.add(clean_name)
                out.append({**s, "name": clean_name})
    return out


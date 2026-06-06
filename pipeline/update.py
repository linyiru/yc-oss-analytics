#!/usr/bin/env python3
"""Diff the freshly built candidate list against a tracked registry to detect
companies that APPEARED (newly open-source / newly tagged) or DISAPPEARED
(delisted, acquired-and-removed, or lost the tag) since the last run.

Maintains:
  data/registry.json   — canonical tracked state (first_seen / last_seen / status)
  data/changes.json    — the most recent run's diff (for CI summaries / the site)
  data/changelog.ndjson — append-only history of change events

Run after build_candidates.py. Pass the run date as argv[1] (YYYY-MM-DD); defaults
to today. The appeared slugs are printed one per line to stdout for the CI step to
re-analyze.
"""
import json, os, sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATE = sys.argv[1] if len(sys.argv) > 1 else datetime.now(timezone.utc).strftime("%Y-%m-%d")

candidates = json.load(open(f"{ROOT}/data/candidates.json"))
current = {c["slug"]: c for c in candidates}

reg_path = f"{ROOT}/data/registry.json"
registry = json.load(open(reg_path)) if os.path.exists(reg_path) else {"updated": None, "companies": {}}
companies = registry["companies"]

appeared, disappeared, restored = [], [], []

for slug, c in current.items():
    entry = companies.get(slug)
    rec = {"github": c["github"], "batch": c["batch"], "status": c["status"],
           "stars": c["stars"], "source": c["source"], "last_seen": DATE}
    if entry is None:
        rec["first_seen"] = DATE
        rec["state"] = "present"
        companies[slug] = rec
        appeared.append(slug)
    else:
        if entry.get("state") == "absent":
            restored.append(slug)
        rec["first_seen"] = entry.get("first_seen", DATE)
        rec["state"] = "present"
        companies[slug] = rec

# anything in the registry not seen this run = disappeared (kept for history)
for slug, entry in companies.items():
    if slug not in current and entry.get("state") != "absent":
        entry["state"] = "absent"
        entry["absent_since"] = DATE
        disappeared.append(slug)

registry["updated"] = DATE
json.dump(registry, open(reg_path, "w"), indent=1, ensure_ascii=False)

changes = {"date": DATE, "appeared": appeared, "disappeared": disappeared, "restored": restored,
           "total_tracked": len(companies),
           "present": sum(1 for e in companies.values() if e.get("state") == "present")}
json.dump(changes, open(f"{ROOT}/data/changes.json", "w"), indent=1, ensure_ascii=False)

if appeared or disappeared or restored:
    with open(f"{ROOT}/data/changelog.ndjson", "a") as f:
        f.write(json.dumps(changes, ensure_ascii=False) + "\n")

# human summary to stderr; appeared slugs to stdout for the CI re-analyze step
print(f"[{DATE}] tracked={changes['total_tracked']} present={changes['present']} "
      f"appeared={len(appeared)} disappeared={len(disappeared)} restored={len(restored)}",
      file=sys.stderr)
for s in appeared:
    print(s)

#!/usr/bin/env python3
"""Deep-analyze the tracked companies one at a time, disk-safely.

Processes repos sequentially (smallest stars first so giant clones land last and are
removed immediately), skips ones already analyzed, and passes --cleanup so each clone
is deleted right after — hundreds of repos never pile up on disk.

Usage:
  python3 bulk.py            # analyze everything missing, with star curves
  python3 bulk.py --no-stars # skip star-curve backfill (much cheaper on API)
  python3 bulk.py 30         # cap to the first 30 missing (resume-friendly)
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

candidates = json.load(open(f"{ROOT}/data/candidates.json"))
done = {f[:-5] for f in os.listdir(f"{ROOT}/data/repos") if f.endswith(".json")}

cap = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or None
stars = "--no-stars" not in sys.argv

# smallest-first: giant repos clone+delete last, keeping peak disk low
todo = [c for c in sorted(candidates, key=lambda x: x["stars"]) if c["slug"] not in done and c["github"]]
if cap:
    todo = todo[:cap]

print(f"to analyze: {len(todo)} (already done: {len(done)}) | stars={'on' if stars else 'off'}")
for i, c in enumerate(todo, 1):
    args = ["python3", f"{HERE}/run.py", c["slug"], c["github"], "--cleanup"]
    if stars:
        args.append("--stars")
    print(f"[{i}/{len(todo)}] {c['slug']} ({c['github']}) {c['stars']:,}★")
    r = subprocess.run(args)
    if r.returncode != 0:
        print(f"   ! failed {c['slug']} (rc={r.returncode})")
print("bulk analysis complete")

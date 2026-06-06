#!/usr/bin/env python3
"""Backfill star-growth curves into existing data/repos/*.json — API only, no clone.

Reads each analyzed repo, samples its stargazer timestamps to reconstruct a growth curve
(piecewise across ~MAXPTS sampled pages — see README's star-curve caveat / 40k ceiling),
detects the viral window, and merges `stars_curve` + `viral` back into the JSON.

Resumable: repos that already have a curve are skipped. Rate-limit aware.

Usage: python3 star_backfill.py [N]   (cap to first N missing; default all)
"""
import json, os, sys, time
from datetime import datetime
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPOS = f"{ROOT}/data/repos"
MAXPTS = 20

def gh(path, jq=None, header=None):
    a = ["gh", "api", path]
    if header: a += ["-H", header]
    if jq: a += ["--jq", jq]
    return subprocess.run(a, capture_output=True, text=True).stdout

def respect_rate_limit(min_remaining=150):
    try:
        r = json.loads(gh("rate_limit"))["resources"]["core"]
    except Exception:
        return
    if r["remaining"] < min_remaining:
        wait = max(0, r["reset"] - int(time.time())) + 2
        print(f"    · rate limit low ({r['remaining']}); waiting {wait}s")
        time.sleep(wait)

def star_curve(gh_repo, total):
    if not total:
        return [], None
    per = 100
    pages = (total + per - 1) // per
    step = max(1, pages // MAXPTS)
    pts = []
    for p in range(1, pages + 1, step):
        ts = gh(f"repos/{gh_repo}/stargazers?per_page={per}&page={p}",
                jq=".[0].starred_at",
                header="Accept: application/vnd.github.star+json").strip()
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                pts.append({"t": dt.strftime("%Y-%m-%d"), "n": (p - 1) * per + 1})
            except Exception:
                pass
    viral = None
    for i in range(len(pts)):
        ti = datetime.fromisoformat(pts[i]["t"])
        for j in range(i + 1, len(pts)):
            tj = datetime.fromisoformat(pts[j]["t"])
            if (tj - ti).days > 30:
                break
            gain = pts[j]["n"] - pts[i]["n"]
            if not viral or gain > viral["gain"]:
                viral = {"from": pts[i]["t"], "to": pts[j]["t"], "gain": gain, "days": (tj - ti).days or 1}
    return pts, viral

files = sorted(os.listdir(REPOS))
todo = []
for f in files:
    if not f.endswith(".json"):
        continue
    d = json.load(open(f"{REPOS}/{f}"))
    if not d.get("stars_curve"):
        todo.append((f, d))

already_done = len([f for f in files if f.endswith(".json")]) - len(todo)
cap = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or None
if cap:
    todo = todo[:cap]

print(f"backfilling star curves for {len(todo)} repos (already have a curve: {already_done})")
for i, (f, d) in enumerate(todo, 1):
    respect_rate_limit()
    stars = d.get("metrics", {}).get("stars") or 0
    curve, viral = star_curve(d["github"], stars)
    d["stars_curve"] = curve
    d["viral"] = viral
    json.dump(d, open(f"{REPOS}/{f}", "w"), indent=1, ensure_ascii=False)
    print(f"[{i}/{len(todo)}] {d['slug']:20s} {stars:>7,}★ -> {len(curve)} pts"
          + (f", viral +{viral['gain']}/{viral['days']}d" if viral else ""))
print("star backfill complete")

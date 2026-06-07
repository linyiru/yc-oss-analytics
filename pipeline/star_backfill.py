#!/usr/bin/env python3
"""Backfill WEEKLY star-growth curves into data/repos/*.json — API only, no clone.

Fetches every stargazer timestamp (up to GitHub's ~400-page / 40k ceiling) and buckets
cumulative stars by ISO week, so the curve shows real shape — steady climbs vs. event-driven
spikes — instead of a straight line between sparse samples. Repos over 40k stars get their
earliest 40k dated exactly, then a final point at the current total (recent tail approximate;
flagged `curve_partial`). Resumable (skips repos already marked weekly) and rate-limit aware.

Usage: python3 star_backfill.py [N] [--force]
"""
import json, os, sys, time, subprocess, math
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPOS = f"{ROOT}/data/repos"
PAGE_CAP = 400  # GitHub stops paginating stargazers past ~400 pages (40k)

def gh(path, jq=None, header=None):
    a = ["gh", "api", path]
    if header: a += ["-H", header]
    if jq: a += ["--jq", jq]
    return subprocess.run(a, capture_output=True, text=True).stdout

def respect_rate_limit(min_remaining=200):
    try:
        r = json.loads(gh("rate_limit"))["resources"]["core"]
    except Exception:
        return
    if r["remaining"] < min_remaining:
        wait = max(0, r["reset"] - int(time.time())) + 2
        print(f"    · rate limit low ({r['remaining']}); waiting {wait}s", flush=True)
        time.sleep(wait)

def daily_curve(gh_repo, total):
    """Return (points, viral, spikes, partial). points = [{t,n}] cumulative-by-DAY;
    spikes = top single-day jumps (event days — Product Hunt, Show HN, etc.)."""
    if not total:
        return [], None, [], False
    pages = min(PAGE_CAP, math.ceil(total / 100))
    from collections import Counter
    per_day = Counter()
    fetched = 0
    for p in range(1, pages + 1):
        out = gh(f"repos/{gh_repo}/stargazers?per_page=100&page={p}",
                 jq=".[].starred_at", header="Accept: application/vnd.github.star+json")
        for line in out.splitlines():
            line = line.strip()
            if not line:
                continue
            per_day[line[:10]] += 1  # YYYY-MM-DD
            fetched += 1
    if not per_day:
        return [], None, [], False
    partial = fetched < total - 50  # hit the ~40k cap

    days = sorted(per_day)
    pts, cum = [], 0
    for d in days:
        cum += per_day[d]
        pts.append({"t": d, "n": cum})
    if partial:  # giants: end at the true current total so the curve reaches reality
        last = datetime.fromisoformat(days[-1])
        pts.append({"t": (last + timedelta(days=1)).strftime("%Y-%m-%d"), "n": total})

    # top single-day jumps = candidate event days
    spikes = [{"t": d, "gain": per_day[d]} for d, _ in per_day.most_common(6)]

    # viral = largest gain in any 30-day window (overall growth burst)
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
    return pts, viral, spikes, partial

force = "--force" in sys.argv
files = sorted(f for f in os.listdir(REPOS) if f.endswith(".json"))
todo = []
for f in files:
    d = json.load(open(f"{REPOS}/{f}"))
    if force or not d.get("stars_daily"):
        todo.append((f, d))
cap = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or None
if cap:
    todo = todo[:cap]

print(f"daily star backfill: {len(todo)} repos (already daily: {len(files) - len(todo)})", flush=True)
for i, (f, d) in enumerate(todo, 1):
    respect_rate_limit()
    stars = d.get("metrics", {}).get("stars") or 0
    pts, viral, spikes, partial = daily_curve(d["github"], stars)
    d["stars_curve"] = pts
    d["viral"] = viral
    d["star_spikes"] = spikes
    d["stars_daily"] = True
    d["curve_partial"] = partial
    json.dump(d, open(f"{REPOS}/{f}", "w"), indent=1, ensure_ascii=False)
    top = spikes[0] if spikes else None
    print(f"[{i}/{len(todo)}] {d['slug']:20s} {stars:>7,}★ -> {len(pts)} daily pts"
          + (f", top day +{top['gain']:,} on {top['t']}" if top else "")
          + (" (partial, 40k+ cap)" if partial else ""), flush=True)
print("daily star backfill complete", flush=True)

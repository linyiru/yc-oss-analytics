#!/usr/bin/env python3
"""Daily star-growth curves from GH Archive via the public ClickHouse playground.

One SQL query returns daily WatchEvent (= star) counts for many repos at once — no GitHub
API calls, no ~40k pagination cap, fresh to today, and far faster than paging stargazers.
Builds per-day cumulative curves, top single-day spikes (candidate event days — Product Hunt,
Show HN, a launch), and the 30-day viral window. Writes into data/repos/*.json.

Note: GH Archive counts star *events* (gross; un-stars aren't subtracted) and only covers
events since GitHub Archive began, so the event-cumulative can differ slightly from the repo's
current net star count. We keep the daily shape (what matters for event analysis) and tag the
source. Public playground is great for backfill; a scheduled cron should use BigQuery.

Usage: python3 star_clickhouse.py [--batch N]
"""
import json, os, glob, sys, subprocess
from datetime import datetime
from collections import defaultdict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
CH = "https://play.clickhouse.com/?user=play&default_format=TabSeparated"

def ch_query(sql):
    # curl (system CA) — Python urllib lacks CA certs on this platform
    return subprocess.run(["curl", "-s", "--max-time", "120", CH, "--data-binary", sql],
                          capture_output=True, text=True).stdout

def daily_for(repo_names):
    """{repo_name: [(day, count), ...]} for a batch of owner/repo strings."""
    inlist = ",".join("'" + n.replace("'", "") + "'" for n in repo_names)
    sql = (f"SELECT repo_name, toDate(created_at) AS d, count() AS c "
           f"FROM github_events WHERE event_type='WatchEvent' AND repo_name IN ({inlist}) "
           f"GROUP BY repo_name, d ORDER BY repo_name, d")
    out = ch_query(sql)
    res = defaultdict(list)
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) == 3:
            res[parts[0]].append((parts[1], int(parts[2])))
    return res

def build(series, total):
    """series=[(day,count)] sorted -> (pts, viral, spikes, baseline).
    Anchors the cumulative so the curve ends at `total` (GitHub's current star count):
    any stars before our event coverage (old repo names / pre-archive) become a starting
    baseline. Daily shape, spikes and viral window are unaffected by the offset."""
    if not series:
        return [], None, [], 0
    pts, cum = [], 0
    per_day = {}
    for day, c in series:
        cum += c
        pts.append({"t": day, "n": cum})
        per_day[day] = c
    # Reconcile the event-cumulative with GitHub's current star count.
    # Small gap (<15%) = GH Archive under-logging -> SCALE proportionally so the curve runs
    # from ~0 to the true total. Large gap (renames / pre-archive era) = a missing time span ->
    # keep it as a starting BASELINE and flag partial (only T3/by-id recovers the real shape).
    baseline = 0
    gap = (total - cum) if total else 0
    if total and cum and gap > 0:
        if gap <= 0.15 * total:
            scale = total / cum
            for p in pts:
                p["n"] = round(p["n"] * scale)
        else:
            baseline = gap
            for p in pts:
                p["n"] += baseline
    spikes = [{"t": d, "gain": g} for d, g in Counter(per_day).most_common(6)]
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
    return pts, viral, spikes, baseline

def main():
    batch = int(sys.argv[sys.argv.index("--batch") + 1]) if "--batch" in sys.argv else 50
    files = {}
    for f in glob.glob(f"{REPOS}/*.json"):
        d = json.load(open(f))
        if d.get("github"):
            files[d["github"]] = (f, d)
    names = list(files)
    print(f"querying GH Archive (ClickHouse) for {len(names)} repos, batch {batch}", flush=True)
    done = 0
    for i in range(0, len(names), batch):
        chunk = names[i:i + batch]
        data = daily_for(chunk)
        for gh in chunk:
            f, d = files[gh]
            total = d.get("metrics", {}).get("stars") or 0
            series = sorted(data.get(gh, []))
            pts, viral, spikes, baseline = build(series, total)
            d["stars_curve"] = pts
            d["viral"] = viral
            d["star_spikes"] = spikes
            d["stars_daily"] = True
            d["curve_source"] = "gharchive"
            d["curve_baseline"] = baseline  # stars before our event coverage (old names / pre-archive)
            d["curve_partial"] = total and baseline > 0.25 * total  # >25% of stars pre-coverage
            json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
            done += 1
            top = spikes[0] if spikes else None
            print(f"  {d['slug']:20s} {len(pts):>4}d"
                  + (f" baseline {baseline:,}" if baseline else "")
                  + (f", top +{top['gain']:,} {top['t']}" if top else " (no events)"), flush=True)
    print(f"done: {done} repos via GH Archive", flush=True)

if __name__ == "__main__":
    main()

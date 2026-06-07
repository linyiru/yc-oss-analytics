#!/usr/bin/env python3
"""Find each repo's Product Hunt launch via the PH GraphQL API.

Correlates with star spikes the same way as HN (a launch day often *is* a spike day).
The PH developer token is read from the PH_TOKEN env var — never stored in the repo.
For the scheduled cron, set PH_TOKEN as a repository secret.

Usage:  PH_TOKEN=... python3 ph_events.py [N]
"""
import json, os, glob, sys, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
TOKEN = os.environ.get("PH_TOKEN")
ENDPOINT = "https://api.producthunt.com/v2/api/graphql"

def ph(query):
    if not TOKEN:
        sys.exit("set PH_TOKEN env var (a Product Hunt developer token)")
    body = json.dumps({"query": query})
    out = subprocess.run(["curl", "-s", "--max-time", "20", ENDPOINT,
                          "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json",
                          "-d", body], capture_output=True, text=True).stdout
    try:
        return json.loads(out).get("data", {})
    except Exception:
        return {}

def launch_for(slug):
    q = '{ post(slug:"%s"){ name tagline votesCount commentsCount createdAt url } }' % slug.replace('"', "")
    d = ph(q)
    p = (d or {}).get("post")
    if not p or not p.get("createdAt"):
        return None
    return {"date": p["createdAt"][:10], "name": p["name"], "tagline": p.get("tagline"),
            "votes": p.get("votesCount") or 0, "comments": p.get("commentsCount") or 0,
            "url": (p.get("url") or "").split("?")[0]}

repos = sorted((json.load(open(f)) for f in glob.glob(f"{REPOS}/*.json")), key=lambda d: -(d.get("metrics", {}).get("stars") or 0))
n = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or len(repos)
hit = 0
for d in repos[:n]:
    ev = launch_for(d["slug"])
    d["ph_event"] = ev
    json.dump(d, open(f"{REPOS}/{d['slug']}.json", "w"), indent=1, ensure_ascii=False)
    if ev:
        hit += 1
        print(f"  {d['slug']:18s} {ev['date']} · {ev['votes']:>4} votes {ev['comments']:>3}c · {ev['name'][:40]}", flush=True)
    else:
        print(f"  {d['slug']:18s} (no PH launch found)", flush=True)
print(f"\n{hit}/{n} repos matched a Product Hunt launch")

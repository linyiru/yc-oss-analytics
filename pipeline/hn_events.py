#!/usr/bin/env python3
"""Find each repo's Hacker News launch moments (Show HN / Launch HN / links to its site).

Uses the public HN Algolia search API (no token) to locate the stories that drove a repo's
star spikes — so an event day on the star curve can be explained ("this came from a Launch HN
with 259 points"). Precise: matches by the repo's website domain and github URL, plus Show HN
title search. Stores top stories (date, title, url, author, points, comments) as `hn_events`.

Usage: python3 hn_events.py [N]   (sample first N by stars; default all)
"""
import json, os, glob, sys, subprocess, urllib.parse, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"

def algolia(params):
    url = "https://hn.algolia.com/api/v1/search?" + urllib.parse.urlencode(params)
    out = subprocess.run(["curl", "-s", "--max-time", "20", url], capture_output=True, text=True).stdout
    try:
        return json.loads(out).get("hits", [])
    except Exception:
        return []

def domain(url):
    return re.sub(r"^https?://(www\.)?", "", url or "").split("/")[0].lower()

def hits_for(repo):
    name, gh, site = repo["slug"], repo["github"], repo.get("website") or ""
    dom = domain(site)
    org = gh.split("/")[0] if gh else ""
    found = {}
    searches = []
    if dom:
        searches.append({"query": dom, "restrictSearchableAttributes": "url", "tags": "story", "hitsPerPage": 12})
    if gh:
        searches.append({"query": f"github.com/{gh}", "restrictSearchableAttributes": "url", "tags": "story", "hitsPerPage": 12})
    searches.append({"query": name.replace("-", " "), "tags": "show_hn", "hitsPerPage": 12})
    for params in searches:
        for h in algolia(params):
            oid = h.get("objectID")
            if not oid or not h.get("created_at"):
                continue
            # keep stories that actually point at this repo/site, or are a Show/Launch HN of it
            u = (h.get("url") or "").lower()
            title = (h.get("title") or "")
            relevant = (dom and dom in u) or (gh and gh.lower() in u) or \
                (re.search(r"\b(show|launch) hn\b", title, re.I) and name.replace("-", " ").lower() in title.lower())
            if not relevant:
                continue
            found[oid] = {"date": h["created_at"][:10], "title": title, "url": h.get("url") or f"https://news.ycombinator.com/item?id={oid}",
                          "author": h.get("author"), "points": h.get("points") or 0, "comments": h.get("num_comments") or 0,
                          "hn": f"https://news.ycombinator.com/item?id={oid}"}
    return sorted(found.values(), key=lambda x: -x["points"])[:6]

repos = sorted((json.load(open(f)) for f in glob.glob(f"{REPOS}/*.json")), key=lambda d: -(d.get("metrics", {}).get("stars") or 0))
n = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or len(repos)
hit = 0
for d in repos[:n]:
    repo = {"slug": d["slug"], "github": d["github"], "website": d.get("yc", {}).get("website")}
    ev = hits_for(repo)
    d["hn_events"] = ev
    json.dump(d, open(f"{REPOS}/{d['slug']}.json", "w"), indent=1, ensure_ascii=False)
    if ev:
        hit += 1
        top = ev[0]
        print(f"  {d['slug']:18s} {len(ev)} HN · top: {top['date']} {top['points']:>4}pts · {top['title'][:54]}", flush=True)
    else:
        print(f"  {d['slug']:18s} (no HN match)", flush=True)
print(f"\n{hit}/{n} repos matched HN launch moments")

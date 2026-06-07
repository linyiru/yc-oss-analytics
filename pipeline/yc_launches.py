#!/usr/bin/env python3
"""Match each repo to its official YC Launch (ycombinator.com/launches.json).

YC's own launch posts are the most on-target event for these companies. The endpoint is a
paginated Algolia feed (~2966 launches). We fetch all pages, then match to our repos by the
company's website domain (most reliable) or name. Stores `yc_launch` (title, date, votes, url).

Usage: python3 yc_launches.py
"""
import json, os, glob, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
BASE = "https://www.ycombinator.com/launches.json"

def get(url):
    return subprocess.run(["curl", "-s", "--max-time", "30", url], capture_output=True, text=True).stdout

def dom(u):
    return re.sub(r"^https?://(www\.)?", "", u or "").split("/")[0].lower()

def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

# fetch all pages
first = json.loads(get(BASE))
pages = first.get("nbPages", 1)
launches = list(first.get("hits", []))
for p in range(1, pages):
    launches.extend(json.loads(get(f"{BASE}?page={p}")).get("hits", []))
print(f"fetched {len(launches)} YC launches across {pages} pages")

by_domain, by_name = {}, {}
for h in launches:
    c = h.get("company") or {}
    rec = {"title": h.get("title"), "date": (h.get("created_at") or "")[:10],
           "votes": h.get("total_vote_count") or 0,
           "url": f"https://www.ycombinator.com/launches/{h.get('slug')}"}
    d = dom(c.get("url"))
    if d:
        by_domain.setdefault(d, rec)                  # keep first (most recent) launch per domain
    if c.get("name"):
        by_name.setdefault(norm(c["name"]), rec)

hit = 0
for f in glob.glob(f"{REPOS}/*.json"):
    d = json.load(open(f))
    yc = d.get("yc") or {}
    site = yc.get("website")
    ev = by_domain.get(dom(site)) or by_name.get(norm(d["slug"]))
    d["yc_launch"] = ev
    json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
    if ev:
        hit += 1
        print(f"  {d['slug']:18s} {ev['date']} · {ev['votes']:>4} votes · {ev['title'][:48]}")
print(f"\n{hit} repos matched a YC Launch")

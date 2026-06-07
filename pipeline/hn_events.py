#!/usr/bin/env python3
"""Find each repo's Hacker News launch moments (Show HN / Launch HN / links to its site).

Uses the public HN Algolia search API (no token) to locate the stories that drove a repo's
star spikes — so an event day on the star curve can be explained ("this came from a Launch HN
with 259 points"). Precise: matches by the repo's website domain and github URL, plus Show HN
title search. Stores top stories (date, title, url, author, points, comments) as `hn_events`.

Usage: python3 hn_events.py [N]   (sample first N by stars; default all)
"""
import json, os, glob, sys, subprocess, urllib.parse, re
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"

def floor_date(first_commit):
    """A launch can't meaningfully precede the code. Posts older than the repo's first
    commit (minus a small buffer) are name collisions, not this project."""
    if not first_commit:
        return None
    try:
        y, m, d = map(int, first_commit[:10].split("-"))
        return (date(y, m, d) - timedelta(days=90)).isoformat()
    except Exception:
        return None

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
    floor = floor_date(repo.get("first_commit"))
    former = [f.lower() for f in (repo.get("former") or []) if f]
    nm = re.escape(name.replace("-", " "))
    # the project name must sit right after "Show/Launch HN" — not just anywhere in the title
    title_re = re.compile(r"\b(show|launch)\s+hn\b[:\s\-–—|]*" + nm + r"\b", re.I)
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
            post_date = h["created_at"][:10]
            u = (h.get("url") or "").lower()
            host = domain(u)
            title = (h.get("title") or "")
            date_ok = (not floor) or (post_date >= floor)
            # (a) Identity: the post links to THIS repo (current or a former name). Trusted
            #     regardless of date — it explains the rename-spanning star history.
            id_match = (gh and gh.lower() in u) or any(fn and fn in u for fn in former)
            # (b) Domain match at a hostname boundary (so char.com != re-char.com). Domains get
            #     reused across companies/eras (jitsu.com was Nodejitsu), and a post can't have
            #     driven a repo that didn't exist yet — so require it within the repo's lifetime.
            dom_host = bool(dom) and (host == dom or host.endswith("." + dom))
            dom_match = dom_host and date_ok
            # (c) Tight "Show/Launch HN: <name>" — reliable only when the post doesn't link to a
            #     DIFFERENT project's domain (else it's a same-name collision, e.g. another "daily").
            external = bool(host) and host != "news.ycombinator.com" and not dom_host and not id_match
            title_match = bool(title_re.search(title)) and date_ok and not external
            if not (id_match or dom_match or title_match):
                continue
            found[oid] = {"date": h["created_at"][:10], "title": title, "url": h.get("url") or f"https://news.ycombinator.com/item?id={oid}",
                          "author": h.get("author"), "points": h.get("points") or 0, "comments": h.get("num_comments") or 0,
                          "hn": f"https://news.ycombinator.com/item?id={oid}"}
    return sorted(found.values(), key=lambda x: -x["points"])[:6]

repos = sorted((json.load(open(f)) for f in glob.glob(f"{REPOS}/*.json")), key=lambda d: -(d.get("metrics", {}).get("stars") or 0))
n = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or len(repos)
hit = 0
for d in repos[:n]:
    repo = {"slug": d["slug"], "github": d["github"], "website": d.get("yc", {}).get("website"),
            "first_commit": (d.get("timeline") or {}).get("first"),
            "former": [n for n in (d.get("repo_names") or []) if n.lower() != (d["github"] or "").lower()]}
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

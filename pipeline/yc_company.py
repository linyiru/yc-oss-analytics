#!/usr/bin/env python3
"""Fetch a YC company's own page record — the authoritative source for its github link,
tags, founders and launches, straight from ycombinator.com.

Each public company page (a Rails + Inertia.js app) embeds its full record as JSON in a
`data-page="..."` attribute; the `?format=js` variant returns the same payload. This is far
more reliable than scraping the company's marketing site (no "links to Google/Firebase"
false positives): the github_url and tags come from YC itself. We use it to

  1) cross-verify the repo we resolved against YC's own github_url, and
  2) snapshot each company's record over time — YC data changes, so each snapshot is
     timestamped (fetched_at) under data/yc_snapshots/<slug>.json.

Usage:
  python3 yc_company.py <slug>     # print one company's record (JSON)
  python3 yc_company.py verify     # cross-check every tracked repo vs YC's github_url
  python3 yc_company.py snapshot   # write timestamped snapshots for every tracked repo
"""
import json, os, re, html, sys, glob, subprocess
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
SNAP = f"{ROOT}/data/yc_snapshots"
UA = "Mozilla/5.0 (compatible; yc-oss-analytics)"


def fetch_company(slug):
    url = f"https://www.ycombinator.com/companies/{slug}?format=js"
    out = subprocess.run(["curl", "-s", "--max-time", "15", "-L", "-A", UA, url],
                         capture_output=True, text=True).stdout
    m = re.search(r'data-page="(.*?)"', out, re.S)
    if not m:
        return None
    try:
        d = json.loads(html.unescape(m.group(1)))
        c = d["props"]["company"]
    except Exception:
        return None
    page_repos = sorted(set(re.findall(r"github\.com/([A-Za-z0-9_-]+/[A-Za-z0-9_.-]+)", out)))
    gp = c.get("primary_group_partner")
    partner = gp.get("full_name") if isinstance(gp, dict) else gp
    launches = []
    for l in (d["props"].get("launches") or []):
        launches.append({
            "slug": l.get("slug"), "title": l.get("title"), "tagline": l.get("tagline"),
            "date": (l.get("created_at") or "")[:10], "votes": l.get("total_vote_count") or 0,
            "url": l.get("url"),
        })
    return {
        "slug": c.get("slug"), "name": c.get("name"), "batch": c.get("batch"),
        "website": c.get("website"), "github_url": c.get("github_url"),
        "tags": c.get("tags"), "status": c.get("ycdc_status"),
        "year_founded": c.get("year_founded"), "team_size": c.get("team_size"),
        "location": c.get("location"), "country": c.get("country"), "partner": partner,
        "founders": [{"name": f.get("full_name"), "title": f.get("title")} for f in (c.get("founders") or [])],
        "launches": launches,
        "page_repos": page_repos,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def org_of(gh):
    return (gh or "").rstrip("/").split("github.com/")[-1].split("/")[0].lower()


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "verify"
    if mode not in ("verify", "snapshot"):
        print(json.dumps(fetch_company(mode), ensure_ascii=False, indent=1))
        return
    os.makedirs(SNAP, exist_ok=True)
    n = miss = mism = 0
    for f in sorted(glob.glob(f"{REPOS}/*.json")):
        d = json.load(open(f))
        slug, gh = d["slug"], d.get("github", "")
        rec = fetch_company(slug)
        if not rec:
            miss += 1
            print(f"  {slug:20s} (no YC page — slug may differ from the company)")
            continue
        n += 1
        json.dump(rec, open(f"{SNAP}/{slug}.json", "w"), ensure_ascii=False, indent=1)
        our_org = org_of(gh)
        yc_org = org_of(rec.get("github_url") or "")
        page_orgs = {r.split("/")[0].lower() for r in rec["page_repos"]}
        if not ((yc_org and yc_org == our_org) or our_org in page_orgs):
            mism += 1
            print(f"  ! {slug:18s} ours={gh:30s} YC_org={yc_org or '-':16s} page={sorted(page_orgs)[:2]}")
    print(f"\n{n} verified · {mism} github mismatches · {miss} with no YC page; snapshots -> data/yc_snapshots/")


if __name__ == "__main__":
    main()

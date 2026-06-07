#!/usr/bin/env python3
"""Merge YC company-page snapshots into each repo's record.

Input:  data/yc_snapshots/<slug>.json  (written by yc_company.py — authoritative YC data)
Output: data/repos/<slug>.json
          yc.status        -> ycdc_status (Active / Acquired / Inactive / Public) — survivorship
          yc.year_founded, yc.team_size, yc.location, yc.partner, yc.founders
          yc_launches       -> full list of the company's YC Launch posts (title, date, votes, url)

Survivorship is the headline: ycdc_status turns our biggest caveat into a measured field.
Idempotent; only touches the fields above.
"""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
SNAP = f"{ROOT}/data/yc_snapshots"


def main():
    n = 0
    for f in glob.glob(f"{REPOS}/*.json"):
        d = json.load(open(f))
        sp = f"{SNAP}/{d['slug']}.json"
        if not os.path.exists(sp):
            continue
        s = json.load(open(sp))
        yc = d.setdefault("yc", {})
        if s.get("status"):
            yc["status"] = s["status"]
        for k in ("year_founded", "team_size", "location", "partner"):
            if s.get(k) is not None:
                yc[k] = s[k]
        if s.get("founders"):
            yc["founders"] = s["founders"]
        # full YC launch history (replaces the single yc_launch match), most recent first
        launches = sorted((s.get("launches") or []), key=lambda x: x.get("date") or "", reverse=True)
        if launches:
            d["yc_launches"] = launches
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
        n += 1
    print(f"merged YC snapshot fields into {n} repo files")


if __name__ == "__main__":
    main()

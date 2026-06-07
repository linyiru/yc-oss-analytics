#!/usr/bin/env python3
"""Merge the GH Archive engagement counts into each repo's engagement block.

Input:  data/bq_engagement.csv  (repo_id, type, n)  — produced by:
          bq query < pipeline/bigquery_engagement.sql  (long-form: one row per repo x event type)
Output: data/repos/<slug>.json  engagement.{issues, prs, comments, forks_gha, comments_per_issue}

Pivots the per-type counts into the engagement fields. Preserves any existing
network_star_pct / early_network on the block (those come from separate passes).
"""
import csv, json, glob, os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(ROOT, "data", "bq_engagement.csv")
MAP = {"IssuesEvent": "issues", "PullRequestEvent": "prs",
       "IssueCommentEvent": "comments", "ForkEvent": "forks_gha"}


def main():
    by_repo = defaultdict(dict)
    for r in csv.DictReader(open(CSV)):
        rid = int(r["repo_id"])
        if r["type"] in MAP:
            by_repo[rid][MAP[r["type"]]] = int(r["n"])

    n = 0
    for f in glob.glob(os.path.join(ROOT, "data", "repos", "*.json")):
        d = json.load(open(f))
        counts = by_repo.get(d.get("repo_id"))
        if not counts:
            continue
        eng = d.setdefault("engagement", {})
        for v in MAP.values():
            eng[v] = counts.get(v, 0)
        eng["comments_per_issue"] = round(eng["comments"] / eng["issues"], 1) if eng.get("issues") else 0
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
        n += 1
    print(f"merged engagement into {n} repo files")


if __name__ == "__main__":
    main()

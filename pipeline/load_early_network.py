#!/usr/bin/env python3
"""Merge the early-YC-network BigQuery result into each repo's engagement block.

Input:  data/bq_early_network.csv  (repo_id, first100, first100_net, first1000, first1000_net, total, total_net)
        produced by:  bq query < pipeline/bigquery_early_network.sql  (see that file's header)
Output: data/repos/<slug>.json  engagement.early_network = {
          first100, first100_net_pct, first1000, first1000_net_pct, lifetime_net_pct }

The percentages are the share of a repo's stargazers who also star >=2 OTHER YC
open-source repos (strict) — a de-identified read on YC-network distribution. No logins are stored.
"""
import csv, json, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(ROOT, "data", "bq_early_network.csv")


def pct(num, den):
    num, den = int(num), int(den)
    return round(100 * num / den) if den else None


def main():
    rows = {int(r["repo_id"]): r for r in csv.DictReader(open(CSV))}
    n = 0
    for f in glob.glob(os.path.join(ROOT, "data", "repos", "*.json")):
        d = json.load(open(f))
        r = rows.get(d.get("repo_id"))
        if not r:
            continue
        f100, f1k, tot = int(r["first100"]), int(r["first1000"]), int(r["total"])
        d.setdefault("engagement", {})["early_network"] = {
            "first100": f100, "first100_net_pct": pct(r["first100_net"], f100),
            "first1000": f1k, "first1000_net_pct": pct(r["first1000_net"], f1k),
            "lifetime_net_pct": pct(r["total_net"], tot),
        }
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
        n += 1
    print(f"merged early_network into {n} repo files")


if __name__ == "__main__":
    main()

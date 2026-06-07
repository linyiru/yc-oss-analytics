#!/usr/bin/env python3
"""Load complete daily star history from a BigQuery export (rename-proof, by repo.id).

Run pipeline/bigquery_stars.sql in BigQuery (your own account/project), export to CSV with
columns: repo_id, repo_name, day, stars. This loader matches rows to repos by repo_id (stable
across renames), builds 100%-complete daily curves (no baseline needed), and records every
historical repo name it sees — so renames are captured automatically.

Usage: python3 load_bigquery_stars.py [data/bigquery_stars.csv]
"""
import json, os, glob, sys, csv
from collections import defaultdict
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"
CSVPATH = sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/data/bigquery_stars.csv"

# reuse the curve/spike/viral builder
sys.path.insert(0, os.path.dirname(__file__))
from star_clickhouse import build  # noqa: E402

by_id_days = defaultdict(list)   # repo_id -> [(day, stars)]
by_id_names = defaultdict(set)   # repo_id -> {repo_name, ...} (rename history)
with open(CSVPATH, newline="") as fh:
    r = csv.DictReader(fh)
    for row in r:
        rid = int(row["repo_id"])
        by_id_days[rid].append((row["day"], int(row["stars"])))
        if row.get("repo_name"):
            by_id_names[rid].add(row["repo_name"])

updated = 0
for f in sorted(glob.glob(f"{REPOS}/*.json")):
    d = json.load(open(f))
    rid = d.get("repo_id")
    if rid is None or rid not in by_id_days:
        continue
    total = d.get("metrics", {}).get("stars") or 0
    series = sorted(by_id_days[rid])
    # complete coverage -> creation passed so build() scales tiny gaps, no baseline expected
    pts, viral, spikes, baseline = build(series, total, d.get("metrics", {}).get("created"))
    d["stars_curve"] = pts
    d["viral"] = viral
    d["star_spikes"] = spikes
    d["stars_daily"] = True
    d["curve_source"] = "bigquery"
    d["curve_baseline"] = baseline
    d["curve_partial"] = bool(total and baseline > 0.25 * total)
    # record every name this repo has had (rename history)
    names = set(d.get("repo_names", [])) | by_id_names[rid]
    d["repo_names"] = sorted(names)
    json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
    updated += 1
    extra = [n for n in by_id_names[rid] if n.lower() != (d.get("github") or "").lower()]
    if extra:
        print(f"  {d['slug']:20s} {len(pts)} days · former name(s): {', '.join(sorted(extra))}")

print(f"loaded {updated} repos from BigQuery export (rename-proof, by repo id)")

#!/usr/bin/env python3
"""Discover open-source YC companies MISSING from the official 'Open Source' tag.

Heuristic per company:
  website domain -> guess GitHub org -> if that org/user has a non-fork repo with
  stars >= THRESHOLD, it's very likely an open-source company the tag missed.

Run on a sample to estimate the false-negative rate, or with --all to sweep everyone.
Usage: python3 discover.py [N]   (sample size, default 40)   |   --all
"""
import json, re, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THRESHOLD = 300  # min stars on top repo to count as "meaningful OSS presence"

allc = json.load(open(f"{HERE}/_src_all.json"))
tagged = {c["slug"] for c in json.load(open(f"{HERE}/_src_opensource_tag.json"))}
already = {r["slug"] for r in json.load(open(f"{ROOT}/data/candidates.json"))}

def gh(path, jq=None):
    a = ["gh", "api", path] + (["--jq", jq] if jq else [])
    return subprocess.run(a, capture_output=True, text=True).stdout.strip()

def org_from_site(site):
    if not site: return None
    dom = re.sub(r"^https?://(www\.)?", "", site).split("/")[0]
    label = dom.split(".")[0]
    return label if re.fullmatch(r"[A-Za-z0-9-]{2,39}", label or "") else None

def top_repo(org):
    """Return (full_name, stars) of org's top non-fork repo, or None."""
    out = gh(f"users/{org}/repos?per_page=100&sort=stars&type=public",
             jq="[.[] | select(.fork==false)] | max_by(.stargazers_count) | {n:.full_name, s:.stargazers_count}")
    try:
        d = json.loads(out)
        if d and d.get("s") is not None and d.get("n"):
            return (d["n"], d["s"])
    except: pass
    return None

# candidates to probe: have website, not tagged, not already in our list
pool = [c for c in allc if c.get("website") and c["slug"] not in tagged and c["slug"] not in already]
if "--all" in sys.argv:
    sample = pool
else:
    n = int(next((a for a in sys.argv[1:] if a.isdigit()), 40))
    # spread across batches deterministically (every k-th), no RNG
    step = max(1, len(pool)//n)
    sample = pool[::step][:n]

print(f"pool (untagged, has website): {len(pool)}  |  probing {len(sample)}  |  threshold {THRESHOLD}★")
hits = []
for c in sample:
    org = org_from_site(c["website"])
    if not org: continue
    tr = top_repo(org)
    if tr and tr[1] >= THRESHOLD:
        hits.append((c["slug"], c["batch"], tr[0], tr[1]))
        print(f"  ★ MISSED: {c['name'][:24]:24s} {c['batch']:13s} {tr[0]:32s} {tr[1]:,}★")

rate = 100*len(hits)/len(sample) if sample else 0
print(f"\nfound {len(hits)} likely-open-source companies the tag MISSED "
      f"({rate:.0f}% of probed)  — naive org=domain heuristic only (lower bound)")
json.dump([{"slug": s, "batch": b, "github": g, "stars": st} for s, b, g, st in hits],
          open(f"{ROOT}/data/discovered.json", "w"), indent=1)

#!/usr/bin/env python3
"""Star-traction transparency SIGNALS (not verdicts) — ratio-based, zero API.

Reads data/repos/*.json and computes descriptive indicators of how organic a repo's
star traction looks, relative to its peers in this dataset:
  - stars/forks and stars/contributor ratios (the article's "thousands of stars, <10 forks")
  - each ratio's percentile within the dataset (context, not an absolute accusation)
  - a 0-100 "organic-looking" score (higher = engagement scales with stars, as real projects do)

We deliberately frame everything as signals with peer context. This is NOT fraud detection;
account-quality sampling and burst-shape analysis (stronger signals) are separate, later passes.
Writes data/authenticity.json keyed by slug (separate file — no race with other passes).
"""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

repos = []
for f in glob.glob(f"{ROOT}/data/repos/*.json"):
    d = json.load(open(f))
    m = d.get("metrics", {})
    stars = m.get("stars") or 0
    if stars < 50:  # ratios are meaningless for tiny repos
        continue
    forks = m.get("forks") or 0
    contribs = m.get("contributors") or 0
    repos.append({
        "slug": d["slug"], "stars": stars, "forks": forks, "contributors": contribs,
        "stars_per_fork": round(stars / forks, 1) if forks else None,
        "stars_per_contributor": round(stars / contribs, 1) if contribs else None,
        "fork_rate": round(forks / stars, 4),  # forks per star; low = weak engagement
    })

def percentile_ranks(values):
    """Map each value to its percentile (0-100) among non-null values."""
    xs = sorted(v for v in values if v is not None)
    n = len(xs)
    def rank(v):
        if v is None or n == 0:
            return None
        below = sum(1 for x in xs if x < v)
        return round(100 * below / n)
    return rank

# Higher stars/fork ratio = weaker engagement relative to popularity (more eyebrow-raising).
spf_rank = percentile_ranks([r["stars_per_fork"] for r in repos])
# Higher fork_rate (forks/star) = healthier; take its percentile directly.
fr_rank = percentile_ranks([r["fork_rate"] for r in repos])

out = {}
for r in repos:
    fork_pct = fr_rank(r["fork_rate"])          # 100 = best engagement among peers
    spf_pct = spf_rank(r["stars_per_fork"])     # 100 = highest stars-per-fork (weakest)
    # organic-looking score: mostly fork-engagement percentile, lightly penalize extreme spf
    score = fork_pct if fork_pct is not None else 50
    flags = []
    if r["stars_per_fork"] and r["stars_per_fork"] >= 40:
        flags.append(f"high stars/fork ({r['stars_per_fork']:.0f}:1)")
    if fork_pct is not None and fork_pct <= 10:
        flags.append("fork engagement in bottom 10% of peers")
    if r["stars_per_contributor"] and r["stars_per_contributor"] >= 3000:
        flags.append(f"few contributors for the stars ({r['stars_per_contributor']:.0f}:1)")
    out[r["slug"]] = {
        "stars_per_fork": r["stars_per_fork"],
        "stars_per_contributor": r["stars_per_contributor"],
        "fork_engagement_pct": fork_pct,
        "organic_score": score,
        "flags": flags,
        "note": "descriptive peer-relative signals, not a fraud verdict",
    }

json.dump(out, open(f"{ROOT}/data/authenticity.json", "w"), indent=1, ensure_ascii=False)
flagged = sum(1 for v in out.values() if v["flags"])
print(f"scored {len(out)} repos (stars>=50) | {flagged} have at least one signal "
      f"-> data/authenticity.json")
# show the lowest-engagement handful for a sanity check
low = sorted(out.items(), key=lambda kv: kv[1]["organic_score"])[:8]
for slug, v in low:
    print(f"  {slug:18s} score={v['organic_score']:>3} spf={v['stars_per_fork']} flags={v['flags']}")

#!/usr/bin/env python3
"""Build the ranked candidate list from yc-oss datasets + manual overrides.

Sources:
  - open-source.json tag + repositories.json  -> tag-based companies (official)
  - overrides/overrides.json additions          -> recover tag false-negatives (untagged OSS)
  - companies/all.json                          -> metadata for override slugs

Output:
  data/candidates.json   — full merged list, ranked by stars, with `source`
  pipeline/repos.yaml     — editable v1 selection (top N enabled)
"""
import json, re, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

tag = json.load(open(f"{HERE}/_src_opensource_tag.json"))
repos = json.load(open(f"{HERE}/_src_repositories.json"))
allc = json.load(open(f"{HERE}/_src_all.json"))
ovr = json.load(open(f"{ROOT}/overrides/overrides.json"))

meta_tag = {c["slug"]: c for c in tag}
meta_all = {c["slug"]: c for c in allc}

def batch_short(b):
    m = re.match(r"(Winter|Summer|Spring|Fall)\s+(\d{4})", b or "")
    if not m: return b or "?"
    return {"Winter": "W", "Summer": "S", "Spring": "X", "Fall": "F"}[m.group(1)] + m.group(2)[2:]

def gh_slug(url):
    m = re.search(r"github\.com/([^/]+/[^/?#]+)", url or "")
    return m.group(1) if m else None

def gh_repo_stats(gh):
    out = subprocess.run(["gh", "api", f"repos/{gh}",
                          "--jq", "{stars:.stargazers_count, forks:.forks_count}"],
                         capture_output=True, text=True).stdout
    try: return json.loads(out)
    except: return {"stars": 0, "forks": 0}

def make_row(slug, gh, meta, stats, source):
    return {
        "slug": slug, "name": meta.get("name", slug), "github": gh,
        "url": f"https://github.com/{gh}" if gh else None,
        "batch": batch_short(meta.get("batch")), "batch_full": meta.get("batch"),
        "status": meta.get("status"), "team_size": meta.get("team_size"),
        "one_liner": meta.get("one_liner", ""), "website": meta.get("website"),
        "industry": meta.get("industry"),
        "stars": stats.get("stars", 0), "forks": stats.get("forks", 0),
        "source": source,
    }

rows = {}
# 1) official tag-based
for slug, r in repos.items():
    if not r or "url" not in r: continue
    gh = gh_slug(r["url"]); st = r.get("github_repo", {})
    rows[slug] = make_row(slug, gh, meta_tag.get(slug, meta_all.get(slug, {})),
                          {"stars": st.get("stargazers_count", 0), "forks": st.get("forks_count", 0)},
                          "yc-tag")

# 2) overrides (false negatives) — fetch live stats
added = []
for a in ovr.get("additions", []):
    slug, gh = a["slug"], a["github"]
    if slug in rows:  # already present; just note
        continue
    meta = meta_all.get(slug) or meta_tag.get(slug) or {"name": slug}
    rows[slug] = make_row(slug, gh, meta, gh_repo_stats(gh), "override")
    added.append((slug, gh, rows[slug]["stars"]))

# 3) exclusions
for slug in ovr.get("exclusions", []):
    rows.pop(slug, None)

ranked = sorted(rows.values(), key=lambda x: -x["stars"])
json.dump(ranked, open(f"{ROOT}/data/candidates.json", "w"), indent=1, ensure_ascii=False)

N = 50
lines = [
    "# v1 selection — edit `enabled` to include/exclude a repo in the build.",
    f"# Sources: yc-tag (official) + override (recovered false negatives). Total: {len(ranked)}.",
    f"# Default: top {N} by stars enabled.", "", "repos:",
]
for i, r in enumerate(ranked):
    en = "true" if i < N else "false"
    src = "" if r["source"] == "yc-tag" else f"  [{r['source']}]"
    lines.append(f'  - slug: {r["slug"]}')
    lines.append(f'    github: "{r["github"]}"')
    lines.append(f'    batch: {r["batch"]}')
    lines.append(f'    stars: {r["stars"]}')
    lines.append(f'    enabled: {en}    # {r["name"]}{src}')
open(f"{HERE}/repos.yaml", "w").write("\n".join(lines) + "\n")

print(f"candidates: {len(ranked)} ({sum(1 for r in ranked if r['source']=='override')} recovered via override)")
for slug, gh, stars in added:
    rank = next(i for i, r in enumerate(ranked) if r["slug"] == slug) + 1
    print(f"  + recovered: {slug} ({gh}) {stars:,}★  -> rank #{rank}")
print(f"-> data/candidates.json, pipeline/repos.yaml")

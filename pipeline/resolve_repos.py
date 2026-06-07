#!/usr/bin/env python3
"""Resolve each tracked repo to its canonical name + stable numeric id via the GitHub API.

GitHub keeps a repo's numeric `id` stable across renames/transfers and redirects old names to
the current one. Storing both means: (1) our `github` link is always the canonical current
name, (2) we can detect renames over time, and (3) star history can be queried rename-proof by
`repo.id` (GH Archive / BigQuery) instead of by name. Logs any link that changed.

Usage: python3 resolve_repos.py
"""
import json, os, glob, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"

def gh_repo(name):
    out = subprocess.run(["gh", "api", f"repos/{name}", "--jq", "{id:.id, full:.full_name}"],
                         capture_output=True, text=True).stdout
    try:
        return json.loads(out)
    except Exception:
        return None

changed, resolved, failed = [], 0, []
for f in sorted(glob.glob(f"{REPOS}/*.json")):
    d = json.load(open(f))
    name = d.get("github")
    if not name:
        continue
    info = gh_repo(name)
    if not info or not info.get("id"):
        failed.append(d["slug"]); continue
    canonical = info["full"]
    # record id + canonical name; keep a names[] history for rename tracking
    d["repo_id"] = info["id"]
    names = set(d.get("repo_names", []))
    names.add(name); names.add(canonical)
    d["repo_names"] = sorted(names)
    if canonical.lower() != name.lower():
        changed.append((d["slug"], name, canonical))
        d["github"] = canonical
    json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
    resolved += 1

print(f"resolved {resolved} repos (id + canonical name); {len(failed)} failed")
if changed:
    print(f"\nlink corrected / renamed ({len(changed)}):")
    for slug, old, new in changed:
        print(f"  {slug:20s} {old}  ->  {new}")
if failed:
    print(f"\nfailed: {', '.join(failed)}")

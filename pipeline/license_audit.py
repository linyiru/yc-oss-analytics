#!/usr/bin/env python3
"""Precise license audit — what GitHub flattens to 'NOASSERTION' is usually the interesting part:
source-available licenses (Elastic, BUSL, SSPL, FSL), open-core (a permissive/copyleft core plus an
ee/ enterprise carve-out), or custom/dual licensing. We read each repo's actual LICENSE text via the
GitHub API and check for an enterprise-edition directory, then classify the real model.

Writes metrics.license_detail = { spdx, detected, model, source_available, ee }. No clone needed.

Usage: python3 license_audit.py            # all tracked repos
       python3 license_audit.py <slug>
"""
import json, os, glob, sys, base64, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = f"{ROOT}/data/repos"

SOURCE_AVAILABLE = [
    ('elastic license', 'Elastic-2.0'), ('server side public license', 'SSPL-1.0'),
    ('business source license', 'BUSL-1.1'), ('functional source license', 'FSL'),
    ('sustainable use license', 'Sustainable Use'), ('confluent community license', 'Confluent'),
    ('fair source license', 'Fair Source'),
]
BASE = [
    ('affero general public license', 'AGPL-3.0'), ('lesser general public license', 'LGPL-3.0'),
    ('gnu general public license', 'GPL-3.0'), ('apache license', 'Apache-2.0'),
    ('mozilla public license', 'MPL-2.0'), ('mit license', 'MIT'),
    ('permission is hereby granted, free of charge', 'MIT'),
    ('redistribution and use in source and binary', 'BSD'),
]
PERMISSIVE = {'MIT', 'Apache-2.0', 'BSD', 'MPL-2.0', 'ISC'}
COPYLEFT = {'AGPL-3.0', 'GPL-3.0', 'LGPL-3.0'}


def gh(path):
    return subprocess.run(["gh", "api", path], capture_output=True, text=True).stdout


def gh_json(path):
    try:
        return json.loads(gh(path))
    except Exception:
        return None


def dir_exists(repo, path):
    d = gh_json(f"repos/{repo}/contents/{path}")
    return isinstance(d, list) and len(d) > 0


def audit(repo):
    lic = gh_json(f"repos/{repo}/license") or {}
    spdx = (lic.get("license") or {}).get("spdx_id")
    text = ""
    if lic.get("content"):
        try:
            text = base64.b64decode(lic["content"]).decode("utf-8", "ignore")
        except Exception:
            pass
    t = text.lower()
    sa = next((name for sig, name in SOURCE_AVAILABLE if sig in t), None)
    base = next((name for sig, name in BASE if sig in t), None)
    commons = 'commons clause' in t
    # an enterprise-edition carve-out: a dedicated ee/ or enterprise/ dir, or the LICENSE says so
    ee = ('portions of this software are licensed as follows' in t or 'enterprise edition' in t
          or 'variously licensed' in t or dir_exists(repo, 'ee') or dir_exists(repo, 'enterprise'))

    if spdx and spdx not in ('NOASSERTION', None) and not ee and not sa and not commons:
        detected, model = spdx, ('Copyleft' if spdx in COPYLEFT else 'Permissive' if spdx in PERMISSIVE else 'Other')
    elif sa and not ee:
        detected, model = sa, 'Source-available'
    elif ee and (base or spdx in PERMISSIVE | COPYLEFT):
        detected = f"{base or spdx} + EE"
        model = 'Open-core'
    elif sa and ee:
        detected, model = f"{sa} + EE", 'Open-core'
    elif commons:
        detected, model = f"{base or 'Custom'} + Commons Clause", 'Source-available'
    elif base:
        detected = base
        model = 'Copyleft' if base in COPYLEFT else 'Permissive'
    else:
        detected, model = 'Custom / Proprietary', 'Custom'

    return {"spdx": spdx, "detected": detected, "model": model,
            "source_available": bool(sa) or commons, "ee": bool(ee)}


def process(slug):
    f = f"{REPOS}/{slug}.json"
    d = json.load(open(f))
    if not d.get("github"):
        return
    det = audit(d["github"])
    d.setdefault("metrics", {})["license_detail"] = det
    json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
    print(f"  {slug:20s} spdx={det['spdx'] or '-':14s} -> {det['detected']:24s} [{det['model']}]{' ee' if det['ee'] else ''}", flush=True)


def main():
    if len(sys.argv) > 1:
        process(sys.argv[1]); return
    for f in sorted(glob.glob(f"{REPOS}/*.json")):
        process(json.load(open(f))["slug"])


if __name__ == "__main__":
    main()

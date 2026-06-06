#!/usr/bin/env python3
"""Detect which AI coding tools / IDEs a repo's team uses, from config files in the tree.

This is the *direct-evidence, no-clone* half of dev-tool detection: it reads the GitHub
tree via the API and looks for tool fingerprints (CLAUDE.md, .cursor/, AGENTS.md, ...).
The git-log half (co-author trailers, agent bot authors) is computed in run.py while a
clone exists; here we stay API-only so it can run over hundreds of repos cheaply.

Writes data/dev_tools.json keyed by slug (a SEPARATE file — never touches data/repos/*.json,
so it can run alongside bulk.py without racing). Reads repo list from data/candidates.json.

Usage: python3 dev_tools.py [N]   (cap to first N by stars; default all)
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# path fingerprint -> (tool, kind). Matched against full tree paths (prefix or exact).
FINGERPRINTS = [
    (r"^CLAUDE\.md$|^\.claude/", "Claude Code", "ai"),
    (r"^\.cursor/|^\.cursorrules$", "Cursor", "ai"),
    (r"^\.github/copilot-instructions\.md$", "GitHub Copilot", "ai"),
    (r"^AGENTS?\.md$", "Codex / AGENTS.md", "ai"),
    (r"^\.windsurfrules$|^\.windsurf/", "Windsurf", "ai"),
    (r"^\.aider\b|^\.aider\.conf", "Aider", "ai"),
    (r"^\.continue/", "Continue", "ai"),
    (r"^GEMINI\.md$|^\.gemini/", "Gemini CLI", "ai"),
    (r"^\.devin/", "Devin", "ai"),
    (r"^\.?mcp\.json$|^\.mcp/", "MCP", "ai"),
    (r"^\.vscode/", "VS Code", "editor"),
    (r"^\.idea/", "JetBrains", "editor"),
    (r"^\.zed/", "Zed", "editor"),
]

def gh_tree(gh_repo):
    out = subprocess.run(
        ["gh", "api", f"repos/{gh_repo}/git/trees/HEAD?recursive=1",
         "--jq", ".tree[].path"], capture_output=True, text=True).stdout
    return out.splitlines()

candidates = {c["slug"]: c for c in json.load(open(f"{ROOT}/data/candidates.json"))}
order = sorted(candidates.values(), key=lambda x: -x["stars"])
cap = int(next((a for a in sys.argv[1:] if a.isdigit()), 0)) or None
if cap:
    order = order[:cap]

out_path = f"{ROOT}/data/dev_tools.json"
result = json.load(open(out_path)) if os.path.exists(out_path) else {}

for i, c in enumerate(order, 1):
    slug, gh = c["slug"], c["github"]
    if not gh:
        continue
    paths = gh_tree(gh)
    ai, editors = [], []
    for path in paths:
        for pat, tool, kind in FINGERPRINTS:
            if re.search(pat, path):
                (ai if kind == "ai" else editors).append(tool)
    ai, editors = sorted(set(ai)), sorted(set(editors))
    result[slug] = {"github": gh, "ai_tools": ai, "editors": editors,
                    "evidence": "config-file" if (ai or editors) else "none"}
    if ai or editors:
        print(f"  {slug:20s} ai:{ai} editors:{editors}")

json.dump(result, open(out_path, "w"), indent=1, ensure_ascii=False)
n_ai = sum(1 for v in result.values() if v["ai_tools"])
print(f"\nscanned {len(order)} | with AI-tool config: {n_ai} -> data/dev_tools.json")

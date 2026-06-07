#!/usr/bin/env python3
"""Extract each repo's full dependency set from its manifests (for stack analysis).

Reuses a blobless clone (no working tree); reads each manifest with `git show HEAD:<path>`
so only the manifest blobs are fetched, not the whole repo. Parses package.json (incl. nested
monorepo ones), pyproject.toml, requirements*.txt, go.mod, Cargo.toml, Gemfile, composer.json.
Writes stack.deps (sorted unique package names) — does NOT touch stars_curve or any other field.

Usage:
  python3 extract_deps.py <slug> <owner/repo> [--cleanup]
  python3 extract_deps.py --all [--cleanup]      # every tracked repo, smallest first
"""
import json, os, sys, re, subprocess, glob

try:
    import tomllib
except Exception:
    tomllib = None

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPOS = f"{ROOT}/data/repos"
CLONES = f"{HERE}/.clones"
SKIP = re.compile(r"(^|/)(node_modules|vendor|\.venv|venv|site-packages|dist|build|target|\.next|\.git|fixtures|testdata)/")
MANIFEST = re.compile(r"(^|/)(package\.json|pyproject\.toml|requirements[^/]*\.txt|go\.mod|Cargo\.toml|Gemfile|composer\.json)$")


def sh(args):
    return subprocess.run(args, capture_output=True, text=True).stdout


def ensure_clone(gh):
    path = f"{CLONES}/{gh.replace('/', '__')}"
    if not os.path.exists(path):
        os.makedirs(CLONES, exist_ok=True)
        sh(["git", "clone", "--quiet", "--no-checkout", "--filter=blob:none",
            f"https://github.com/{gh}.git", path])
    return path


def read(path, ref):
    return sh(["git", "-C", path, "show", f"HEAD:{ref}"])


def parse(name, text):
    """Return a set of dependency package names from one manifest's content."""
    out = set()
    base = name.rsplit("/", 1)[-1]
    try:
        if base == "package.json":
            d = json.loads(text)
            for k in ("dependencies", "devDependencies", "peerDependencies"):
                out.update((d.get(k) or {}).keys())
        elif base == "composer.json":
            d = json.loads(text)
            for k in ("require", "require-dev"):
                out.update(x for x in (d.get(k) or {}).keys() if "/" in x)
        elif base in ("pyproject.toml", "Cargo.toml") and tomllib:
            d = tomllib.loads(text)
            if base == "Cargo.toml":
                for k in ("dependencies", "dev-dependencies", "build-dependencies"):
                    out.update((d.get(k) or {}).keys())
            else:
                for dep in (d.get("project", {}).get("dependencies") or []):
                    m = re.match(r"[A-Za-z0-9._-]+", dep)
                    if m: out.add(m.group(0).lower())
                poetry = d.get("tool", {}).get("poetry", {})
                out.update(k.lower() for k in (poetry.get("dependencies") or {}) if k.lower() != "python")
        elif base.startswith("requirements") and base.endswith(".txt"):
            for line in text.splitlines():
                line = line.split("#")[0].strip()
                if not line or line.startswith("-"): continue
                m = re.match(r"[A-Za-z0-9._-]+", line)
                if m: out.add(m.group(0).lower())
        elif base == "go.mod":
            for m in re.finditer(r"^\s*([\w.\-/]+)\s+v[\d]", text, re.M):
                out.add(m.group(1))
        elif base == "Gemfile":
            out.update(re.findall(r"gem\s+['\"]([^'\"]+)['\"]", text))
    except Exception:
        pass
    return out


def extract(gh):
    path = ensure_clone(gh)
    files = [f for f in sh(["git", "-C", path, "ls-tree", "-r", "--name-only", "HEAD"]).splitlines()
             if MANIFEST.search(f) and not SKIP.search(f)][:250]
    deps = set()
    for f in files:
        deps |= parse(f, read(path, f))
    return sorted(deps), len(files)


def process(slug, gh, cleanup):
    deps, nman = extract(gh)
    f = f"{REPOS}/{slug}.json"
    d = json.load(open(f))
    d.setdefault("stack", {})["deps"] = deps
    json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
    print(f"  {slug:20s} {len(deps):>4} deps from {nman} manifest(s)", flush=True)
    if cleanup:
        p = f"{CLONES}/{gh.replace('/', '__')}"
        if os.path.realpath(p).startswith(os.path.realpath(CLONES)):
            subprocess.run(["rm", "-rf", p])


def main():
    cleanup = "--cleanup" in sys.argv
    if "--all" in sys.argv:
        repos = sorted((json.load(open(f)) for f in glob.glob(f"{REPOS}/*.json")),
                       key=lambda d: d.get("metrics", {}).get("stars") or 0)
        for d in repos:
            if d.get("github"):
                process(d["slug"], d["github"], cleanup)
    else:
        slug, gh = sys.argv[1], sys.argv[2]
        process(slug, gh, cleanup)


if __name__ == "__main__":
    main()

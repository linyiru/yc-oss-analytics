#!/usr/bin/env python3
"""Analyze one YC repo -> data/repos/<slug>.json (the pipeline<->web contract).

Two cost tiers:
  - cheap signals (always): metadata, languages, stack, commit cadence/punchcard/workflow
  - churn (full clones only): per-line added/deleted by month

Usage:
  python3 run.py <slug> <github_owner/repo> [--full] [--stars]
Reuses an existing clone at pipeline/.clones/<owner__repo> if present.
"""
import subprocess, sys, re, json, os, statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone

NOW = datetime.now(timezone.utc)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CLONES = f"{HERE}/.clones"
SEP = "\x1f"

def sh(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw).stdout

def gh(path, jq=None, header=None):
    args = ["gh", "api", path]
    if header: args += ["-H", header]
    if jq: args += ["--jq", jq]
    return sh(args)

def gh_json(path):
    out = gh(path)
    try: return json.loads(out)
    except: return None

def respect_rate_limit(min_remaining=200, resource="core"):
    """Poll the free /rate_limit endpoint; if we're low, wait until reset.
    GET /rate_limit does not itself count against the limit."""
    import time
    info = gh_json("rate_limit")
    try:
        r = info["resources"][resource]
    except (TypeError, KeyError):
        return
    if r["remaining"] < min_remaining:
        wait = max(0, r["reset"] - int(time.time())) + 2
        print(f"    · rate limit low ({r['remaining']}/{r['limit']} {resource}); "
              f"waiting {wait}s until reset")
        time.sleep(wait)

def is_blobless(path):
    """A reused clone is only 'full' if it has no partial-clone blob filter.
    Running numstat/churn on a blobless clone would refetch every blob (slow)."""
    f = sh(["git", "-C", path, "config", "--get", "remote.origin.partialclonefilter"]).strip()
    return f.startswith("blob:none") or f.startswith("blob:limit")

def ensure_clone(slug, gh_repo, full):
    path = f"{CLONES}/{gh_repo.replace('/', '__')}"
    if os.path.exists(path):
        return path, not is_blobless(path)  # reuse; full only if no blob filter
    os.makedirs(CLONES, exist_ok=True)
    flt = [] if full else ["--filter=blob:none"]
    sh(["git", "clone", "--quiet", "--no-checkout", *flt,
        f"https://github.com/{gh_repo}.git", path])
    return path, full

def git(repo, args):
    return sh(["git", "-C", repo, *args])

def analyze_commits(repo):
    log = git(repo, ["log", "--no-merges",
                     f"--pretty=format:%an{SEP}%ae{SEP}%ad{SEP}%s", "--date=iso-strict"])
    commits = []
    for line in log.splitlines():
        p = line.split(SEP)
        if len(p) < 4: continue
        try: dt = datetime.fromisoformat(p[2])
        except: continue
        commits.append((p[0], p[1].lower(), dt, SEP.join(p[3:])))
    if not commits:
        return None
    n = len(commits)
    n_merge = len([x for x in git(repo, ["log", "--merges", "--pretty=format:%h"]).splitlines() if x.strip()])
    first = min(c[2] for c in commits); last = max(c[2] for c in commits)
    span = (last - first).days or 1

    punch = [[0]*24 for _ in range(7)]
    month = Counter(); authors = Counter(); names = defaultdict(Counter)
    conv = Counter(); cp = re.compile(r'^(\w+)(\([^)]*\))?!?:'); lens = []
    cf = re.compile(r'\(#\d+\)')
    for an, ae, dt, subj in commits:
        punch[dt.weekday()][dt.hour] += 1
        month[dt.strftime("%Y-%m")] += 1
        authors[ae] += 1; names[ae][an] += 1
        m = cp.match(subj); conv[m.group(1).lower() if m else "_none"] += 1
        lens.append(len(subj))
    months = sorted(month)
    dow = [sum(punch[i]) for i in range(7)]
    conv_total = sum(v for k, v in conv.items() if k != "_none")

    # --- activity / liveness (relative to NOW) ---
    def days_ago(dt):
        d = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        return (NOW - d).days
    c30 = c90 = c365 = 0; recent_authors = set()
    last_days = min(days_ago(c[2]) for c in commits)
    for an, ae, dt, subj in commits:
        d = days_ago(dt)
        if d <= 30: c30 += 1
        if d <= 90: c90 += 1
        if d <= 365: c365 += 1
        if d <= 90: recent_authors.add(ae)
    yrs_first = round(days_ago(first)/365.25, 1)
    # liveness 0-100: recency (last commit) + recent volume, log-scaled
    import math
    recency = max(0, 1 - last_days/365)                       # 1.0 if today, 0 if >=1yr stale
    volume = min(1.0, math.log10(c90 + 1) / math.log10(300))  # ~1.0 at 300 commits/90d
    liveness = round(100 * (0.55*recency + 0.45*volume))
    # classification needs batch age — filled in caller; expose age-from-first here
    activity = dict(
        last_commit_days=last_days, commits_30d=c30, commits_90d=c90, commits_365d=c365,
        active_contributors_90d=len(recent_authors),
        years_since_first_commit=yrs_first, liveness=liveness,
        still_active=bool(c90 >= 5),
    )

    ai = len([1 for _ in git(repo, ["log", "--no-merges", "--grep", "Co-Authored-By: Claude",
                                     "-i", "--pretty=format:%h"]).splitlines()])
    contrib = [{"name": names[e].most_common(1)[0][0], "count": c, "pct": round(100*c/n, 1)}
               for e, c in authors.most_common(8)]
    return dict(
        commits=n, merges=n_merge, first=first.strftime("%Y-%m-%d"), last=last.strftime("%Y-%m-%d"),
        span_days=span, span_months=round(span/30.4, 1),
        intensity=dict(
            commits_per_week=round(7*n/span, 1), per_day=round(n/span, 2),
            weekend_pct=round(100*(dow[5]+dow[6])/n, 1),
            punchcard=punch, dow=dow, ai_coauthor_total=ai,
        ),
        workflow=dict(
            conventional_pct=round(100*conv_total/n),
            conv=[{"k": k, "v": v} for k, v in conv.most_common(8) if k != "_none"],
            merge_pct=round(100*n_merge/(n+n_merge), 1) if (n+n_merge) else 0,
            median_msg_len=int(statistics.median(lens)),
        ),
        monthly=[{"m": m, "c": month[m]} for m in months],
        contributors=contrib, n_authors=len(authors),
        activity=activity,
    )

def analyze_churn(repo):
    """Only meaningful on full clones (blobs present)."""
    ns = git(repo, ["log", "--no-merges", "--pretty=format:@@%ad", "--date=format:%Y-%m", "--numstat"])
    if not ns.strip(): return None
    madd = defaultdict(int); mdel = defaultdict(int); cur = None; ext = Counter(); total = 0
    for line in ns.splitlines():
        if line.startswith("@@"): cur = line[2:]; continue
        p = line.split("\t")
        if len(p) == 3 and cur and p[0] != "-":
            a = int(p[0]); d = int(p[1]) if p[1].isdigit() else 0
            madd[cur] += a; mdel[cur] += d; total += a
            mm = re.search(r'\.([a-zA-Z0-9]+)$', p[2]); ext[mm.group(1).lower() if mm else "noext"] += a
    months = sorted(set(list(madd) + list(mdel)))
    return dict(total_add=total,
                by_month=[{"m": m, "add": madd[m], "del": mdel[m]} for m in months],
                by_ext=[{"ext": e, "add": a} for e, a in ext.most_common(8)])

MANIFESTS = {
    "package.json": "node", "pyproject.toml": "python", "requirements.txt": "python",
    "go.mod": "go", "Cargo.toml": "rust", "Gemfile": "ruby", "pom.xml": "java",
    "composer.json": "php", "pubspec.yaml": "dart",
}
INFRA = {
    "Dockerfile": "docker", "docker-compose.yml": "docker-compose", "turbo.json": "turborepo",
    "nx.json": "nx", "biome.json": "biome", "bun.lock": "bun", "bun.lockb": "bun",
    "pnpm-lock.yaml": "pnpm", "vite.config.ts": "vite", "next.config.js": "nextjs",
    ".github/workflows": "github-actions", "CLAUDE.md": "claude-code", "trigger.config.ts": "trigger",
}

def detect_stack(gh_repo):
    langs = gh_json(f"repos/{gh_repo}/languages") or {}
    tree = gh_json(f"repos/{gh_repo}/git/trees/HEAD") or {}
    paths = {t["path"] for t in tree.get("tree", [])} if tree else set()
    pkg_manager = None; deps = []
    found_manifests = [m for m in MANIFESTS if m in paths]
    infra = sorted({v for k, v in INFRA.items() if any(p == k or p.startswith(k) for p in paths)})
    # node deps + package manager
    if "package.json" in paths:
        pj = gh_json(f"repos/{gh_repo}/contents/package.json")
        if pj and pj.get("content"):
            import base64
            try:
                data = json.loads(base64.b64decode(pj["content"]))
                deps = sorted(list(data.get("dependencies", {}).keys()))[:30]
                pm = data.get("packageManager", "")
                if pm: pkg_manager = pm.split("@")[0]
            except: pass
    if not pkg_manager:
        if "bun.lock" in paths or "bun.lockb" in paths: pkg_manager = "bun"
        elif "pnpm-lock.yaml" in paths: pkg_manager = "pnpm"
        elif "uv.lock" in paths: pkg_manager = "uv"
        elif "poetry.lock" in paths: pkg_manager = "poetry"
    return dict(languages=langs, manifests=found_manifests,
                pkg_manager=pkg_manager, deps_top=deps, infra=infra)

def star_curve(gh_repo, total, max_points=18):
    if not total: return [], None
    per = 100; pages = (total + per - 1)//per
    step = max(1, pages // max_points)
    pts = []
    for p in range(1, pages+1, step):
        ts = gh(f"repos/{gh_repo}/stargazers?per_page={per}&page={p}",
                jq=".[0].starred_at",
                header="Accept: application/vnd.github.star+json").strip()
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                pts.append({"t": dt.strftime("%Y-%m-%d"), "n": (p-1)*per + 1})
            except: pass
    # detect viral 30d window
    viral = None
    for i in range(len(pts)):
        ti = datetime.fromisoformat(pts[i]["t"])
        for j in range(i+1, len(pts)):
            tj = datetime.fromisoformat(pts[j]["t"])
            if (tj-ti).days > 30: break
            gain = pts[j]["n"] - pts[i]["n"]
            if not viral or gain > viral["gain"]:
                viral = {"from": pts[i]["t"], "to": pts[j]["t"], "gain": gain, "days": (tj-ti).days or 1}
    return pts, viral

def main():
    slug, gh_repo = sys.argv[1], sys.argv[2]
    full = "--full" in sys.argv
    do_stars = "--stars" in sys.argv

    info = gh_json(f"repos/{gh_repo}") or {}
    repo_path, is_full = ensure_clone(slug, gh_repo, full)
    commits = analyze_commits(repo_path)
    if commits is None:
        print(f"  ! {slug}: no commits found (clone failed?)"); return
    stack = detect_stack(gh_repo)
    churn = analyze_churn(repo_path) if is_full else None
    stars_curve, viral = ([], None)
    if do_stars:
        respect_rate_limit(min_remaining=200)  # star-curve backfill is the costly loop
        stars_curve, viral = star_curve(gh_repo, info.get("stargazers_count", 0))

    cand = {c["slug"]: c for c in json.load(open(f"{ROOT}/data/candidates.json"))}.get(slug, {})
    # classify: cross batch-age with current liveness
    act = commits["activity"]
    by = None
    m = re.match(r"[WSXF](\d2|\d{2})", cand.get("batch") or "")
    if m:
        yy = int((cand["batch"] or "?")[1:3]); by = 2000 + yy
    batch_age = round((NOW.year + NOW.month/12) - by, 1) if by else None
    act["batch_year"] = by; act["batch_age_years"] = batch_age
    if batch_age is not None:
        if act["liveness"] >= 55 and batch_age >= 3: cls = "evergreen"   # old & alive ★
        elif act["liveness"] >= 55 and batch_age < 3: cls = "rising"      # new & alive
        elif act["liveness"] < 30: cls = "dormant"                       # fading
        else: cls = "steady"
    else:
        cls = "evergreen" if act["liveness"] >= 55 else "steady"
    act["class"] = cls
    out = dict(
        slug=slug, github=gh_repo,
        yc=dict(batch=cand.get("batch"), team_size=cand.get("team_size"),
                status=cand.get("status"), one_liner=cand.get("one_liner"),
                website=cand.get("website"), industry=cand.get("industry")),
        metrics=dict(stars=info.get("stargazers_count"), forks=info.get("forks_count"),
                     watchers=info.get("subscribers_count"), open_issues=info.get("open_issues_count"),
                     commits=commits["commits"], contributors=commits["n_authors"],
                     license=(info.get("license") or {}).get("spdx_id"),
                     created=info.get("created_at", "")[:10], primary_lang=info.get("language")),
        tier="full" if is_full else "cheap",
        timeline=dict(first=commits["first"], last=commits["last"], span_months=commits["span_months"]),
        intensity=commits["intensity"], workflow=commits["workflow"],
        activity=commits["activity"],
        monthly=commits["monthly"], contributors=commits["contributors"],
        stack=stack, churn=churn,
        stars_curve=stars_curve, viral=viral,
    )
    os.makedirs(f"{ROOT}/data/repos", exist_ok=True)
    json.dump(out, open(f"{ROOT}/data/repos/{slug}.json", "w"), indent=1, ensure_ascii=False)

    # disk-safe bulk mode: drop the clone after analysis so 100s of repos don't pile up.
    # only removes clones we created under .clones (never a symlink / external path).
    if "--cleanup" in sys.argv and not os.path.islink(repo_path) \
            and os.path.realpath(repo_path).startswith(os.path.realpath(CLONES)):
        import shutil
        shutil.rmtree(repo_path, ignore_errors=True)
    ch = f"churn✓" if churn else "churn–"
    a = out["activity"]
    print(f"  ✓ {slug:18s} {out['metrics']['stars']:>7,}★ {commits['commits']:>5}c "
          f"[{out['tier']:5s}] live={a['liveness']:>3} 90d={a['commits_90d']:>4} "
          f"age={a['batch_age_years']}y {a['class']:9s} pm:{stack['pkg_manager'] or '-'}")

if __name__ == "__main__":
    main()

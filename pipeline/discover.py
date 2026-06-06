#!/usr/bin/env python3
"""Recover open-source YC companies MISSING from the official 'Open Source' tag.

Method (link-based, high precision — not naive domain guessing):
  1. pool   = companies in all.json that are NOT tagged open-source and not already tracked
  2. scrape = fetch the company website, extract github.com/<org> links
  3. verify = the org exists and has a non-fork repo with stars >= THRESHOLD,
              and the company site itself linked to that org (link evidence)

Emits data/discovered.json — candidates to review and add to overrides/registry.

Usage:
  python3 discover.py [N]     # probe a sample of N (default 50)
  python3 discover.py --all   # sweep the whole untagged pool (slow; many HTTP fetches)
"""
import json, re, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THRESHOLD = 300
UA = "Mozilla/5.0 (compatible; yc-oss-analytics/0.1; +https://github.com/yc-oss)"
# github.com paths that are never a company's own org
NOT_ORGS = {"login", "join", "about", "features", "pricing", "marketplace", "sponsors",
            "topics", "orgs", "apps", "settings", "notifications", "explore", "trending",
            "collections", "events", "readme", "security", "enterprise", "team", "customer-stories",
            "git-guides", "open-source", "site", "contact", "blog", "search", "new", "watching"}

allc = json.load(open(f"{HERE}/_src_all.json"))
tagged = {c["slug"] for c in json.load(open(f"{HERE}/_src_opensource_tag.json"))}
tracked = set()
if os.path.exists(f"{ROOT}/data/registry.json"):
    tracked = set(json.load(open(f"{ROOT}/data/registry.json"))["companies"].keys())

def fetch(url):
    try:
        return subprocess.run(["curl", "-fsSL", "--max-time", "8", "-A", UA, url],
                              capture_output=True, text=True, timeout=12).stdout
    except Exception:
        return ""

# big orgs that companies link to but don't own
DENY_ORGS = {"google", "microsoft", "facebook", "meta", "apple", "amazon", "aws", "vercel",
             "openai", "anthropic", "huggingface", "nvidia", "cloudflare", "stripe", "twilio",
             "kubernetes", "apache", "torvalds", "golang", "rust-lang", "nodejs", "python"}

def domain(url):
    return re.sub(r"^https?://(www\.)?", "", url or "").split("/")[0].lower()

def gh_top_repo(org):
    out = subprocess.run(
        ["gh", "api", f"users/{org}/repos?per_page=100&sort=stars&type=public",
         "--jq", "[.[]|select(.fork==false)]|max_by(.stargazers_count)|{n:.full_name,s:.stargazers_count}"],
        capture_output=True, text=True).stdout.strip()
    try:
        d = json.loads(out)
        if d and d.get("s") is not None:
            return d["n"], d["s"]
    except Exception:
        pass
    return None

def org_matches_company(org, company_domain, company_name):
    """Bidirectional check: the org's GitHub profile points back to the company
    (blog domain matches) or its name/login matches the company name. Kills the
    'site links to google/<tool>' false positive."""
    out = subprocess.run(["gh", "api", f"users/{org}",
                          "--jq", "{blog:.blog, name:.name, login:.login}"],
                         capture_output=True, text=True).stdout.strip()
    try:
        p = json.loads(out)
    except Exception:
        return False
    if p.get("blog") and domain(p["blog"]) == company_domain:
        return True
    norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
    cn = norm(company_name)
    return cn and (cn == norm(p.get("login")) or cn == norm(p.get("name")))

def orgs_from_html(html):
    """Return [(org, distinct_repo_count)] ordered by how many of the org's repos the
    site links — linking 2+ repos under one org is strong ownership evidence."""
    repos_by_org = {}
    for m in re.finditer(r"github\.com/([A-Za-z0-9][A-Za-z0-9-]{0,38})(?:/([A-Za-z0-9._-]+))?", html):
        org, repo = m.group(1), m.group(2)
        if org.lower() in NOT_ORGS or org.lower() in DENY_ORGS:
            continue
        repos_by_org.setdefault(org, set())
        if repo and repo.lower() not in {"blob", "tree", "issues", "pulls", "wiki"}:
            repos_by_org[org].add(repo)
    ranked = sorted(repos_by_org.items(), key=lambda kv: -len(kv[1]))
    return [(org, len(repos)) for org, repos in ranked][:4]

pool = [c for c in allc if c.get("website") and c["slug"] not in tagged and c["slug"] not in tracked]
if "--all" in sys.argv:
    sample = pool
else:
    n = int(next((a for a in sys.argv[1:] if a.isdigit()), 50))
    step = max(1, len(pool) // n)
    sample = pool[::step][:n]

print(f"pool (untagged, has website): {len(pool)} | probing {len(sample)} | threshold {THRESHOLD}★")
hits, scraped_ok = [], 0
for c in sample:
    html = fetch(c["website"])
    if not html:
        continue
    scraped_ok += 1
    cdom = domain(c["website"])
    for org, repo_count in orgs_from_html(html):
        # accept if the org is verifiably theirs (profile/name) OR the site showcases
        # 2+ distinct repos under it (strong ownership evidence)
        if not (repo_count >= 2 or org_matches_company(org, cdom, c["name"])):
            continue
        tr = gh_top_repo(org)
        if tr and tr[1] >= THRESHOLD:
            hits.append({"slug": c["slug"], "name": c["name"], "batch": c["batch"],
                         "github": tr[0], "stars": tr[1], "website": c["website"]})
            print(f"  ★ {c['name'][:24]:24s} {c['batch']:13s} {tr[0]:32s} {tr[1]:,}★")
            break

json.dump(hits, open(f"{ROOT}/data/discovered.json", "w"), indent=1, ensure_ascii=False)
rate = 100 * len(hits) / scraped_ok if scraped_ok else 0
print(f"\nreachable sites: {scraped_ok}/{len(sample)} | recovered: {len(hits)} "
      f"({rate:.0f}% of reachable) — link-verified, review before adding to overrides")

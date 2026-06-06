# Roadmap

Captured ideas, ordered loosely by foundation-first. Each notes **data feasibility**:
*now* = computable from a single crawl; *snapshots* = needs the weekly cron to accumulate
deltas; *archive* = needs GH Archive / OSS Insight (event stream with actor identity).

## Analysis features

### Dev-tool & AI-agent detection — *config-file half implemented*
Detect which IDEs / CLIs / coding agents a team uses. `pipeline/dev_tools.py` scans the repo
tree (API, no clone) for tool fingerprints. **Labelling accuracy matters:** `AGENTS.md` is a
vendor-neutral convention (Codex, Cursor, Jules, Amp, Zed, …), so it's reported as the generic
`AGENTS.md` agent-instructions signal, *not* attributed to Codex. `MCP` (`.mcp.json`) is
excluded — it's a protocol, not a coding tool, and its presence is ambiguous. The git-log half
(co-author trailers, agent bot authors) still needs the clone (compute it in run.py).
- **Direct evidence:** `Co-Authored-By:` trailers (Claude / Cursor / Copilot / Devin), agent
  bot authors (`*[bot]`, `devin-ai-integration[bot]`, `google-labs-jules[bot]`), message
  signatures ("Generated with Claude Code"), and config files in the tree
  (`CLAUDE.md`, `.cursor/`, `.cursorrules`, `AGENTS.md`, `.github/copilot-instructions.md`,
  `.windsurfrules`, `.aider*`, `.zed/`, `.idea/`, `.vscode/`).
- **Inferred:** message style, emoji conventions, AI-coauthor ratio over time.
- Output: per-repo `dev_tools` block. High-value, very shareable.

### Trending / momentum — *commits & stars now; forks need snapshots*
Recent movement, not just totals.
- **Commit momentum** (*now*): commits in last 30d vs prior 30d → acceleration.
- **Star momentum** (*now* for <40k-star repos): stars in last 30/90d from stargazer
  timestamps; (*archive* for large repos).
- **Fork momentum** (*snapshots*): forks lack reliable historical timestamps via REST →
  accumulate weekly, or use GH Archive ForkEvent.

### Language trends over time — *now (batch year = time axis)*
Group repos by YC batch year and chart language/stack mix over cohorts (e.g. is Rails fading,
is the AI era TS/Python-heavy?). No historical snapshots needed — batch year is the timeline.

### Star authenticity / "is this traction real?" — *now + sampling; deeper via archive*
Surface **signals, never verdicts** (see README ethics).
- Ratio checks (*now*): stars/forks, stars/contributors, stars/issues outliers.
- Burst shape (*now*): organic spikes decay; purchased ones step-and-flatline.
- Stargazer account quality (*sampling*): sample N stargazers → account age, followers,
  public repos → low-quality share.
- **YC-network early-star ratio** (*now, graph-based*): of a repo's first ~200 stargazers,
  what share also starred ≥2 other YC repos in our set. Derived structurally from
  cross-starring — **no roster of individuals**. Distinguishes legit YC-network amplification
  (high-quality accounts) from farmed stars (low-quality accounts).

## Data quality

### Verification-based discovery — *implemented; full sweep pending*
Recover open-source YC companies the official tag misses (empty-tag false negatives).
`pipeline/discover.py` scrapes company sites for `github.com/<org>` links and accepts an org
only if (a) its GitHub profile points back to the company domain / name matches, **or** (b) the
site showcases 2+ distinct repos under it. Naive domain→org guessing was too noisy; the
bidirectional check kills false positives (verified: it rejects `google/<tool>` linked from an
unrelated company, and accepts a real untagged-OSS company whose org blog matches its domain).
Emits `data/discovered.json` as a **human-review queue**, never auto-applied.
**Empirical finding:** sampling shows the upstream mis-tag rate is *low* — most untagged
companies genuinely aren't open source — so the missing set is small (a handful), not a
systemic gap. A full `--all` sweep (≈5.7k HTTP fetches) should run as a one-off CI job.

### Daily-exact star curves — *archive for >40k; now for smaller*
Full pagination gives exact daily curves under the ~40k-star (400-page) API ceiling. Move large
repos to GH Archive / OSS Insight for unbounded daily history **and** per-star actor identity
(which also powers authenticity + YC-network analysis).

## Platform

- **Search**: client-side (Orama/Fuse) over a flat record index now; promote to a Workers
  endpoint or Algolia only when client-side stops scaling. Keep the published JSON
  flat/Algolia-ready.
- **OG social cards** (Satori) per repo — shareability.
- **Automation**: weekly GitHub Actions cron → re-crawl, accumulate star/fork/commit snapshots,
  commit `data/`, auto-deploy.
- **i18n**: native review for ja / ko / pt (currently English fallback). en / zh-Hant / zh-Hans
  done.

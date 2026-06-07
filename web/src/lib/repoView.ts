// Map one RepoData -> the repo-detail view shape consumed by RepoPage.jsx.
import { repos, repoBySlug, devToolsFor, type RepoData } from './data';

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// YC batch code (e.g. "S20", "W21", "X25", "F25") -> approximate calendar month.
const BATCH_MONTH: Record<string, number> = { W: 1, X: 4, S: 6, F: 9 };
function batchDecimal(batch: string): { dec: number; ym: string } | null {
  const m = /^([WXSF])(\d{2})$/.exec(batch || '');
  if (!m) return null;
  const month = BATCH_MONTH[m[1]];
  const year = 2000 + parseInt(m[2], 10);
  return { dec: year + (month - 1) / 12, ym: `${year}-${String(month).padStart(2, '0')}` };
}
const toDecimal = (iso: string) => { const [y, mo] = iso.split('-').map(Number); return y + ((mo || 1) - 1) / 12; };

// "top X%" — higher value ranks better. Computed across all repos with the metric.
function topPct(value: number, all: number[]): number {
  const xs = all.filter((v) => v != null);
  if (!xs.length) return 50;
  const below = xs.filter((v) => v < value).length;
  return Math.max(1, 100 - Math.round((100 * below) / xs.length));
}
const LANGCOLOR: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584', Go: '#00ADD8',
  Ruby: '#701516', Kotlin: '#A97BFF', Java: '#b07219', 'C++': '#f34b7d', 'C#': '#178600', Swift: '#F05138',
  Shell: '#89e051', Lua: '#000080', 'Jupyter Notebook': '#DA5B0B', MDX: '#fcb32c', C: '#555555', HTML: '#e34c26', CSS: '#563d7c', Dockerfile: '#384d54',
};
const lc = (l: string) => LANGCOLOR[l] || '#7d8794';

export function toRepoView(slug: string) {
  const r: RepoData | undefined = repoBySlug(slug);
  if (!r) return null;
  const commits = r.metrics?.commits ?? 0;
  const aiPct = commits ? Math.round((100 * (r.intensity?.ai_coauthor_total ?? 0)) / commits) : 0;

  // star curve -> indexed points; viral index = first point on/after viral.from
  const rawCurve = r.stars_curve ?? [];
  const curve = rawCurve.map((p, i) => ({ i, v: p.n, month: p.t.slice(0, 7), t: p.t }));
  let viralIndex = 0;
  if (r.viral) { const k = rawCurve.findIndex((p) => p.t >= r.viral!.from); viralIndex = k >= 0 ? k : 0; }
  // event-day spikes -> their position on the curve (for markers)
  const spikes = ((r as any).star_spikes ?? [])
    .map((s: any) => { const k = rawCurve.findIndex((p) => p.t === s.t); return k >= 0 ? { i: k, v: rawCurve[k].n, t: s.t, gain: s.gain } : null; })
    .filter(Boolean)
    .sort((a: any, b: any) => b.gain - a.gain)
    .slice(0, 5);

  // punch card: our weekday order is Mon..Sun (0=Mon); design wants Sun..Sat
  const pc = r.intensity?.punchcard ?? [];
  const order = [6, 0, 1, 2, 3, 4, 5];
  const grid = order.map((d) => pc[d] ?? new Array(24).fill(0));
  const pcMax = Math.max(1, ...grid.flat());

  // languages -> top shares
  const langs = Object.entries(r.stack?.languages ?? {});
  const total = langs.reduce((a, [, b]) => a + b, 0) || 1;
  const topLangs = langs.sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, b]) => ({ name, pct: Math.round((b / total) * 100), color: lc(name) }));

  // --- at-application snapshot (from existing data) ---
  const bd = batchDecimal(r.yc?.batch ?? '');
  let apply: any = null;
  if (bd) {
    const firstDec = r.timeline?.first ? toDecimal(r.timeline.first) : bd.dec;
    const leadMonths = Math.round((bd.dec - firstDec) * 12);
    const commitsThen = (r.monthly ?? []).filter((x) => x.m <= bd.ym).reduce((a, x) => a + x.c, 0);
    let starsThen = 0;
    for (const p of r.stars_curve ?? []) { if (p.t.slice(0, 7) <= bd.ym) starsThen = p.n; else break; }
    apply = { batchYM: bd.ym, leadMonths, commitsThen, starsThen };
  }

  // --- peer percentiles across the whole dataset ---
  const allStars = repos.map((x) => x.metrics?.stars ?? 0);
  const allCpw = repos.map((x) => x.intensity?.commits_per_week ?? 0);
  const allLive = repos.map((x) => x.activity?.liveness ?? 0);
  const peers = {
    stars: topPct(r.metrics?.stars ?? 0, allStars),
    commitsPerWeek: topPct(r.intensity?.commits_per_week ?? 0, allCpw),
    liveness: topPct(r.activity?.liveness ?? 0, allLive),
  };

  // --- contributor concentration (neutral: highlight, don't label as risk) ---
  const contribs = r.contributors ?? [];
  const concentration = { top1: contribs[0]?.pct ?? 0, top3: Math.round(contribs.slice(0, 3).reduce((a, c) => a + c.pct, 0)) };

  const dt = devToolsFor(slug);
  const aiTools = [
    ...((dt?.ai_tools ?? []).map((n) => ({ id: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n, kind: 'config' }))),
    ...((dt?.editors ?? []).map((n) => ({ id: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n, kind: 'editor' }))),
  ];

  return {
    c: {
      id: r.slug, name: r.slug, org: r.github?.split('/')[0] ?? '', github: r.github,
      oneLiner: r.yc?.one_liner ?? '', batch: r.yc?.batch ?? '?', lang: r.metrics?.primary_lang ?? '—',
      stars: r.metrics?.stars ?? 0, forks: r.metrics?.forks ?? 0, commits, commitsPerWeek: r.intensity?.commits_per_week ?? 0,
      starsPerFork: r.metrics?.forks ? Math.round((r.metrics.stars / r.metrics.forks) * 10) / 10 : null,
      starsPerContributor: r.metrics?.contributors ? Math.round(r.metrics.stars / r.metrics.contributors) : null,
      contributors: r.metrics?.contributors ?? 0, liveness: r.activity?.liveness ?? 0,
      weekendPct: r.intensity?.weekend_pct ?? 0, aiAssisted: aiPct,
      monthsActive: r.timeline?.span_months ?? 0, type: cap(r.activity?.class ?? 'steady'),
      license: r.metrics?.license ?? '—', pkgManager: r.stack?.pkg_manager ?? '—', infra: r.stack?.infra ?? [],
      firstCommit: r.timeline?.first ?? null,
      formerNames: (((r as any).repo_names) ?? []).filter((n: string) => n.toLowerCase() !== (r.github || '').toLowerCase()),
      apply, peers, concentration,
    },
    d: {
      starCurve: { pts: curve, viralIndex, viralGain: r.viral?.gain ?? 0, viralDays: r.viral?.days ?? 30, spikes,
        partial: !!(r as any).curve_partial, baseline: (r as any).curve_baseline ?? 0, firstDate: rawCurve[0]?.t ?? null },
      monthlyCommits: (r.monthly ?? []).map((x) => ({ month: x.m, v: x.c })),
      punchcard: { grid, max: pcMax },
      codeGrowth: r.churn ? r.churn.by_month.map((x) => ({ month: x.m, added: x.add, deleted: x.del, net: x.add - x.del })) : [],
      contributors: (r.contributors ?? []).map((p) => ({ handle: p.name, commits: p.count })),
      langs: topLangs,
      workflow: { conventionalCommits: r.workflow?.conventional_pct ?? 0, prMergeRate: r.workflow?.merge_pct ?? 0, aiCoauthored: aiPct },
      aiTools,
    },
  };
}

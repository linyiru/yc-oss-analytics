// Map one RepoData -> the repo-detail view shape consumed by RepoPage.jsx.
import { repoBySlug, devToolsFor, type RepoData } from './data';

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
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
  const curve = (r.stars_curve ?? []).map((p, i) => ({ i, v: p.n, month: p.t.slice(0, 7) }));
  let viralIndex = 0;
  if (r.viral) { const k = (r.stars_curve ?? []).findIndex((p) => p.t >= r.viral!.from); viralIndex = k >= 0 ? k : 0; }

  // punch card: our weekday order is Mon..Sun (0=Mon); design wants Sun..Sat
  const pc = r.intensity?.punchcard ?? [];
  const order = [6, 0, 1, 2, 3, 4, 5];
  const grid = order.map((d) => pc[d] ?? new Array(24).fill(0));
  const pcMax = Math.max(1, ...grid.flat());

  // languages -> top shares
  const langs = Object.entries(r.stack?.languages ?? {});
  const total = langs.reduce((a, [, b]) => a + b, 0) || 1;
  const topLangs = langs.sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, b]) => ({ name, pct: Math.round((b / total) * 100), color: lc(name) }));

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
    },
    d: {
      starCurve: { pts: curve, viralIndex, viralGain: r.viral?.gain ?? 0, viralDays: r.viral?.days ?? 30 },
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

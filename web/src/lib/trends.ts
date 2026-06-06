// Cross-repo aggregations. Batch year is the time axis — no historical snapshots needed.
import { repos, devTools, type RepoData } from './data';

export interface Mover { slug: string; oneLiner: string; c90: number; c30: number; accel: number; stars: number }
// Commit momentum from existing data: c90 = commits in last 90d; accel = last-30d rate vs the
// quarter's monthly average (>1 = speeding up). Star momentum is added once curves are backfilled.
export function movers(): { mostActive: Mover[]; accelerating: Mover[] } {
  const scored: Mover[] = repos
    .filter((r) => r.activity?.commits_90d != null)
    .map((r) => {
      const c90 = r.activity.commits_90d, c30 = r.activity.commits_30d;
      const expected = c90 / 3;
      return { slug: r.slug, oneLiner: r.yc.one_liner, c90, c30, accel: expected > 0 ? +(c30 / expected).toFixed(2) : 0, stars: r.metrics.stars };
    });
  return {
    mostActive: [...scored].sort((a, b) => b.c90 - a.c90).slice(0, 10),
    accelerating: scored.filter((s) => s.c90 >= 30).sort((a, b) => b.accel - a.accel).slice(0, 10),
  };
}

export function devToolAdoption(): { scanned: number; withAI: number; tools: { name: string; count: number; pct: number }[]; editors: { name: string; count: number }[] } {
  const entries = Object.values(devTools);
  const scanned = entries.length;
  const ai: Record<string, number> = {}, ed: Record<string, number> = {};
  let withAI = 0;
  for (const e of entries) {
    if (e.ai_tools.length) withAI++;
    for (const t of e.ai_tools) ai[t] = (ai[t] ?? 0) + 1;
    for (const x of e.editors) ed[x] = (ed[x] ?? 0) + 1;
  }
  const tools = Object.entries(ai).sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: scanned ? Math.round((100 * count) / scanned) : 0 }));
  const editors = Object.entries(ed).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  return { scanned, withAI, tools, editors };
}

export interface YearBucket {
  year: number;
  count: number;
  langs: Record<string, number>; // share 0..1 by bytes
  topLang: string;
  pkgManagers: Record<string, number>;
  aiAdoptionPct: number; // % of repos in the cohort with an AI-coding signal
}

const AI_SIGNALS = new Set(['claude-code']); // infra markers that imply an AI coding tool

function batchYear(r: RepoData): number | null {
  return r.activity?.batch_year ?? null;
}

export function languageTrends(top = 8): { years: YearBucket[]; languages: string[] } {
  const byYear = new Map<number, RepoData[]>();
  for (const r of repos) {
    const y = batchYear(r);
    if (y == null) continue;
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(r);
  }

  // global top languages by total bytes (to keep the stack readable)
  const globalBytes: Record<string, number> = {};
  for (const r of repos) for (const [l, b] of Object.entries(r.stack?.languages ?? {})) globalBytes[l] = (globalBytes[l] ?? 0) + b;
  const languages = Object.entries(globalBytes).sort((a, b) => b[1] - a[1]).slice(0, top).map(([l]) => l);

  const years: YearBucket[] = [];
  for (const [year, rs] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const bytes: Record<string, number> = {};
    const pkg: Record<string, number> = {};
    let aiCount = 0;
    for (const r of rs) {
      for (const [l, b] of Object.entries(r.stack?.languages ?? {})) bytes[l] = (bytes[l] ?? 0) + b;
      if (r.stack?.pkg_manager) pkg[r.stack.pkg_manager] = (pkg[r.stack.pkg_manager] ?? 0) + 1;
      const ai = (r.intensity?.ai_coauthor_total ?? 0) > 0 || (r.stack?.infra ?? []).some((i) => AI_SIGNALS.has(i));
      if (ai) aiCount++;
    }
    const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
    const langs: Record<string, number> = {};
    for (const l of languages) langs[l] = (bytes[l] ?? 0) / total;
    langs['Other'] = 1 - Object.values(langs).reduce((a, b) => a + b, 0);
    const topLang = Object.entries(bytes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    years.push({ year, count: rs.length, langs, topLang, pkgManagers: pkg, aiAdoptionPct: Math.round((100 * aiCount) / rs.length) });
  }
  return { years, languages: [...languages, 'Other'] };
}

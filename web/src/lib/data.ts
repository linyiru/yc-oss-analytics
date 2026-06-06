// Loads the pipeline contract JSON (data/repos/*.json) at build time.
export interface RepoData {
  slug: string;
  github: string;
  yc: { batch: string; team_size: number | null; status: string; one_liner: string; website: string; industry: string };
  metrics: { stars: number; forks: number; watchers: number; commits: number; contributors: number; license: string; created: string; primary_lang: string };
  tier: 'full' | 'cheap';
  timeline: { first: string; last: string; span_months: number };
  intensity: { commits_per_week: number; per_day: number; weekend_pct: number; punchcard: number[][]; dow: number[]; ai_coauthor_total: number };
  workflow: { conventional_pct: number; conv: { k: string; v: number }[]; merge_pct: number; median_msg_len: number };
  activity: { last_commit_days: number; commits_30d: number; commits_90d: number; commits_365d: number; active_contributors_90d: number; years_since_first_commit: number; liveness: number; still_active: boolean; batch_year: number | null; batch_age_years: number | null; class: string };
  monthly: { m: string; c: number }[];
  contributors: { name: string; count: number; pct: number }[];
  stack: { languages: Record<string, number>; manifests: string[]; pkg_manager: string | null; deps_top: string[]; infra: string[] };
  churn: null | { total_add: number; by_month: { m: string; add: number; del: number }[]; by_ext: { ext: string; add: number }[] };
  stars_curve: { t: string; n: number }[];
  viral: null | { from: string; to: string; gain: number; days: number };
}

const modules = import.meta.glob<{ default: RepoData }>('../data/repos/*.json', { eager: true });

export const repos: RepoData[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => b.metrics.stars - a.metrics.stars);

export const repoBySlug = (slug: string): RepoData | undefined => repos.find((r) => r.slug === slug);

// AI dev-tool detection (separate, optional file produced by pipeline/dev_tools.py)
export interface DevTools { github: string; ai_tools: string[]; editors: string[]; evidence: string }
const devToolsMod = import.meta.glob<{ default: Record<string, DevTools> }>('../data/dev_tools.json', { eager: true });
export const devTools: Record<string, DevTools> = (Object.values(devToolsMod)[0] as any)?.default ?? {};
export const devToolsFor = (slug: string): DevTools | undefined => devTools[slug];

// Star-traction transparency signals (optional file from pipeline/authenticity.py).
// We surface only the neutral ratios on the UI — never a "score" or accusation.
export interface Authenticity { stars_per_fork: number | null; stars_per_contributor: number | null; fork_engagement_pct: number | null; organic_score: number; flags: string[] }
const authMod = import.meta.glob<{ default: Record<string, Authenticity> }>('../data/authenticity.json', { eager: true });
export const authenticity: Record<string, Authenticity> = (Object.values(authMod)[0] as any)?.default ?? {};
export const authFor = (slug: string): Authenticity | undefined => authenticity[slug];

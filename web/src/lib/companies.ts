// Map our real pipeline data -> the directory's company shape (for Directory.jsx).
import { repos } from './data';

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const companies = repos.map((r) => ({
  id: r.slug,
  name: r.slug,
  org: r.github?.split('/')[0] ?? '',
  oneLiner: r.yc?.one_liner ?? '',
  batch: r.yc?.batch ?? '?',
  lang: r.metrics?.primary_lang ?? '—',
  stars: r.metrics?.stars ?? 0,
  commitsPerWeek: r.intensity?.commits_per_week ?? 0,
  aiAssisted: r.metrics?.commits ? Math.round((100 * (r.intensity?.ai_coauthor_total ?? 0)) / r.metrics.commits) : 0,
  liveness: r.activity?.liveness ?? 0,
  type: cap(r.activity?.class ?? 'steady'),
  yrs: r.activity?.batch_age_years ?? null,
}));

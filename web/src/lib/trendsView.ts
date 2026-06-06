// Build the cross-cohort trends view (server-side) for the Trends island.
import { languageTrends, devToolAdoption } from './trends';
import { repos } from './data';

export function trendsView() {
  const { years, languages } = languageTrends();
  const tools = devToolAdoption();
  return {
    count: repos.length,
    langSet: languages,
    byYear: years.map((y) => ({
      year: y.year,
      repos: y.count,
      topLang: y.topLang,
      aiAvg: y.aiAdoptionPct,
      shares: languages.map((l) => ({ lang: l, pct: Math.round((y.langs[l] ?? 0) * 100), n: Math.round(y.count * (y.langs[l] ?? 0)) })),
    })),
    adoption: tools.tools.map((t) => ({ id: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: t.name, pct: t.pct })),
    scanned: tools.scanned,
    withAI: tools.withAI,
  };
}

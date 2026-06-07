// Build the cross-cohort trends view (server-side) for the Trends island.
import { languageTrends, devToolAdoption } from './trends';
import { repos } from './data';

export function trendsView() {
  const { years, languages } = languageTrends();
  const tools = devToolAdoption();
  const lic: Record<string, number> = {};
  for (const r of repos) {
    const l = r.metrics?.license || 'NOASSERTION';
    lic[l] = (lic[l] ?? 0) + 1;
  }
  const licenses = Object.entries(lic)
    .map(([name, count]) => ({ name: name === 'NOASSERTION' ? 'Custom / Other' : name, count }))
    .sort((a, b) => b.count - a.count);

  // Company outcomes (survivorship made visible) — from YC's own ycdc_status.
  const order = ['Active', 'Acquired', 'Public', 'Inactive'];
  const oc: Record<string, number> = {};
  for (const r of repos) { const s = (r as any).yc?.status; if (s) oc[s] = (oc[s] ?? 0) + 1; }
  const withStatus = Object.values(oc).reduce((a, b) => a + b, 0);
  const outcomes = order.filter((s) => oc[s]).map((name) => ({ name, count: oc[name] }));
  const notActive = withStatus - (oc['Active'] ?? 0);

  return {
    licenses,
    outcomes, withStatus, notActive,
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

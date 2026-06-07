// Build the cross-cohort trends view (server-side) for the Trends island.
import { languageTrends, devToolAdoption } from './trends';
import { repos } from './data';
import { depsView } from './depsView';

export function trendsView() {
  const { years, languages } = languageTrends();
  const tools = devToolAdoption();
  // Precise licensing — from the LICENSE-file audit (model + real license), not GitHub's
  // single SPDX field (which flattens open-core / source-available to "NOASSERTION").
  const byModel: Record<string, number> = {}, byDetected: Record<string, number> = {};
  for (const r of repos) {
    const d = (r.metrics as any)?.license_detail;
    const model = d?.model || (r.metrics?.license && r.metrics.license !== 'NOASSERTION' ? 'Permissive' : 'Custom');
    byModel[model] = (byModel[model] ?? 0) + 1;
    const det = d?.detected || (r.metrics?.license && r.metrics.license !== 'NOASSERTION' ? r.metrics.license : 'Custom / Proprietary');
    byDetected[det] = (byDetected[det] ?? 0) + 1;
  }
  const MODEL_ORDER = ['Permissive', 'Copyleft', 'Open-core', 'Source-available', 'Custom', 'Other'];
  const licenseModels = MODEL_ORDER.filter((m) => byModel[m]).map((name) => ({ name, count: byModel[name] }));
  const licensesDetailed = Object.entries(byDetected).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const eeCount = repos.filter((r) => (r.metrics as any)?.license_detail?.ee).length;
  const saCount = repos.filter((r) => (r.metrics as any)?.license_detail?.source_available).length;
  const licenses = licensesDetailed; // back-compat for the existing chart

  // Company outcomes (survivorship made visible) — from YC's own ycdc_status.
  const order = ['Active', 'Acquired', 'Public', 'Inactive'];
  const oc: Record<string, number> = {};
  for (const r of repos) { const s = (r as any).yc?.status; if (s) oc[s] = (oc[s] ?? 0) + 1; }
  const withStatus = Object.values(oc).reduce((a, b) => a + b, 0);
  const outcomes = order.filter((s) => oc[s]).map((name) => ({ name, count: oc[name] }));
  const notActive = withStatus - (oc['Active'] ?? 0);

  return {
    stack: depsView(),
    licenses, licenseModels, licensesDetailed, eeCount, saCount,
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

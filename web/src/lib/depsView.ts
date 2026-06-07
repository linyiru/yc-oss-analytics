// Stack analysis: what packages YC OSS companies use for each function, by ecosystem.
// Derived from each repo's extracted deps (stack.deps) + the curated taxonomy.
import { repos } from './data';
import { classify, CATEGORIES, type DepInfo } from './deps-taxonomy';

interface Used extends DepInfo { }

// per-repo: unique set of classified products (dedupe @clerk/nextjs + @clerk/core -> one Clerk)
function repoUses(r: any): Map<string, Used> {
  const deps: string[] = r.stack?.deps ?? [];
  const m = new Map<string, Used>();
  for (const d of deps) { const c = classify(d); if (c) m.set(c.label, c); }
  return m;
}

function topByCat(rs: any[], cat: string, n = 5) {
  const count = new Map<string, { label: string; count: number; host?: string; yc?: boolean }>();
  for (const r of rs) {
    for (const u of repoUses(r).values()) {
      if (u.cat !== cat) continue;
      const e = count.get(u.label) ?? { label: u.label, count: 0, host: u.host, yc: u.yc };
      e.count++; count.set(u.label, e);
    }
  }
  return [...count.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

export function depsView() {
  const catLabel = Object.fromEntries(CATEGORIES);
  const withDeps = repos.filter((r) => (r.stack as any)?.deps?.length);
  const ts = withDeps.filter((r) => r.metrics?.primary_lang === 'TypeScript');
  const py = withDeps.filter((r) => r.metrics?.primary_lang === 'Python');

  // ① category leaders — overall top package per category, with build/buy + YC tags
  const leaders = CATEGORIES.map(([cat, label]) => ({ cat, label, top: topByCat(withDeps, cat, 5) }))
    .filter((c) => c.top.length);

  // ① split: TS vs Python leaderboards for the categories where both have signal
  const splitCats = ['auth', 'database', 'api', 'validation', 'queue', 'ai'];
  const byLang = {
    TypeScript: splitCats.map((cat) => ({ cat, label: catLabel[cat], top: topByCat(ts, cat, 3) })).filter((c) => c.top.length),
    Python: splitCats.map((cat) => ({ cat, label: catLabel[cat], top: topByCat(py, cat, 3) })).filter((c) => c.top.length),
  };

  // ② the canonical TS "house stack" — modal package per category among TS repos
  const houseStack = {
    lang: 'TypeScript', n: ts.length,
    items: CATEGORIES.map(([cat, label]) => { const t = topByCat(ts, cat, 1)[0]; return t && t.count >= 3 ? { cat, label, pick: t.label, count: t.count } : null; }).filter(Boolean),
  };

  // ③ build vs buy — per category, repos using a self-hosted library vs a managed service
  const buildBuy = CATEGORIES.map(([cat, label]) => {
    let self = 0, managed = 0;
    for (const r of withDeps) {
      const us = [...repoUses(r).values()].filter((u) => u.cat === cat);
      if (us.some((u) => u.host === 'self')) self++;
      if (us.some((u) => u.host === 'managed')) managed++;
    }
    const top = topByCat(withDeps, cat, 8);
    return { cat, label, self, managed, selfTop: top.find((t) => t.host === 'self')?.label, managedTop: top.find((t) => t.host === 'managed')?.label };
  }).filter((c) => c.self + c.managed >= 4 && c.self && c.managed).sort((a, b) => (b.self + b.managed) - (a.self + a.managed));

  // ④ YC dogfooding — how often these repos depend on other YC companies' products
  const ycCount = new Map<string, { label: string; count: number; cat: string }>();
  let reposUsingYc = 0;
  for (const r of withDeps) {
    const yc = [...repoUses(r).values()].filter((u) => u.yc);
    if (yc.length) reposUsingYc++;
    for (const u of yc) { const e = ycCount.get(u.label) ?? { label: u.label, count: 0, cat: u.cat }; e.count++; ycCount.set(u.label, e); }
  }
  const dogfood = {
    reposUsing: reposUsingYc, withDeps: withDeps.length,
    top: [...ycCount.values()].sort((a, b) => b.count - a.count),
  };

  return { withDeps: withDeps.length, tsN: ts.length, pyN: py.length, leaders, byLang, houseStack, buildBuy, dogfood };
}

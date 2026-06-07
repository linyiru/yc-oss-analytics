/* Trends island — cross-cohort analysis, ported from the Claude Design handoff. */
import React, { useEffect } from 'react';
import { Store, useStore, TopNav, Footer, Section, StackedShare, RankedBars, langColor } from './kit.jsx';

const colorOf = (l) => (l === 'Other' ? 'var(--dormant)' : langColor(l));

export default function Trends({ tr, initialLocale }) {
  const { intl } = useStore();
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  const aiByYear = tr.byYear.filter((y) => y.repos > 0);
  const maxAi = Math.max(1, ...aiByYear.map((y) => y.aiAvg));
  return (
    <>
      <TopNav active="trends" count={tr.count} />
      <main className="wrap" style={{ padding: '26px 20px 0' }}>
        <div style={{ maxWidth: 640, marginBottom: 22 }}>
          <span className="eyebrow">Cross-cohort trends</span>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.1, margin: '8px 0 10px' }}>What changed, batch by batch.</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>Aggregated across {tr.count} YC open-source companies — the stack shift toward TypeScript &amp; Python, and the fast rise of AI-assisted development.</p>
        </div>

        <div className="trends-grid" style={{ marginBottom: 16 }}>
          <Section title="Programming-language share by batch" sub="100% stacked · share of bytes per YC cohort year">
            <StackedShare byYear={tr.byYear} colorOf={colorOf} height={320} />
            <div className="row" style={{ flexWrap: 'wrap', gap: '6px 14px', marginTop: 14 }}>
              {tr.langSet.map((l) => <span key={l} className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}><i style={{ width: 9, height: 9, borderRadius: 2, background: colorOf(l) }}></i>{l}</span>)}
            </div>
          </Section>

          <Section title="AI coding-tool adoption" sub={`${tr.withAI} of ${tr.scanned} repos show a signal`}>
            <RankedBars items={tr.adoption.map((a) => ({ label: a.name, value: a.pct, color: a.id === 'claude-code' ? 'var(--accent)' : 'var(--steady)' }))} fmt={(v) => v + '%'} />
            <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 14 }}>Detected via config files (<span className="mono">CLAUDE.md</span>, <span className="mono">AGENTS.md</span>, <span className="mono">.cursor/</span>) &amp; commit co-authors. A lower bound.</p>
          </Section>
        </div>

        <Section title="License choice" sub="Reflects commercialization strategy — MIT for adoption, Apache for enterprise/patents, AGPL to protect a SaaS" style={{ marginBottom: 16 }}>
          <RankedBars items={tr.licenses.map((l) => ({ label: l.name, value: l.count, color: l.name.startsWith('AGPL') || l.name.startsWith('GPL') ? '#f7853a' : l.name.startsWith('Apache') ? '#4f9df7' : l.name.startsWith('MIT') ? '#43c46a' : 'var(--text-3)' }))} fmt={(v) => v + ''} />
        </Section>

        <div className="trends-grid" style={{ marginBottom: 16 }}>
          <Section title="AI-assisted commits, rising by cohort" sub="Mean AI-assisted % across each batch year">
            <div className="row" style={{ alignItems: 'flex-end', gap: 10, height: 200, padding: '8px 4px 0' }}>
              {aiByYear.map((y) => (
                <div key={y.year} className="col grow" style={{ alignItems: 'center', gap: 8, justifyContent: 'flex-end', height: '100%' }}>
                  <span className="mono tabular" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: y.aiAvg >= 40 ? 'var(--accent-text)' : 'var(--text-2)' }}>{y.aiAvg}%</span>
                  <div className="wide" style={{ height: `${(y.aiAvg / maxAi) * 100}%`, minHeight: 3, borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 55%, transparent))', transition: 'height .5s var(--ease)' }}></div>
                  <span className="mono faint" style={{ fontSize: 10 }}>'{String(y.year).slice(2)}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="By batch year" sub="Summary across cohorts">
            <div style={{ overflow: 'auto' }}>
              <table className="tbl">
                <thead><tr><th>Year</th><th className="num">Repos</th><th>Top language</th><th className="num">AI-assisted</th></tr></thead>
                <tbody>
                  {tr.byYear.map((y) => (
                    <tr key={y.year} style={{ cursor: 'default', opacity: y.repos < 5 ? 0.5 : 1 }} title={y.repos < 5 ? 'small sample (n<5) — not statistically meaningful' : undefined}>
                      <td className="mono" style={{ fontWeight: 600 }}>{y.year}</td>
                      <td className="num mono tabular">{y.repos}{y.repos < 5 && <span className="faint" style={{ fontSize: 9, marginLeft: 4 }}>n&lt;5</span>}</td>
                      <td><span className="row gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}><i style={{ width: 8, height: 8, borderRadius: 8, background: colorOf(y.topLang) }}></i>{y.topLang}</span></td>
                      <td><span className="row gap-3" style={{ justifyContent: 'flex-end' }}><b className="mono tabular" style={{ width: 30, textAlign: 'right' }}>{y.aiAvg}%</b><span className="meter" style={{ width: 56 }}><i style={{ width: y.aiAvg + '%', background: 'var(--accent)' }}></i></span></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

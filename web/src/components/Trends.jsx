/* Trends island — cross-cohort analysis, ported from the Claude Design handoff. */
import React, { useEffect } from 'react';
import { Store, useStore, TopNav, Footer, Section, StackedShare, RankedBars, langColor } from './kit.jsx';

const colorOf = (l) => (l === 'Other' ? 'var(--dormant)' : langColor(l));

export default function Trends({ tr, initialLocale }) {
  const { intl, T } = useStore();
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

        {tr.outcomes?.length > 0 && (
          <Section title={T('outcomesTitle')} sub={T('outcomesSub').replace('{a}', tr.withStatus).replace('{b}', tr.notActive)} style={{ marginBottom: 16 }}>
            <RankedBars items={tr.outcomes.map((o) => ({ label: T(o.name), value: o.count, color: o.name === 'Active' ? 'var(--evergreen)' : o.name === 'Acquired' ? 'var(--steady)' : o.name === 'Public' ? 'var(--accent)' : 'var(--dormant)' }))} fmt={(v) => v + ''} />
            <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 14 }}>
              {T('outcomesNote').replace('{p}', Math.round((100 * tr.notActive) / tr.withStatus))}
            </p>
          </Section>
        )}

        <div className="trends-grid" style={{ marginBottom: 16 }}>
          <Section title="Licensing model" sub={`What they actually ship under · ${tr.saCount} source-available · ${tr.eeCount} open-core (with an enterprise edition)`}>
            <RankedBars items={(tr.licenseModels || []).map((m) => ({ label: m.name, value: m.count, color: m.name === 'Permissive' ? '#43c46a' : m.name === 'Copyleft' ? '#f7853a' : m.name === 'Open-core' ? 'var(--accent)' : m.name === 'Source-available' ? '#4f9df7' : 'var(--text-3)' }))} fmt={(v) => v + ''} />
            <p className="faint" style={{ fontSize: 'var(--fs-2xs)', lineHeight: 1.5, marginTop: 14 }}>
              GitHub flattens many of these to "NOASSERTION"; this reads each repo's actual LICENSE file. <b style={{ color: 'var(--text-2)' }}>Open-core</b> = a permissive/copyleft core plus a proprietary <span className="mono">ee/</span> enterprise edition; <b style={{ color: 'var(--text-2)' }}>source-available</b> = Elastic / BUSL / SSPL / FSL (visible source, not OSI-open).
            </p>
          </Section>
          <Section title="Actual license" sub="The real license behind each repo — open-core shown as base + EE">
            <RankedBars items={(tr.licensesDetailed || []).slice(0, 12).map((l) => ({ label: l.name, value: l.count, color: /EE|Elastic|BUSL|SSPL|FSL|Source|Custom|Proprietary|Sustainable|Confluent/.test(l.name) ? 'var(--accent)' : l.name.startsWith('AGPL') || l.name.startsWith('GPL') ? '#f7853a' : l.name.startsWith('Apache') ? '#4f9df7' : l.name.startsWith('MIT') || l.name.startsWith('BSD') ? '#43c46a' : 'var(--text-3)' }))} fmt={(v) => v + ''} />
          </Section>
        </div>

        {tr.stack?.withDeps >= 10 && (
          <>
            <div style={{ maxWidth: 640, margin: '28px 0 14px' }}>
              <span className="eyebrow">The stack</span>
              <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.1, margin: '6px 0 8px' }}>What they build with</h2>
              <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>Parsed from {tr.stack.withDeps} repos' manifests — the package or service behind each function, and whether teams self-host it or buy it.</p>
            </div>

            <Section title="The typical TypeScript stack" sub={`Most common pick per function across ${tr.stack.houseStack.n} TS repos`} style={{ marginBottom: 16 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {tr.stack.houseStack.items.map((it) => (
                  <span key={it.cat} className="badge" style={{ fontSize: 'var(--fs-xs)' }}><span className="faint">{it.label}</span>&nbsp;<b style={{ color: 'var(--text)' }}>{it.pick}</b></span>
                ))}
              </div>
            </Section>

            <Section title="Top pick per function" sub="Leading packages by repo count · ◆ = a YC company · outlined = managed service" style={{ marginBottom: 16 }}>
              <div className="col" style={{ gap: 9 }}>
                {tr.stack.leaders.map((c) => (
                  <div key={c.cat} className="row" style={{ gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span className="eyebrow" style={{ minWidth: 116 }}>{c.label}</span>
                    <span className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      {c.top.map((t) => (
                        <span key={t.label} className="badge mono" style={{ fontSize: 'var(--fs-2xs)', color: t.yc ? 'var(--accent-text)' : 'var(--text-2)', borderColor: t.host === 'managed' ? 'color-mix(in oklab, var(--steady) 55%, transparent)' : 'var(--border)' }} title={t.host === 'managed' ? 'managed service' : 'self-hosted'}>
                          {t.yc ? '◆ ' : ''}{t.label} <span className="faint">{t.count}</span>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Build vs buy" sub="Repos using a self-hosted library vs a managed service, per function" style={{ marginBottom: 16 }}>
              <div className="col" style={{ gap: 10 }}>
                {tr.stack.buildBuy.map((c) => { const tot = c.self + c.managed; return (
                  <div key={c.cat}>
                    <div className="row spread" style={{ fontSize: 'var(--fs-2xs)', marginBottom: 3 }}>
                      <span className="eyebrow">{c.label}</span>
                      <span className="faint mono">{c.selfTop} {c.self} · {c.managedTop} {c.managed}</span>
                    </div>
                    <div className="row" style={{ height: 10, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-2)' }}>
                      <i style={{ width: `${(100 * c.self) / tot}%`, background: 'var(--text-3)' }}></i>
                      <i style={{ width: `${(100 * c.managed) / tot}%`, background: 'var(--steady)' }}></i>
                    </div>
                  </div>
                ); })}
              </div>
              <p className="faint" style={{ fontSize: 'var(--fs-2xs)', marginTop: 12 }}><span style={{ color: 'var(--text-3)' }}>▮</span> self-hosted library&nbsp;&nbsp;<span style={{ color: 'var(--steady)' }}>▮</span> managed service</p>
            </Section>

            {tr.stack.dogfood.top.length > 0 && (
              <Section title="Building on YC" sub={`${Math.round((100 * tr.stack.dogfood.reposUsing) / tr.stack.dogfood.withDeps)}% of these repos depend on another YC company's product — the ecosystem builds on itself`} style={{ marginBottom: 16 }}>
                <RankedBars items={tr.stack.dogfood.top.map((d) => ({ label: d.label, value: d.count, color: 'var(--accent)' }))} fmt={(v) => v + ''} />
              </Section>
            )}

            <div className="trends-grid" style={{ marginBottom: 16 }}>
              {['TypeScript', 'Python'].map((lang) => (
                <Section key={lang} title={`${lang} reaches for…`} sub={`Top picks per function · ${lang === 'TypeScript' ? tr.stack.tsN : tr.stack.pyN} repos`}>
                  <div className="col" style={{ gap: 7 }}>
                    {tr.stack.byLang[lang].map((c) => (
                      <div key={c.cat} className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                        <span className="eyebrow" style={{ minWidth: 88, flex: '0 0 auto' }}>{c.label}</span>
                        <span className="faint mono" style={{ fontSize: 'var(--fs-2xs)' }}>{c.top.map((t) => `${t.label} (${t.count})`).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              ))}
            </div>
          </>
        )}

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

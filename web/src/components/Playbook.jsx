/* Playbook — data-backed success factors, presented like a deck.
   Numbers are computed live in lib/playbook.ts; narrative is human-written. */
import React, { useEffect } from 'react';
import { Store, TopNav, Footer } from './kit.jsx';

/* Two-bar "with vs without" comparison. Bars scale to the larger value. */
function CompareBars({ c }) {
  const hi = Math.max(c.a, c.b, 1);
  const unit = c.unit || '';
  const fmt = (n) => (unit ? n + unit : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '' + n);
  const Row = ({ v, label, lead }) => (
    <div className="col" style={{ gap: 5 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 'var(--fs-2xs)', color: lead ? 'var(--accent-text)' : 'var(--text-3)', fontWeight: lead ? 600 : 400 }}>{label}</span>
        <span className="mono tabular" style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: lead ? 'var(--accent-text)' : 'var(--text-2)' }}>{fmt(v)}</span>
      </div>
      <div style={{ height: lead ? 13 : 9, borderRadius: 7, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <i style={{
          display: 'block', height: '100%', width: `${Math.max(3, (v / hi) * 100)}%`, borderRadius: 7,
          background: lead ? 'linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #fff 12%))' : 'var(--text-3)',
          transition: 'width .7s var(--ease)',
        }} />
      </div>
    </div>
  );
  return (
    <div className="col" style={{ gap: 11, width: '100%' }}>
      <Row v={c.a} label={c.aLabel} lead />
      <Row v={c.b} label={c.bLabel} />
    </div>
  );
}

export default function Playbook({ data, initialLocale }) {
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  const { lessons, n } = data;
  return (
    <>
      <TopNav active="playbook" count={n} />
      <main className="wrap pb-deck" style={{ padding: '30px 20px 0', maxWidth: 1000 }}>
        {/* Hero */}
        <header className="pb-hero">
          <span className="eyebrow">The Playbook</span>
          <h1 className="pb-h1">What we learned from<br />{n} <span className="pb-mark">open-source</span> startups.</h1>
          <p className="muted pb-lede">
            Seven patterns we noticed across the {n} YC open-source companies in this dataset — each tied to a number computed
            straight from public history, recomputed as the data updates. What struck us is how closely they echo the startup
            canon: the data keeps landing on the same advice Paul Graham and the <a href="https://www.ycombinator.com/library" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-text)' }}>YC&nbsp;library</a> have
            given for years — so we've paired each finding with the essay it confirms. Still, these are
            <b style={{ color: 'var(--text)' }}> observations, not instructions</b>: correlations among teams that grew, not proof of cause,
            and blind to everyone who did the same things and didn't make it.
          </p>
        </header>

        {/* Slides */}
        <div className="pb-slides">
          {lessons.map((l, i) => (
            <section key={l.key} className="pb-slide card">
              <span className="pb-idx mono" aria-hidden>{String(i + 1).padStart(2, '0')}</span>

              <div className="pb-slide-grid">
                {/* Evidence column */}
                <div className="pb-evi">
                  <div className="pb-stat mono">{l.stat}</div>
                  <div className="pb-stat-label faint">{l.statLabel}</div>
                  {l.compare && (
                    <div className="pb-cmp">
                      {l.compare.mult && <div className="pb-mult mono"><span>{l.compare.mult}</span><em className="faint">the difference</em></div>}
                      <CompareBars c={l.compare} />
                    </div>
                  )}
                </div>

                {/* Narrative column */}
                <div className="pb-narr">
                  <h2 className="pb-title">{l.title}</h2>
                  {l.kicker && <div className="pb-kicker mono">{l.kicker}</div>}
                  {(l.body ?? [l.lesson]).map((para, j) => <p key={j} className="pb-lesson">{para}</p>)}

                  {l.echoes?.length > 0 && (
                    <div className="pb-echo">
                      <span className="pb-echo-label eyebrow">Echoes the canon</span>
                      {l.echoes.map((e, j) => (
                        <blockquote key={j} className="pb-echo-item">
                          <p>{e.principle}</p>
                          <cite>— {e.author}, <a href={e.url} target="_blank" rel="noreferrer">{e.source}</a></cite>
                        </blockquote>
                      ))}
                    </div>
                  )}

                  <div className="pb-eg">
                    <span className="eyebrow">In practice</span>
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      {l.examples.map((s) => <a key={s} href={`/${s}`} className="badge badge--batch mono pb-chip">{s}</a>)}
                    </div>
                  </div>
                  <p className="pb-caveat faint">⚠ {l.caveat}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="faint pb-foot">
          <b style={{ color: 'var(--text-2)' }}>One honest caveat above all the others:</b> every number here measures <i>attention</i> — stars, launches,
          comments — not revenue, retention, or whether a business exists underneath. Stars are a leading indicator that
          people noticed, nothing more. A team could do all eight of these things, reach 10,000 stars, and still have no
          users who pay or stay. Read this as a map of how attention was won, never as a scoreboard for success.
        </p>
        <p className="faint pb-foot" style={{ marginTop: 10 }}>
          Every figure recomputes from the live dataset — stars, launch events, issue/PR activity and the cross-star
          network, all derived from public GitHub history plus the HN, Product Hunt and YC-Launch records and GH Archive.
          Where a finding could be confounded by repo size, we report the association after controlling for age and language.
          See <a href="/methodology" style={{ color: 'var(--accent-text)' }}>Methodology</a> for limits — above all survivorship
          bias, which hides every team that did these same things and still didn't make it.
        </p>
      </main>
      <Footer />
    </>
  );
}

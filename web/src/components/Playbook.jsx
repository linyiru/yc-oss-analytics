/* Playbook — data-backed success factors, presented like a deck.
   Numbers are computed live in lib/playbook.ts; prose is translated in i18n/playbook-content.ts. */
import React, { useEffect } from 'react';
import { Store, useStore, TopNav, Footer } from './kit.jsx';
import { PB_UI, PB_LESSONS, PB_ACTS, fill } from '../i18n/playbook-content.ts';

/* Minimal inline markup → React nodes: **bold**, [text](url), «highlighted». */
function rich(s) {
  if (!s) return null;
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|«(.+?)»/g;
  const out = []; let last = 0, m, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1] != null) out.push(<b key={k++} style={{ color: 'var(--text)' }}>{m[1]}</b>);
    else if (m[2] != null) out.push(<a key={k++} href={m[3]} target={m[3].startsWith('/') ? undefined : '_blank'} rel="noreferrer" style={{ color: 'var(--accent-text)' }}>{m[2]}</a>);
    else if (m[4] != null) out.push(<span key={k++} className="pb-mark">{m[4]}</span>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
const DIFF = { en: 'the difference', 'zh-Hant': '的差距', 'zh-Hans': '的差距' };

/* Two-bar "with vs without" comparison. Bars scale to the larger value. */
function CompareBars({ c }) {
  const hi = Math.max(c.a, c.b, 1);
  const unit = c.unit || '';
  const fmt = (n) => (unit ? n + unit : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '' + n);
  const Row = ({ v, label, lead }) => (
    <div className="col" style={{ gap: 5 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
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
  const { locale } = useStore();
  const { lessons, n, vars = {}, acts = [] } = data;
  const V = { ...vars, n };
  const UI = PB_UI[locale] && PB_UI[locale].h1 ? PB_UI[locale] : PB_UI.en;
  const TR = PB_LESSONS[locale];
  const ACT_T = (PB_ACTS && PB_ACTS[locale]) || {};
  const actInfo = (key) => ACT_T[key] || acts.find((a) => a.key === key) || null;
  let actNo = 0;
  const diff = DIFF[locale] || DIFF.en;
  return (
    <>
      <TopNav active="playbook" count={n} />
      <main className="wrap pb-deck" style={{ padding: '30px 20px 0', maxWidth: 1000 }}>
        {/* Hero */}
        <header className="pb-hero">
          <span className="eyebrow">{UI.eyebrow}</span>
          <h1 className="pb-h1">{rich(fill(UI.h1, V))}</h1>
          <p className="muted pb-lede">{rich(fill(UI.lede, V))}</p>
        </header>

        {/* Slides */}
        <div className="pb-slides">
          {lessons.map((l, i) => {
            const t = TR && TR[l.key];
            const title = t ? t.title : l.title;
            const statLabel = t ? fill(t.statLabel, V) : l.statLabel;
            const kicker = t ? (t.kicker ? fill(t.kicker, V) : null) : l.kicker;
            const body = t ? t.body.map((p) => fill(p, V)) : (l.body ?? [l.lesson]);
            const echoes = t ? t.echoes : l.echoes;
            const caveat = t ? fill(t.caveat, V) : l.caveat;
            const compare = l.compare ? { ...l.compare, ...(t && t.compare ? t.compare : {}) } : null;
            const act = (i === 0 || lessons[i - 1].act !== l.act) ? actInfo(l.act) : null;
            if (act) actNo++;
            const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
            return (
              <React.Fragment key={l.key}>
                {act && (
                  <div className="pb-act">
                    <span className="pb-act-no mono">{romans[actNo - 1]}</span>
                    <div><h2 className="pb-act-title">{act.title}</h2><p className="pb-act-sub faint">{act.sub}</p></div>
                  </div>
                )}
                <section className="pb-slide card">
                <span className="pb-idx mono" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <div className="pb-slide-grid">
                  {/* Evidence column */}
                  <div className="pb-evi">
                    <div className="pb-stat mono">{l.stat}</div>
                    <div className="pb-stat-label faint">{statLabel}</div>
                    {compare && (
                      <div className="pb-cmp">
                        {compare.mult && <div className="pb-mult mono"><span>{compare.mult}</span><em className="faint">{diff}</em></div>}
                        <CompareBars c={compare} />
                      </div>
                    )}
                  </div>

                  {/* Narrative column */}
                  <div className="pb-narr">
                    <h2 className="pb-title">{title}</h2>
                    {kicker && <div className="pb-kicker mono">{kicker}</div>}
                    {body.map((para, j) => <p key={j} className="pb-lesson">{para}</p>)}

                    {echoes?.length > 0 && (
                      <div className="pb-echo">
                        <span className="pb-echo-label eyebrow">{UI.echoesCanon}</span>
                        {echoes.map((e, j) => (
                          <blockquote key={j} className="pb-echo-item">
                            <p>{e.principle}</p>
                            <cite>— {e.author}, <a href={e.url} target="_blank" rel="noreferrer">{e.source}</a></cite>
                          </blockquote>
                        ))}
                      </div>
                    )}

                    <div className="pb-eg">
                      <span className="eyebrow">{UI.inPractice}</span>
                      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                        {l.examples.map((s) => <a key={s} href={`/${s}`} className="badge badge--batch mono pb-chip">{s}</a>)}
                      </div>
                    </div>
                    <p className="pb-caveat faint">⚠ {caveat}</p>
                  </div>
                </div>
                </section>
              </React.Fragment>
            );
          })}
        </div>

        <p className="faint pb-foot">{rich(fill(UI.footAttention, V))}</p>
        <p className="faint pb-foot" style={{ marginTop: 10 }}>{rich(fill(UI.footMethod, V))}</p>
      </main>
      <Footer />
    </>
  );
}

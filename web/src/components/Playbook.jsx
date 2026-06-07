/* Playbook — data-backed success factors. Numbers computed live; narrative human-written. */
import React, { useEffect } from 'react';
import { Store, TopNav, Footer, Section, fmtInt } from './kit.jsx';

export default function Playbook({ data, initialLocale }) {
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  const { lessons, n } = data;
  return (
    <>
      <TopNav active="playbook" count={n} />
      <main className="wrap" style={{ padding: '26px 20px 0', maxWidth: 980 }}>
        <div style={{ maxWidth: 680, marginBottom: 24 }}>
          <span className="eyebrow">The Playbook</span>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.1, margin: '8px 0 10px' }}>What the data says actually works.</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>
            Patterns shared by the {n} YC open-source companies that grew — each backed by a number computed straight from the dataset. These are <b style={{ color: 'var(--text)' }}>correlations, not commandments</b>: they describe what winners did, not a guarantee, and they can't see the teams that did the same and failed.
          </p>
        </div>

        <div className="col" style={{ gap: 14 }}>
          {lessons.map((l, i) => (
            <div key={l.key} className="card card-pad" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, alignItems: 'start' }}>
              <div className="col" style={{ gap: 4 }}>
                <span className="mono" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '-.02em', lineHeight: 1.05 }}>{l.stat}</span>
                <span className="faint" style={{ fontSize: 'var(--fs-2xs)' }}>{l.statLabel}</span>
              </div>
              <div className="col" style={{ gap: 8, minWidth: 0 }}>
                <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, letterSpacing: '-.01em' }}><span className="faint mono" style={{ fontSize: 'var(--fs-sm)', marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>{l.title}</h3>
                <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{l.lesson}</p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                  <span className="eyebrow">e.g.</span>
                  {l.examples.map((s) => <a key={s} href={`/${s}`} className="badge badge--batch mono" style={{ textDecoration: 'none' }}>{s}</a>)}
                </div>
                <p className="faint" style={{ fontSize: 'var(--fs-2xs)', lineHeight: 1.5, marginTop: 2 }}>⚠ {l.caveat}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.6, margin: '20px 0 0', maxWidth: 760 }}>
          Every figure recomputes from the live dataset. Stars, launch events, issue/PR activity and the cross-star network are all derived from public GitHub history, the HN/Product Hunt/YC-Launch records, and GH Archive. See <a href="/methodology" style={{ color: 'var(--accent-text)' }}>Methodology</a> for limits — especially survivorship bias, which hides every team that did these things and still didn't make it.
        </p>
      </main>
      <Footer />
    </>
  );
}

/* Methodology — honest method, limitations, cautions. Prose is translated in i18n/methodology-content.ts. */
import React, { useEffect } from 'react';
import { Store, useStore, TopNav, Footer, Section } from './kit.jsx';
import { MD } from '../i18n/methodology-content.ts';

/* inline markup → React nodes: **bold**, [text](url), `mono` */
function rich(s) {
  if (!s) return null;
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|`(.+?)`/g;
  const out = []; let last = 0, m, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1] != null) out.push(<b key={k++} style={{ color: 'var(--text)' }}>{m[1]}</b>);
    else if (m[2] != null) out.push(<a key={k++} href={m[3]} target={m[3].startsWith('/') ? undefined : '_blank'} rel="noreferrer" style={{ color: 'var(--accent-text)' }}>{m[2]}</a>);
    else if (m[4] != null) out.push(<span key={k++} className="mono">{m[4]}</span>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const Def = ({ k, v }) => (
  <div style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
    <div className="mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
    <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.55, margin: 0 }}>{rich(v)}</p>
  </div>
);

export default function MethodologyPage({ initialLocale }) {
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  const { locale } = useStore();
  const t = MD[locale] && MD[locale].h1 ? MD[locale] : MD.en;
  return (
    <>
      <TopNav active="methodology" />
      <main className="wrap" style={{ padding: '26px 20px 0', maxWidth: 900 }}>
        <div style={{ marginBottom: 22 }}>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.1, margin: '8px 0 10px' }}>{t.h1}</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>{rich(t.intro)}</p>
        </div>

        <Section title={t.defsTitle} sub={t.defsSub} style={{ marginBottom: 16 }}>
          {t.defs.map(([k, v]) => <Def key={k} k={k} v={v} />)}
        </Section>

        <Section title={t.limitsTitle} sub={t.limitsSub} style={{ marginBottom: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {t.limits.map((l, i) => <li key={i} className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, marginBottom: 8 }}>{rich(l)}</li>)}
          </ul>
        </Section>

        <Section title={t.starTitle} sub={t.starSub} style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{rich(t.starBody)}</p>
        </Section>

        <Section title={t.sourcesTitle} sub={t.sourcesSub} style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{rich(t.sourcesBody)}</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

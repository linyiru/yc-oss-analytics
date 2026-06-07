/* Home / Directory island — hero scatter + filterable/sortable table.
   Shared shell + charts come from kit.jsx. */
import React, { useState, useMemo, useEffect } from 'react';
import {
  Store, useStore, TopNav, Footer, Section, StatCard, TypeBadge, BatchBadge, LivenessMeter,
  Scatter, IconSearch, IconChevron, LANG, langColor, typeColor, fmtCompact, fmtInt,
} from './kit.jsx';

function SelectChip({ value, onChange, label, options }) {
  return (
    <label className={'chip selectchip' + (value !== 'All' ? ' is-active' : '')} style={{ position: 'relative' }}>
      <span className="faint" style={{ fontSize: 10.5 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value === 'All' ? 'All' : value}</span>
      <IconChevron size={12} />
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default function Directory({ companies = [], initialLocale }) {
  const { intl, T } = useStore();
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  const all = companies;
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [batch, setBatch] = useState('All');
  const [lang, setLang] = useState('All');
  const [sort, setSort] = useState({ key: 'stars', dir: -1 });
  const [quad, setQuad] = useState(true);

  const batches = useMemo(() => [...new Set(all.map((c) => c.batch))].sort((a, b) => (parseInt(a.slice(1)) - parseInt(b.slice(1))) || a.localeCompare(b)), [all]);
  const langs = useMemo(() => { const m = {}; all.forEach((c) => (m[c.lang] = (m[c.lang] || 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([l]) => l); }, [all]);
  const typeCounts = useMemo(() => { const m = { Evergreen: 0, Rising: 0, Steady: 0, Dormant: 0 }; all.forEach((c) => (m[c.type] !== undefined && m[c.type]++)); return m; }, [all]);
  const medianLive = useMemo(() => { const v = all.map((c) => c.liveness).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] || 0; }, [all]);
  const totalStars = useMemo(() => all.reduce((s, c) => s + c.stars, 0), [all]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return all.filter((c) => (type === 'All' || c.type === type) && (batch === 'All' || c.batch === batch) && (lang === 'All' || c.lang === lang) &&
      (!ql || c.name.toLowerCase().includes(ql) || (c.org || '').toLowerCase().includes(ql) || (c.oneLiner || '').toLowerCase().includes(ql)));
  }, [all, q, type, batch, lang]);
  const sorted = useMemo(() => { const s = [...filtered]; s.sort((a, b) => { let av = a[sort.key], bv = b[sort.key]; if (typeof av === 'string') return av.localeCompare(bv) * sort.dir; return ((av || 0) - (bv || 0)) * sort.dir; }); return s; }, [filtered, sort]);
  const scatterData = useMemo(() => filtered.filter((c) => c.yrs != null), [filtered]);

  const go = (c) => { window.location.href = '/' + c.id; };
  const th = (key, label, align) => { const on = sort.key === key; return <th className={'sortable ' + (align === 'r' ? 'num' : '')} onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : (key === 'name' ? 1 : -1) }))}>{label}{on && <span className="arr">{sort.dir === -1 ? '↓' : '↑'}</span>}</th>; };
  const TYPES = ['All', 'Evergreen', 'Rising', 'Steady', 'Dormant'];

  return (
    <>
      <TopNav active="directory" count={all.length} />
      <main className="wrap" style={{ padding: '26px 20px 0' }}>
        <div className="row spread" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ maxWidth: 620 }}>
            <span className="eyebrow">YC Open-Source Analytics</span>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.08, margin: '8px 0 10px', textWrap: 'balance' }}>How {all.length} YC open-source teams<br />actually build, decoded from git.</h1>
            <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55, maxWidth: 560 }}>Reverse-engineered from public commit history & GitHub metadata — including <span style={{ color: 'var(--text)' }}>how each project's stars actually grew</span>.</p>
          </div>
          <div className="kpi-strip">
            <StatCard label="Repos tracked" value={fmtInt(all.length, intl)} accent="var(--accent)" />
            <StatCard label="Evergreen" value={typeCounts.Evergreen + ''} sub={`${Math.round((typeCounts.Evergreen / all.length) * 100)}% still alive`} accent="var(--evergreen)" />
            <StatCard label="Median liveness" value={medianLive + ''} sub="across cohort" accent="var(--steady)" />
            <StatCard label="Total stars" value={fmtCompact(totalStars, intl)} sub="aggregate" accent="var(--rising)" />
          </div>
        </div>

        <Section title="The landscape" sub="Years since YC batch × current liveness · bubble = stars · color = type"
          right={
            <div className="row gap-3" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div className="row gap-3 legend">
                {['Evergreen', 'Rising', 'Steady', 'Dormant'].map((tp) => <span key={tp} className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}><i style={{ width: 9, height: 9, borderRadius: 9, background: typeColor(tp) }}></i>{T(tp)}</span>)}
              </div>
              <button className={'chip' + (quad ? ' is-active' : '')} onClick={() => setQuad((v) => !v)}>Quadrants</button>
            </div>
          }>
          <Scatter data={scatterData} onPick={go} quadrants={quad} height={440} />
        </Section>

        <div className="row spread" style={{ gap: 12, flexWrap: 'wrap', margin: '22px 0 12px' }}>
          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="searchbox row gap-2"><IconSearch size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T('search')} aria-label="Search" /></div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {TYPES.map((tp) => (
                <button key={tp} className={'chip' + (type === tp ? ' is-active' : '')} onClick={() => setType(tp)}>
                  {tp !== 'All' && <i style={{ width: 7, height: 7, borderRadius: 7, background: typeColor(tp) }}></i>}{tp === 'All' ? 'All' : T(tp)}<span className="mono faint" style={{ fontSize: 10 }}>{tp === 'All' ? all.length : typeCounts[tp]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="row gap-2">
            <SelectChip value={batch} onChange={setBatch} label="Batch" options={['All', ...batches]} />
            <SelectChip value={lang} onChange={setLang} label="Lang" options={['All', ...langs]} />
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="row spread" style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
            <span className="faint mono" style={{ fontSize: 'var(--fs-xs)' }}>{fmtInt(sorted.length, intl)} / {all.length} repos</span>
            <span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>Click a row → repo detail</span>
          </div>
          <div style={{ maxHeight: 660, overflow: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th style={{ width: 30, textAlign: 'right', color: 'var(--text-faint)' }}>#</th>
                {th('name', 'Repository')}{th('batch', 'Batch')}{th('lang', 'Lang')}{th('stars', T('stars'), 'r')}{th('commitsPerWeek', T('commitsWk'), 'r')}{th('aiAssisted', 'AI %', 'r')}{th('liveness', T('liveness'), 'r')}{th('type', T('type'))}
              </tr></thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.id} onClick={() => go(c)}>
                    <td className="num mono faint" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td><div className="col" style={{ gap: 1, minWidth: 0 }}>
                      <span className="row gap-2" style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{c.name}</b><span className="faint mono truncate" style={{ fontSize: 11 }}>{c.org}/</span></span>
                      <span className="faint truncate" style={{ fontSize: 'var(--fs-xs)', maxWidth: 380 }}>{c.oneLiner}</span>
                    </div></td>
                    <td><BatchBadge batch={c.batch} /></td>
                    <td><span className="row gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}><i style={{ width: 8, height: 8, borderRadius: 8, background: langColor(c.lang) }}></i>{c.lang}</span></td>
                    <td className="num mono tabular" style={{ fontWeight: 600 }}>{fmtCompact(c.stars, intl)}</td>
                    <td className="num mono tabular muted">{c.commitsPerWeek}</td>
                    <td className="num mono tabular" style={{ color: c.aiAssisted >= 40 ? 'var(--accent-text)' : 'var(--text-3)' }}>{c.aiAssisted}%</td>
                    <td><LivenessMeter value={c.liveness} /></td>
                    <td><TypeBadge type={c.type} /></td>
                  </tr>
                ))}
                {sorted.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>No repositories match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

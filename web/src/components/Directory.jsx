/* Home / Directory — ported from the Claude Design handoff (oss/signal).
   Self-contained React island; fed our real repo data via the `companies` prop.
   Dark-first design system in ds.css / app.css. */
import React, { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';

/* ---------- helpers ---------- */
const LANG = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Ruby: '#701516', Elixir: '#6e4a7e', Kotlin: '#A97BFF', Java: '#b07219',
  'C++': '#f34b7d', Zig: '#ec915c', Dart: '#00B4AB', PHP: '#4F5D95', 'C#': '#178600',
  Swift: '#F05138', Vue: '#41b883', Svelte: '#ff3e00', HCL: '#844FBA', Shell: '#89e051',
  Lua: '#000080', 'Jupyter Notebook': '#DA5B0B', MDX: '#fcb32c', C: '#555555',
};
const typeKey = (t) => (t || 'steady').toLowerCase();
const typeColor = (t) => `var(--${typeKey(t)})`;
const fmtCompact = (n, intl) => new Intl.NumberFormat(intl, { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const fmtInt = (n, intl) => new Intl.NumberFormat(intl).format(n || 0);

/* ---------- i18n + theme store ---------- */
const LOCALES = [
  { code: 'en', label: 'English', intl: 'en-US' },
  { code: 'zh-Hant', label: '繁體中文', intl: 'zh-Hant' },
  { code: 'zh-Hans', label: '简体中文', intl: 'zh-Hans' },
  { code: 'ja', label: '日本語', intl: 'ja-JP' },
  { code: 'ko', label: '한국어', intl: 'ko-KR' },
  { code: 'pt', label: 'Português', intl: 'pt-BR' },
];
const STR = {
  directory: { en: 'Directory', 'zh-Hant': '目錄', 'zh-Hans': '目录', ja: 'ディレクトリ', ko: '디렉터리', pt: 'Diretório' },
  trends: { en: 'Trends', 'zh-Hant': '趨勢', 'zh-Hans': '趋势', ja: 'トレンド', ko: '트렌드', pt: 'Tendências' },
  methodology: { en: 'Methodology', 'zh-Hant': '方法論', 'zh-Hans': '方法论', ja: '方法論', ko: '방법론', pt: 'Metodologia' },
  search: { en: 'Search repos…', 'zh-Hant': '搜尋儲存庫…', 'zh-Hans': '搜索仓库…', ja: 'リポジトリを検索…', ko: '저장소 검색…', pt: 'Buscar repositórios…' },
  liveness: { en: 'Liveness', 'zh-Hant': '活躍度', 'zh-Hans': '活跃度', ja: 'ライブネス', ko: '활성도', pt: 'Vivacidade' },
  stars: { en: 'Stars', 'zh-Hant': '星標', 'zh-Hans': '星标', ja: 'スター', ko: '스타', pt: 'Estrelas' },
  commitsWk: { en: 'Commits / wk', 'zh-Hant': '提交 / 週', 'zh-Hans': '提交 / 周', ja: 'コミット/週', ko: '커밋/주', pt: 'Commits / sem' },
  type: { en: 'Type', 'zh-Hant': '類型', 'zh-Hans': '类型', ja: 'タイプ', ko: '유형', pt: 'Tipo' },
  Evergreen: { en: 'Evergreen', 'zh-Hant': '常青', 'zh-Hans': '常青', ja: '常緑', ko: '에버그린', pt: 'Perene' },
  Rising: { en: 'Rising', 'zh-Hant': '崛起', 'zh-Hans': '崛起', ja: '上昇', ko: '상승', pt: 'Em alta' },
  Steady: { en: 'Steady', 'zh-Hant': '穩定', 'zh-Hans': '稳定', ja: '安定', ko: '안정', pt: 'Estável' },
  Dormant: { en: 'Dormant', 'zh-Hant': '休眠', 'zh-Hans': '休眠', ja: '休眠', ko: '휴면', pt: 'Dormente' },
};
const tr = (key, locale) => { const e = STR[key]; return (e && (e[locale] || e.en)) || key; };

const Store = (() => {
  let state = { theme: 'dark', locale: 'en' };
  if (typeof localStorage !== 'undefined') {
    state = { theme: localStorage.getItem('ycoss-theme') || 'dark', locale: localStorage.getItem('ycoss-locale') || 'en' };
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  const subs = new Set();
  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...patch };
      if (patch.theme) { localStorage.setItem('ycoss-theme', patch.theme); document.documentElement.setAttribute('data-theme', patch.theme); }
      if (patch.locale) localStorage.setItem('ycoss-locale', patch.locale);
      subs.forEach((f) => f());
    },
    sub: (f) => { subs.add(f); return () => subs.delete(f); },
  };
})();
function useStore() {
  const s = useSyncExternalStore(Store.sub, Store.get, () => ({ theme: 'dark', locale: 'en' }));
  const loc = LOCALES.find((l) => l.code === s.locale) || LOCALES[0];
  return { ...s, intl: loc.intl, T: (k) => tr(k, s.locale), setLocale: (locale) => Store.set({ locale }), toggleTheme: () => Store.set({ theme: s.theme === 'dark' ? 'light' : 'dark' }) };
}

/* ---------- icons ---------- */
const Icon = ({ d, size = 15, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: '0 0 auto' }}>{d}</svg>
);
const IconSearch = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />;
const IconSun = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>} />;
const IconMoon = (p) => <Icon {...p} d={<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />} />;
const IconChevron = (p) => <Icon {...p} d={<path d="m6 9 6 6 6-6" />} />;
const IconGlobe = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>} />;
const IconGit = (p) => <Icon {...p} d={<><circle cx="12" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="14" r="2.4" /><path d="M18 11.6V11a4 4 0 0 0-4-4H9M6 8.4v7.2" /></>} />;

/* ---------- shell ---------- */
function Logo() {
  return (
    <a href="/" className="row gap-3" style={{ textDecoration: 'none' }}>
      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        <span className="mono" style={{ color: 'var(--on-accent)', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>~</span>
      </span>
      <span className="row" style={{ gap: 0, fontWeight: 600, letterSpacing: '-.02em', fontSize: 'var(--fs-md)' }}>oss<span style={{ color: 'var(--text-3)' }}>/</span>signal</span>
    </a>
  );
}
function LangSwitcher() {
  const { locale, setLocale } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const cur = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn--ghost" onClick={() => setOpen((o) => !o)} style={{ paddingLeft: 9, paddingRight: 7 }}>
        <IconGlobe /><span>{cur.label}</span><IconChevron size={13} />
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 168, padding: 5, boxShadow: 'var(--shadow-pop)', background: 'var(--surface-2)', zIndex: 40 }}>
          {LOCALES.map((l) => (
            <button key={l.code} onClick={() => { setLocale(l.code); setOpen(false); }} className="row spread"
              style={{ width: '100%', padding: '7px 9px', borderRadius: 6, color: l.code === locale ? 'var(--text)' : 'var(--text-2)', background: l.code === locale ? 'var(--hover)' : 'transparent', fontSize: 'var(--fs-sm)' }}>
              <span>{l.label}</span><span className="mono faint" style={{ fontSize: 10 }}>{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  return <button className="btn btn--ghost btn--icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">{theme === 'dark' ? <IconSun /> : <IconMoon />}</button>;
}
function TopNav({ count }) {
  const { T } = useStore();
  const links = [['/', T('directory'), true], ['/trends', T('trends'), false], ['/methodology', T('methodology'), false]];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'color-mix(in oklab, var(--bg) 86%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
      <div className="wrap row spread" style={{ height: 'var(--nav-h)', gap: 'var(--sp-5)' }}>
        <div className="row gap-6" style={{ minWidth: 0 }}>
          <Logo />
          <nav className="row gap-1 nav-links">
            {links.map(([href, label, on]) => (
              <a key={href} href={href} className="row" style={{ height: 30, padding: '0 10px', borderRadius: 6, fontSize: 'var(--fs-sm)', fontWeight: 500, color: on ? 'var(--text)' : 'var(--text-3)', background: on ? 'var(--hover)' : 'transparent' }}>{label}</a>
            ))}
          </nav>
        </div>
        <div className="row gap-2">
          <span className="badge mono" style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}><i className="dot" style={{ background: 'var(--evergreen)' }}></i>{count} repos · live</span>
          <LangSwitcher /><ThemeToggle />
          <a className="btn btn--icon" href="https://github.com/yc-oss" aria-label="GitHub"><IconGit /></a>
        </div>
      </div>
    </header>
  );
}
function TypeBadge({ type }) { const { T } = useStore(); return <span className={`badge badge--${typeKey(type)}`}><i className="dot"></i>{T(type)}</span>; }
function BatchBadge({ batch }) { return <span className="badge badge--batch mono">{batch}</span>; }
function LivenessMeter({ value }) {
  const color = value >= 70 ? 'var(--evergreen)' : value >= 40 ? 'var(--steady)' : value >= 25 ? 'var(--rising)' : 'var(--dormant)';
  return (
    <span className="row gap-2" style={{ justifyContent: 'flex-end' }}>
      <b className="mono tabular" style={{ fontWeight: 600, width: 24, textAlign: 'right' }}>{value}</b>
      <span className="meter" style={{ width: 64 }}><i style={{ width: `${value}%`, background: color }}></i></span>
    </span>
  );
}
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
      {accent && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }}></span>}
      <span className="eyebrow">{label}</span>
      <span className="stat-value" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</span>
      {sub && <span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>{sub}</span>}
    </div>
  );
}
function Section({ title, sub, right, children }) {
  return (
    <section className="card" style={{ overflow: 'hidden' }}>
      <div className="row spread" style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', gap: 12 }}>
        <div className="col" style={{ gap: 1 }}>
          <h3 className="section-title">{title}</h3>
          {sub && <span className="section-sub">{sub}</span>}
        </div>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--sp-12)', padding: '28px 0 48px' }}>
      <div className="wrap row spread" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div className="col gap-2" style={{ maxWidth: 380 }}>
          <Logo />
          <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.6 }}>Independent analytics derived from public git history & GitHub metadata of ~158 Y Combinator open-source companies. Not affiliated with Y Combinator.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- scatter (SVG, ported) ---------- */
function useMeasure() {
  const ref = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => { for (const e of es) setW(e.contentRect.width); });
    ro.observe(ref.current); setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
function Scatter({ data, height = 440, onPick, quadrants }) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState(null);
  const [tip, setTip] = useState(null);
  const m = { t: 18, r: 22, b: 42, l: 46 };
  const W = Math.max(320, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const maxYrs = Math.ceil(Math.max(1, ...data.map((d) => d.yrs)) + 0.5);
  const sx = lin(maxYrs, 0, m.l, m.l + iw);
  const sy = lin(0, 100, m.t + ih, m.t);
  const maxStars = Math.max(1, ...data.map((d) => d.stars));
  const sr = (s) => 4 + Math.sqrt(s / maxStars) * 26;
  const yticks = [0, 25, 50, 75, 100];
  const xticks = []; for (let y = 0; y <= maxYrs; y++) xticks.push(y);
  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={() => { setHover(null); setTip(null); }}>
        {quadrants && (
          <g>
            <rect x={m.l} y={m.t} width={iw / 2} height={ih / 2} style={{ fill: 'var(--evergreen)', opacity: 0.05 }} />
            <text x={m.l + 10} y={m.t + 18} className="mono" style={{ fill: 'var(--evergreen)', fontSize: 10.5, opacity: 0.85 }}>EVERGREEN ↖ old · still alive</text>
            <text x={m.l + iw - 10} y={m.t + 18} textAnchor="end" className="mono" style={{ fill: 'var(--rising)', fontSize: 10.5, opacity: 0.85 }}>RISING ↗ new · hot</text>
            <text x={m.l + 10} y={m.t + ih - 8} className="mono" style={{ fill: 'var(--dormant)', fontSize: 10.5, opacity: 0.7 }}>DORMANT ↙ faded</text>
          </g>
        )}
        {yticks.map((tk) => (
          <g key={'y' + tk}>
            <line x1={m.l} x2={m.l + iw} y1={sy(tk)} y2={sy(tk)} style={{ stroke: 'var(--grid)' }} />
            <text x={m.l - 9} y={sy(tk) + 3.5} textAnchor="end" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{tk}</text>
          </g>
        ))}
        {xticks.map((tk) => <text key={'x' + tk} x={sx(tk)} y={m.t + ih + 18} textAnchor="middle" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{tk}{tk === maxYrs ? 'y' : ''}</text>)}
        <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} style={{ stroke: 'var(--axis)' }} />
        <text x={m.l + iw / 2} y={H - 4} textAnchor="middle" className="mono" style={{ fill: 'var(--text-3)', fontSize: 10 }}>← older cohort    years since YC batch    newer →</text>
        {data.map((d) => {
          const cx = sx(d.yrs), cy = sy(d.liveness), r = sr(d.stars), on = hover === d.id;
          return (
            <circle key={d.id} cx={cx} cy={cy} r={r}
              style={{ fill: typeColor(d.type), fillOpacity: on ? 0.95 : 0.5, color: typeColor(d.type), stroke: typeColor(d.type), strokeWidth: on ? 1.6 : 1, cursor: 'pointer', filter: on ? 'drop-shadow(0 0 6px currentColor)' : 'none', transition: 'fill-opacity .12s' }}
              onMouseEnter={(e) => { setHover(d.id); setTip({ d, x: e.clientX, y: e.clientY }); }}
              onMouseMove={(e) => setTip({ d, x: e.clientX, y: e.clientY })}
              onClick={() => onPick && onPick(d)} />
          );
        })}
      </svg>
      {tip && (
        <div className="viz-tip show" style={{ left: Math.min(tip.x + 16, W - 150), top: Math.max(8, tip.y - 80), position: 'fixed' }}>
          <div className="t-title"><span style={{ width: 8, height: 8, borderRadius: 2, background: typeColor(tip.d.type), display: 'inline-block' }}></span>{tip.d.name}</div>
          <div className="t-row"><span>{tip.d.type} · {tip.d.batch}</span></div>
          <div className="t-row"><span>Liveness</span><b>{tip.d.liveness}</b></div>
          <div className="t-row"><span>Stars</span><b>{fmtCompact(tip.d.stars, 'en-US')}</b></div>
        </div>
      )}
    </div>
  );
}

/* ---------- main ---------- */
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

export default function Directory({ companies = [] }) {
  const { intl, T } = useStore();
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
    return all.filter((c) =>
      (type === 'All' || c.type === type) && (batch === 'All' || c.batch === batch) && (lang === 'All' || c.lang === lang) &&
      (!ql || c.name.toLowerCase().includes(ql) || (c.org || '').toLowerCase().includes(ql) || (c.oneLiner || '').toLowerCase().includes(ql)));
  }, [all, q, type, batch, lang]);
  const sorted = useMemo(() => {
    const s = [...filtered];
    s.sort((a, b) => { let av = a[sort.key], bv = b[sort.key]; if (typeof av === 'string') return av.localeCompare(bv) * sort.dir; return ((av || 0) - (bv || 0)) * sort.dir; });
    return s;
  }, [filtered, sort]);
  const scatterData = useMemo(() => filtered.filter((c) => c.yrs != null), [filtered]);

  const go = (c) => { window.location.href = '/' + c.id; };
  const th = (key, label, align) => {
    const on = sort.key === key;
    return <th className={'sortable ' + (align === 'r' ? 'num' : '')} onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : (key === 'name' ? 1 : -1) }))}>{label}{on && <span className="arr">{sort.dir === -1 ? '↓' : '↑'}</span>}</th>;
  };
  const TYPES = ['All', 'Evergreen', 'Rising', 'Steady', 'Dormant'];

  return (
    <>
      <TopNav count={all.length} />
      <main className="wrap" style={{ padding: '26px 20px 0' }}>
        <div className="row spread" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ maxWidth: 620 }}>
            <span className="eyebrow">YC Open-Source Analytics</span>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.08, margin: '8px 0 10px', textWrap: 'balance' }}>How {all.length} YC open-source teams<br />actually build, decoded from git.</h1>
            <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55, maxWidth: 560 }}>Reverse-engineered from public commit history & GitHub metadata. Every number is derived from the source — including <span style={{ color: 'var(--text)' }}>real vs. inflated traction</span>.</p>
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
                {['Evergreen', 'Rising', 'Steady', 'Dormant'].map((tp) => (
                  <span key={tp} className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}><i style={{ width: 9, height: 9, borderRadius: 9, background: typeColor(tp) }}></i>{T(tp)}</span>
                ))}
              </div>
              <button className={'chip' + (quad ? ' is-active' : '')} onClick={() => setQuad((v) => !v)}>Quadrants</button>
            </div>
          }>
          <Scatter data={scatterData} onPick={go} quadrants={quad} height={440} />
        </Section>

        <div className="row spread" style={{ gap: 12, flexWrap: 'wrap', margin: '22px 0 12px' }}>
          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="searchbox row gap-2">
              <IconSearch size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T('search')} aria-label="Search" />
            </div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {TYPES.map((tp) => (
                <button key={tp} className={'chip' + (type === tp ? ' is-active' : '')} onClick={() => setType(tp)}>
                  {tp !== 'All' && <i style={{ width: 7, height: 7, borderRadius: 7, background: typeColor(tp) }}></i>}
                  {tp === 'All' ? 'All' : T(tp)}
                  <span className="mono faint" style={{ fontSize: 10 }}>{tp === 'All' ? all.length : typeCounts[tp]}</span>
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
              <thead>
                <tr>
                  <th style={{ width: 30, textAlign: 'right', color: 'var(--text-faint)' }}>#</th>
                  {th('name', 'Repository')}{th('batch', 'Batch')}{th('lang', 'Lang')}
                  {th('stars', T('stars'), 'r')}{th('commitsPerWeek', T('commitsWk'), 'r')}
                  {th('aiAssisted', 'AI %', 'r')}{th('liveness', T('liveness'), 'r')}{th('type', T('type'))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.id} onClick={() => go(c)}>
                    <td className="num mono faint" style={{ fontSize: 11 }}>{i + 1}</td>
                    <td>
                      <div className="col" style={{ gap: 1, minWidth: 0 }}>
                        <span className="row gap-2" style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{c.name}</b><span className="faint mono truncate" style={{ fontSize: 11 }}>{c.org}/</span></span>
                        <span className="faint truncate" style={{ fontSize: 'var(--fs-xs)', maxWidth: 380 }}>{c.oneLiner}</span>
                      </div>
                    </td>
                    <td><BatchBadge batch={c.batch} /></td>
                    <td><span className="row gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}><i style={{ width: 8, height: 8, borderRadius: 8, background: LANG[c.lang] || '#7d8794' }}></i>{c.lang}</span></td>
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

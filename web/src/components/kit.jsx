/* Shared UI kit + hand-built SVG charts for the oss/signal design system.
   Ported from the Claude Design handoff; used by Directory + RepoPage islands. */
import React, { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';

/* ---------- helpers ---------- */
export const LANG = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Ruby: '#701516', Elixir: '#6e4a7e', Kotlin: '#A97BFF', Java: '#b07219',
  'C++': '#f34b7d', Zig: '#ec915c', Dart: '#00B4AB', PHP: '#4F5D95', 'C#': '#178600',
  Swift: '#F05138', Vue: '#41b883', Svelte: '#ff3e00', HCL: '#844FBA', Shell: '#89e051',
  Lua: '#000080', 'Jupyter Notebook': '#DA5B0B', MDX: '#fcb32c', C: '#555555', HTML: '#e34c26', CSS: '#563d7c',
};
export const langColor = (l) => LANG[l] || '#7d8794';
export const typeKey = (t) => (t || 'steady').toLowerCase();
export const typeColor = (t) => `var(--${typeKey(t)})`;
export const fmtCompact = (n, intl = 'en-US') => new Intl.NumberFormat(intl, { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
export const fmtInt = (n, intl = 'en-US') => new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }).format(n || 0);
export const fmtMonth = (ym, intl = 'en-US') => {
  if (!ym) return '';
  const [y, mo] = String(ym).split('-').map(Number);
  try { return new Intl.DateTimeFormat(intl, { month: 'short', year: '2-digit' }).format(new Date(y, (mo || 1) - 1, 1)); }
  catch { return ym; }
};

/* ---------- i18n + theme store ---------- */
export const LOCALES = [
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
  // company outcome (YC ycdc_status)
  Active: { en: 'Active', 'zh-Hant': '營運中', 'zh-Hans': '运营中', ja: '運営中', ko: '운영 중', pt: 'Ativa' },
  Acquired: { en: 'Acquired', 'zh-Hant': '已被收購', 'zh-Hans': '已被收购', ja: '買収済み', ko: '인수됨', pt: 'Adquirida' },
  Public: { en: 'Public', 'zh-Hant': '已上市', 'zh-Hans': '已上市', ja: '上場済み', ko: '상장됨', pt: 'Aberta' },
  Inactive: { en: 'Inactive', 'zh-Hant': '已停業', 'zh-Hans': '已停业', ja: '休止中', ko: '비활성', pt: 'Inativa' },
  // repo-page metadata
  founded: { en: 'Founded', 'zh-Hant': '成立', 'zh-Hans': '成立', ja: '設立', ko: '설립', pt: 'Fundada' },
  teamLbl: { en: 'team', 'zh-Hant': '團隊', 'zh-Hans': '团队', ja: 'チーム', ko: '팀', pt: 'equipe' },
  ycPartner: { en: 'YC partner', 'zh-Hant': 'YC 合夥人', 'zh-Hans': 'YC 合伙人', ja: 'YC パートナー', ko: 'YC 파트너', pt: 'sócio YC' },
  rebranded: { en: 'YC company listed as {n} (rebranded)', 'zh-Hant': 'YC 登記名稱為 {n}(已改名)', 'zh-Hans': 'YC 登记名称为 {n}(已改名)', ja: 'YC 登録名は {n}(リブランド済み)', ko: 'YC 등록명은 {n} (리브랜딩됨)', pt: 'Empresa YC registrada como {n} (rebatizada)' },
  // trends — company outcomes
  outcomesTitle: { en: 'Company outcomes', 'zh-Hant': '公司結局', 'zh-Hans': '公司结局', ja: '企業の行く末', ko: '회사의 결말', pt: 'Desfechos das empresas' },
  outcomesSub: { en: "Survivorship made visible — YC's own status for {a} companies. {b} are no longer independently active.", 'zh-Hant': '讓倖存者偏誤現形——YC 自己對 {a} 家公司的狀態。其中 {b} 家已不再獨立營運。', 'zh-Hans': '让幸存者偏差现形——YC 自己对 {a} 家公司的状态。其中 {b} 家已不再独立运营。', ja: '生存者バイアスを可視化——{a} 社に対する YC 自身のステータス。うち {b} 社はすでに独立して運営していません。', ko: '생존 편향을 가시화 — {a}개 회사에 대한 YC 자체 상태. 그중 {b}개는 더 이상 독립적으로 운영되지 않습니다.', pt: 'Viés de sobrevivência à vista — o status da própria YC para {a} empresas. {b} já não operam de forma independente.' },
  outcomesNote: { en: 'Our analysis still over-represents the living — dead-and-delisted companies fall out of YC\'s directory entirely — but this is the part of survivorship we can see: {p}% have already been acquired, gone public, or gone inactive.', 'zh-Hant': '我們的分析仍偏向倖存者——死掉並下架的公司會完全從 YC 目錄消失——但這是我們看得見的那部分倖存:{p}% 已被收購、上市或停業。', 'zh-Hans': '我们的分析仍偏向幸存者——死掉并下架的公司会完全从 YC 目录消失——但这是我们看得见的那部分幸存:{p}% 已被收购、上市或停业。', ja: '私たちの分析は今も「生きている側」に偏っています——倒れて掲載が消えた企業は YC のディレクトリから完全に外れます——が、これは見える範囲の生存者の姿です:{p}% はすでに買収・上場、または活動停止しています。', ko: '우리 분석은 여전히 살아있는 쪽에 치우쳐 있습니다 — 죽어 사라진 회사는 YC 디렉터리에서 완전히 빠집니다 — 하지만 이것이 우리가 볼 수 있는 생존의 단면입니다: {p}%가 이미 인수·상장되었거나 비활성 상태입니다.', pt: 'Nossa análise ainda super-representa os vivos — empresas mortas e removidas somem do diretório da YC — mas esta é a parte da sobrevivência que dá para ver: {p}% já foram adquiridas, abriram capital ou ficaram inativas.' },
};
const trf = (key, locale) => { const e = STR[key]; return (e && (e[locale] || e.en)) || key; };
export const Store = (() => {
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
export function useStore() {
  const s = useSyncExternalStore(Store.sub, Store.get, () => ({ theme: 'dark', locale: 'en' }));
  const loc = LOCALES.find((l) => l.code === s.locale) || LOCALES[0];
  return { ...s, intl: loc.intl, T: (k) => trf(k, s.locale), setLocale: (locale) => Store.set({ locale }), toggleTheme: () => Store.set({ theme: s.theme === 'dark' ? 'light' : 'dark' }) };
}

/* ---------- icons ---------- */
const Icon = ({ d, size = 15, fill, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: '0 0 auto', ...style }}>{d}</svg>
);
export const IconSearch = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />;
export const IconSun = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>} />;
export const IconMoon = (p) => <Icon {...p} d={<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />} />;
export const IconChevron = (p) => <Icon {...p} d={<path d="m6 9 6 6 6-6" />} />;
export const IconGlobe = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>} />;
export const IconGit = (p) => <Icon {...p} d={<><circle cx="12" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="14" r="2.4" /><path d="M18 11.6V11a4 4 0 0 0-4-4H9M6 8.4v7.2" /></>} />;
export const IconStar = (p) => <Icon {...p} d={<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9Z" />} />;
export const IconExt = (p) => <Icon {...p} size={13} d={<><path d="M7 17 17 7M9 7h8v8" /></>} />;
export const IconX = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block', flex: '0 0 auto' }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* ---------- shell ---------- */
export function Logo() {
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
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const cur = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn--ghost" onClick={() => setOpen((o) => !o)} style={{ paddingLeft: 9, paddingRight: 7 }}><IconGlobe /><span>{cur.label}</span><IconChevron size={13} /></button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 168, padding: 5, boxShadow: 'var(--shadow-pop)', background: 'var(--surface-2)', zIndex: 40 }}>
          {LOCALES.map((l) => (
            <button key={l.code} onClick={() => { setLocale(l.code); setOpen(false); }} className="row spread" style={{ width: '100%', padding: '7px 9px', borderRadius: 6, color: l.code === locale ? 'var(--text)' : 'var(--text-2)', background: l.code === locale ? 'var(--hover)' : 'transparent', fontSize: 'var(--fs-sm)' }}>
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
export function TopNav({ active = 'directory', count = 158 }) {
  const { T } = useStore();
  const links = [['/', T('directory'), 'directory'], ['/trends', T('trends'), 'trends'], ['/signals', 'Signals', 'signals'], ['/methodology', T('methodology'), 'methodology']];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'color-mix(in oklab, var(--bg) 86%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
      <div className="wrap row spread" style={{ height: 'var(--nav-h)', gap: 'var(--sp-5)' }}>
        <div className="row gap-6" style={{ minWidth: 0 }}>
          <Logo />
          <nav className="row gap-1 nav-links">
            {links.map(([href, label, key]) => { const on = active === key; return <a key={href} href={href} className="row" style={{ height: 30, padding: '0 10px', borderRadius: 6, fontSize: 'var(--fs-sm)', fontWeight: 500, color: on ? 'var(--text)' : 'var(--text-3)', background: on ? 'var(--hover)' : 'transparent' }}>{label}</a>; })}
          </nav>
        </div>
        <div className="row gap-2">
          <span className="badge mono" style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}><i className="dot" style={{ background: 'var(--evergreen)' }}></i>{count} repos · live</span>
          <LangSwitcher /><ThemeToggle />
        </div>
      </div>
    </header>
  );
}
export function TypeBadge({ type }) { const { T } = useStore(); return <span className={`badge badge--${typeKey(type)}`}><i className="dot"></i>{T(type)}</span>; }
export function BatchBadge({ batch }) { return <span className="badge badge--batch mono">{batch}</span>; }
export function LangBadge({ lang }) { return <span className="badge badge--lang"><i className="lang-dot" style={{ background: langColor(lang) }}></i>{lang}</span>; }
export function LivenessMeter({ value }) {
  const color = value >= 70 ? 'var(--evergreen)' : value >= 40 ? 'var(--steady)' : value >= 25 ? 'var(--rising)' : 'var(--dormant)';
  return <span className="row gap-2" style={{ justifyContent: 'flex-end' }}><b className="mono tabular" style={{ fontWeight: 600, width: 24, textAlign: 'right' }}>{value}</b><span className="meter" style={{ width: 64 }}><i style={{ width: `${value}%`, background: color }}></i></span></span>;
}
export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
      {accent && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }}></span>}
      <span className="eyebrow">{label}</span>
      <span className="stat-value" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</span>
      {sub && <span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>{sub}</span>}
    </div>
  );
}
export function Section({ title, sub, right, children, style }) {
  return (
    <section className="card" style={{ overflow: 'hidden', ...style }}>
      {(title || right) && (
        <div className="row spread" style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', gap: 12 }}>
          <div className="col" style={{ gap: 1 }}>{title && <h3 className="section-title">{title}</h3>}{sub && <span className="section-sub">{sub}</span>}</div>
          {right}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}
export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--sp-12)', padding: '28px 0 48px' }}>
      <div className="wrap row spread" style={{ flexWrap: 'wrap', gap: '24px 40px', alignItems: 'flex-start' }}>
        <div className="col gap-2" style={{ maxWidth: 380 }}>
          <Logo />
          <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.6 }}>Independent analytics derived from public git history & GitHub metadata of ~163 Y Combinator open-source companies. Not affiliated with Y Combinator.</p>
        </div>
        <div className="col gap-3" style={{ alignItems: 'flex-start' }}>
          <span className="eyebrow">Built &amp; maintained by</span>
          <a className="foot-link row gap-2" href="https://x.com/linyiru" target="_blank" rel="noreferrer"><IconX /> @linyiru</a>
          <a className="foot-link row gap-2" href="https://github.com/linyiru/yc-oss-analytics" target="_blank" rel="noreferrer"><IconGit /> Source on GitHub</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- charts: measure + tooltip ---------- */
export function useMeasure() {
  const ref = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    if (!ref.current) return;
    const apply = (px) => { const r = Math.round(px); setW((prev) => (r !== prev ? r : prev)); }; // round + guard: no sub-pixel re-render loops
    const ro = new ResizeObserver((es) => { for (const e of es) apply(e.contentRect.width); });
    ro.observe(ref.current); apply(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
export const Tip = (() => {
  let el;
  const ensure = () => { if (typeof document === 'undefined') return null; if (!el) { el = document.createElement('div'); el.className = 'viz-tip'; document.body.appendChild(el); } return el; };
  return {
    show(html, x, y) { const e = ensure(); if (!e) return; e.innerHTML = html; e.classList.add('show'); const r = e.getBoundingClientRect(); let nx = x + 16, ny = y + 16; if (nx + r.width > window.innerWidth - 8) nx = x - r.width - 16; if (ny + r.height > window.innerHeight - 8) ny = y - r.height - 16; e.style.left = Math.max(8, nx) + 'px'; e.style.top = Math.max(8, ny) + 'px'; },
    hide() { if (el) el.classList.remove('show'); },
    html() { return el ? el.innerHTML : ''; },
  };
})();
const swatch = (c) => `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c}"></span>`;
const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

/* ---------- Scatter ---------- */
export function Scatter({ data, height = 440, onPick, quadrants }) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState(null);
  const m = { t: 18, r: 22, b: 42, l: 46 };
  const W = Math.max(320, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const maxYrs = Math.ceil(Math.max(1, ...data.map((d) => d.yrs)) + 0.5);
  const sx = lin(maxYrs, 0, m.l, m.l + iw), sy = lin(0, 100, m.t + ih, m.t);
  const maxStars = Math.max(1, ...data.map((d) => d.stars));
  const sr = (s) => 4 + Math.sqrt(s / maxStars) * 26;
  const yticks = [0, 25, 50, 75, 100]; const xticks = []; for (let y = 0; y <= maxYrs; y++) xticks.push(y);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={() => { setHover(null); Tip.hide(); }}>
        {quadrants && (<g>
          <rect x={m.l} y={m.t} width={iw / 2} height={ih / 2} style={{ fill: 'var(--evergreen)', opacity: 0.05 }} />
          <text x={m.l + 10} y={m.t + 18} className="mono" style={{ fill: 'var(--evergreen)', fontSize: 10.5, opacity: 0.85 }}>EVERGREEN ↖ old · still alive</text>
          <text x={m.l + iw - 10} y={m.t + 18} textAnchor="end" className="mono" style={{ fill: 'var(--rising)', fontSize: 10.5, opacity: 0.85 }}>RISING ↗ new · hot</text>
          <text x={m.l + 10} y={m.t + ih - 8} className="mono" style={{ fill: 'var(--dormant)', fontSize: 10.5, opacity: 0.7 }}>DORMANT ↙ faded</text>
        </g>)}
        {yticks.map((tk) => (<g key={'y' + tk}><line x1={m.l} x2={m.l + iw} y1={sy(tk)} y2={sy(tk)} style={{ stroke: 'var(--grid)' }} /><text x={m.l - 9} y={sy(tk) + 3.5} textAnchor="end" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{tk}</text></g>))}
        {xticks.map((tk) => <text key={'x' + tk} x={sx(tk)} y={m.t + ih + 18} textAnchor="middle" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{tk}{tk === maxYrs ? 'y' : ''}</text>)}
        <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} style={{ stroke: 'var(--axis)' }} />
        <text x={m.l + iw / 2} y={H - 4} textAnchor="middle" className="mono" style={{ fill: 'var(--text-3)', fontSize: 10 }}>← older cohort    years since YC batch    newer →</text>
        {data.map((d) => {
          const cx = sx(d.yrs), cy = sy(d.liveness), r = sr(d.stars), on = hover === d.id;
          return <circle key={d.id} cx={cx} cy={cy} r={r} style={{ fill: typeColor(d.type), fillOpacity: on ? 0.95 : 0.5, color: typeColor(d.type), stroke: typeColor(d.type), strokeWidth: on ? 1.6 : 1, cursor: 'pointer', filter: on ? 'drop-shadow(0 0 6px currentColor)' : 'none', transition: 'fill-opacity .12s' }}
            onMouseEnter={(e) => { setHover(d.id); Tip.show(`<div class="t-title">${swatch(typeColor(d.type))}${d.name}</div><div class="t-row"><span>${d.type} · ${d.batch}</span></div><div class="t-row"><span>Liveness</span><b>${d.liveness}</b></div><div class="t-row"><span>Stars</span><b>${fmtCompact(d.stars)}</b></div>`, e.clientX, e.clientY); }}
            onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)} onClick={() => onPick && onPick(d)} />;
        })}
      </svg>
    </div>
  );
}

/* ---------- StarCurve ---------- */
const SRC_COLOR = { HN: '#ff6600', PH: '#da552f', YC: 'var(--accent)' };
export function StarCurve({ series, viralIndex, viralGain, spikes = [], launches = [], height = 216, locale }) {
  const [ref, w] = useMeasure();
  const m = { t: 14, r: 16, b: 24, l: 46 };
  const W = Math.max(280, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const pts = series; if (!pts || pts.length < 2) return <div className="faint" style={{ fontSize: 12, padding: 20 }}>No star history.</div>;
  const maxV = Math.max(...pts.map((p) => p.v));
  const sx = lin(pts[0].i, pts[pts.length - 1].i, m.l, m.l + iw), sy = lin(0, maxV, m.t + ih, m.t);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.i).toFixed(1)} ${sy(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${sx(pts[pts.length - 1].i)} ${m.t + ih} L${sx(pts[0].i)} ${m.t + ih} Z`;
  const yt = [0, 0.5, 1].map((f) => Math.round(maxV * f));
  const vi = viralIndex != null && pts[viralIndex] ? viralIndex : 0;
  const vx = sx(pts[vi].i), vy = sy(pts[vi].v); const gid = 'sg' + Math.round(maxV);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={() => Tip.hide()}
        onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - rect.left - m.l) / iw) * (pts.length - 1)); const p = pts[Math.max(0, Math.min(pts.length - 1, i))]; if (!p) return; Tip.show(`<div class="t-title">${fmtMonth(p.month, locale)}</div><div class="t-row"><span>Total stars</span><b>${fmtInt(p.v, locale)}</b></div>`, e.clientX, e.clientY); }}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.32 }} /><stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} /></linearGradient></defs>
        {yt.map((t) => (<g key={t}><line x1={m.l} x2={m.l + iw} y1={sy(t)} y2={sy(t)} style={{ stroke: 'var(--grid)' }} /><text x={m.l - 8} y={sy(t) + 3} textAnchor="end" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{fmtCompact(t, locale)}</text></g>))}
        <path d={area} fill={`url(#${gid})`} /><path d={line} fill="none" style={{ stroke: 'var(--accent)', strokeWidth: 2 }} strokeLinejoin="round" />
        {viralGain ? <><line x1={vx} x2={vx} y1={m.t} y2={m.t + ih} style={{ stroke: 'var(--accent-line)', strokeDasharray: '3 3' }} />
          <circle cx={vx} cy={vy} r={4} style={{ fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }} />
          <g transform={`translate(${Math.min(vx + 8, m.l + iw - 96)} ${m.t + 4})`}><text className="mono" style={{ fill: 'var(--accent-text)', fontSize: 10.5, fontWeight: 600 }}>↑ viral moment</text><text y={13} className="mono" style={{ fill: 'var(--text-3)', fontSize: 9.5 }}>+{fmtCompact(viralGain, locale)}</text></g></> : null}
        {/* inferred event-day spikes — star jumps with no known launch post (organic / other) */}
        {spikes.filter((s) => s.i !== vi && !launches.some((L) => Math.abs(L.i - s.i) <= 4)).map((s, k) => {
          const x = sx(s.i), y = sy(s.v);
          return (
            <circle key={'sp' + k} cx={x} cy={y} r={3} style={{ fill: 'var(--rising)', stroke: 'var(--surface)', strokeWidth: 1.5, cursor: 'pointer' }}
              onMouseEnter={(e) => Tip.show(`<div class="t-title">${s.t} · spike (no known launch)</div><div class="t-row"><span>stars that day</span><b>+${fmtInt(s.gain, locale)}</b></div>`, e.clientX, e.clientY)}
              onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)} onMouseLeave={() => Tip.hide()} />
          );
        })}
        {/* actual launch posts — HN / Product Hunt / YC Launch, pinned to the curve */}
        {launches.map((L, k) => {
          const x = sx(L.i), y = sy(L.v), col = SRC_COLOR[L.source] || 'var(--accent)';
          const show = (e) => Tip.show(`<div class="t-title">${L.source} · ${L.date}</div><div class="t-row"><span>${L.title}</span></div><div class="t-row"><span>${L.meta || ''}</span></div>`, e.clientX, e.clientY);
          return (
            <g key={'L' + k}>
              <line x1={x} x2={x} y1={y} y2={m.t + ih} style={{ stroke: col, strokeOpacity: 0.3, strokeWidth: 1 }} />
              <circle cx={x} cy={y} r={4.2} style={{ fill: col, stroke: 'var(--surface)', strokeWidth: 1.6, cursor: 'pointer' }}
                onMouseEnter={show} onMouseMove={show} onMouseLeave={() => Tip.hide()} />
            </g>
          );
        })}
        {[pts[0], pts[pts.length - 1]].map((p, k) => <text key={k} x={sx(p.i)} y={m.t + ih + 16} textAnchor={k ? 'end' : 'start'} className="mono" style={{ fill: 'var(--text-faint)', fontSize: 10 }}>{fmtMonth(p.month, locale)}</text>)}
      </svg>
    </div>
  );
}

/* ---------- ColumnBars ---------- */
export function ColumnBars({ data, height = 216, locale, label = 'commits' }) {
  const [ref, w] = useMeasure();
  const [hi, setHi] = useState(-1);
  const m = { t: 10, r: 8, b: 22, l: 40 };
  const W = Math.max(280, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  if (!data || !data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.v)); const bw = iw / data.length; const yt = [0, Math.round(max / 2), max];
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }} onMouseLeave={() => { setHi(-1); Tip.hide(); }}>
        {yt.map((t) => (<g key={t}><line x1={m.l} x2={m.l + iw} y1={m.t + ih - (t / max) * ih} y2={m.t + ih - (t / max) * ih} style={{ stroke: 'var(--grid)' }} /><text x={m.l - 7} y={m.t + ih - (t / max) * ih + 3} textAnchor="end" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 9.5 }}>{fmtCompact(t, locale)}</text></g>))}
        {data.map((d, i) => { const h = (d.v / max) * ih; return <rect key={i} x={m.l + i * bw + bw * 0.14} y={m.t + ih - h} width={bw * 0.72} height={Math.max(0, h)} rx={1.5} style={{ fill: hi === i ? 'var(--accent)' : 'var(--steady)', fillOpacity: hi === i ? 1 : 0.62, transition: 'fill-opacity .1s' }} onMouseEnter={(e) => { setHi(i); Tip.show(`<div class="t-title">${fmtMonth(d.month, locale)}</div><div class="t-row"><span>${label}</span><b>${fmtInt(d.v, locale)}</b></div>`, e.clientX, e.clientY); }} onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)} />; })}
        {[data[0], data[data.length - 1]].map((d, k) => <text key={k} x={m.l + (k ? iw : 0)} y={H - 6} textAnchor={k ? 'end' : 'start'} className="mono" style={{ fill: 'var(--text-faint)', fontSize: 9.5 }}>{fmtMonth(d.month, locale)}</text>)}
      </svg>
    </div>
  );
}

/* ---------- CodeGrowth (diverging) ---------- */
export function CodeGrowth({ data, height = 208, locale }) {
  const [ref, w] = useMeasure();
  const [hi, setHi] = useState(-1);
  const m = { t: 12, r: 8, b: 18, l: 46 };
  const W = Math.max(280, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  if (!data || !data.length) return <div className="faint" style={{ fontSize: 12, padding: 20 }}>Churn not computed for this repo.</div>;
  const maxA = Math.max(1, ...data.map((d) => d.added)), maxD = Math.max(1, ...data.map((d) => d.deleted));
  const mid = m.t + (ih * maxA) / (maxA + maxD); const bw = iw / data.length; const upH = mid - m.t, dnH = m.t + ih - mid;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }} onMouseLeave={() => { setHi(-1); Tip.hide(); }}>
        <line x1={m.l} x2={m.l + iw} y1={mid} y2={mid} style={{ stroke: 'var(--axis)' }} />
        <text x={m.l - 7} y={m.t + 8} textAnchor="end" className="mono" style={{ fill: 'var(--series-add)', fontSize: 9.5 }}>+{fmtCompact(maxA, locale)}</text>
        <text x={m.l - 7} y={m.t + ih} textAnchor="end" className="mono" style={{ fill: 'var(--series-del)', fontSize: 9.5 }}>-{fmtCompact(maxD, locale)}</text>
        {data.map((d, i) => { const ah = (d.added / maxA) * upH, dh = (d.deleted / maxD) * dnH, on = hi === i; return (
          <g key={i} onMouseEnter={(e) => { setHi(i); Tip.show(`<div class="t-title">${fmtMonth(d.month, locale)}</div><div class="t-row"><span>${swatch('var(--series-add)')} Added</span><b>+${fmtInt(d.added, locale)}</b></div><div class="t-row"><span>${swatch('var(--series-del)')} Deleted</span><b>-${fmtInt(d.deleted, locale)}</b></div>`, e.clientX, e.clientY); }} onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)}>
            <rect x={m.l + i * bw + bw * 0.14} y={mid - ah} width={bw * 0.72} height={ah} rx={1} style={{ fill: 'var(--series-add)', fillOpacity: on ? 1 : 0.66 }} />
            <rect x={m.l + i * bw + bw * 0.14} y={mid} width={bw * 0.72} height={dh} rx={1} style={{ fill: 'var(--series-del)', fillOpacity: on ? 1 : 0.6 }} />
          </g>); })}
      </svg>
    </div>
  );
}

/* ---------- PunchCard ---------- */
export function PunchCard({ grid, max, locale }) {
  const [ref, w] = useMeasure();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const m = { t: 16, r: 8, b: 16, l: 34 };
  const W = Math.max(360, w), iw = W - m.l - m.r; const cell = iw / 24, gap = 1.5; const H = m.t + m.b + cell * 7;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }} onMouseLeave={() => Tip.hide()}>
        {[0, 6, 12, 18, 23].map((h) => <text key={h} x={m.l + h * cell + cell / 2} y={11} textAnchor="middle" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 9 }}>{h}:00</text>)}
        {grid.map((row, d) => (<g key={d}>
          <text x={m.l - 6} y={m.t + d * cell + cell / 2 + 3} textAnchor="end" className="mono" style={{ fill: 'var(--text-3)', fontSize: 9.5 }}>{days[d]}</text>
          {row.map((v, h) => { const f = v / (max || 1); return <rect key={h} x={m.l + h * cell + gap / 2} y={m.t + d * cell + gap / 2} width={cell - gap} height={cell - gap} rx={2} style={{ fill: f < 0.02 ? 'var(--heat-0)' : 'var(--accent)', fillOpacity: f < 0.02 ? 1 : 0.12 + f * 0.88 }} onMouseEnter={(e) => Tip.show(`<div class="t-title">${days[d]} ${String(h).padStart(2, '0')}:00</div><div class="t-row"><span>commits</span><b>${fmtInt(v, locale)}</b></div>`, e.clientX, e.clientY)} onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)} />; })}
        </g>))}
      </svg>
    </div>
  );
}

/* ---------- RankedBars ---------- */
export function RankedBars({ items, color = 'var(--accent)', locale, fmt }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const f = fmt || ((v) => fmtInt(v, locale));
  return (
    <div className="col gap-2" style={{ width: '100%' }}>
      {items.map((it, i) => (
        <div key={i} className="row gap-3" style={{ alignItems: 'center' }}>
          <div className="mono truncate" style={{ width: 132, flex: '0 0 132px', fontSize: 'var(--fs-sm)', color: 'var(--text-2)', textAlign: 'right' }}>{it.label}</div>
          <div className="grow" style={{ position: 'relative', height: 22, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${(it.value / max) * 100}%`, background: it.color || color, opacity: 0.85, borderRadius: 4, transition: 'width .5s var(--ease)' }}></div>
          </div>
          <div className="mono tabular" style={{ width: 52, flex: '0 0 52px', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{f(it.value)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- StackedShare (100% language share by year) ---------- */
export function StackedShare({ byYear, colorOf, height = 320 }) {
  const [ref, w] = useMeasure();
  const [hi, setHi] = useState(null);
  const m = { t: 12, r: 12, b: 28, l: 34 };
  const W = Math.max(320, w), H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const bw = iw / byYear.length;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }} onMouseLeave={() => { setHi(null); Tip.hide(); }}>
        {[0, 25, 50, 75, 100].map((t) => (<g key={t}><line x1={m.l} x2={m.l + iw} y1={m.t + ih - (t / 100) * ih} y2={m.t + ih - (t / 100) * ih} style={{ stroke: 'var(--grid)' }} /><text x={m.l - 6} y={m.t + ih - (t / 100) * ih + 3} textAnchor="end" className="mono" style={{ fill: 'var(--text-faint)', fontSize: 9 }}>{t}</text></g>))}
        {byYear.map((yr, i) => {
          let acc = 0; const x = m.l + i * bw + bw * 0.16, bWidth = bw * 0.68;
          return (
            <g key={yr.year}>
              {yr.shares.filter((s) => s.pct > 0).map((s) => {
                const h = (s.pct / 100) * ih; const y = m.t + ih - acc - h; acc += h; const on = hi === s.lang;
                return <rect key={s.lang} x={x} y={y} width={bWidth} height={Math.max(0, h - 0.6)} style={{ fill: colorOf(s.lang), fillOpacity: hi && !on ? 0.28 : 0.92, transition: 'fill-opacity .12s' }}
                  onMouseEnter={(e) => { setHi(s.lang); Tip.show(`<div class="t-title">${swatch(colorOf(s.lang))}${s.lang} · '${String(yr.year).slice(2)}</div><div class="t-row"><span>share</span><b>${s.pct.toFixed(0)}%</b></div>`, e.clientX, e.clientY); }}
                  onMouseMove={(e) => Tip.show(Tip.html(), e.clientX, e.clientY)} />;
              })}
              <text x={x + bWidth / 2} y={m.t + ih + 16} textAnchor="middle" className="mono" style={{ fill: 'var(--text-3)', fontSize: 10 }}>'{String(yr.year).slice(2)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- LangBar ---------- */
export function LangBar({ langs }) {
  return (
    <div style={{ width: '100%' }}>
      <div className="row" style={{ height: 12, borderRadius: 4, overflow: 'hidden', gap: 1.5 }}>
        {langs.map((l) => <div key={l.name} title={`${l.name} ${l.pct}%`} style={{ width: `${l.pct}%`, background: l.color, height: '100%' }}></div>)}
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
        {langs.map((l) => <span key={l.name} className="row gap-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}><i style={{ width: 8, height: 8, borderRadius: 2, background: l.color }}></i>{l.name}<b className="mono tabular" style={{ color: 'var(--text)', fontWeight: 600 }}>{l.pct}%</b></span>)}
      </div>
    </div>
  );
}

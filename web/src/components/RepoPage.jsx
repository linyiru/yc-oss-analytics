/* Repo detail island — ported from the Claude Design handoff, fed real repo data. */
import React, { useEffect } from 'react';
import {
  Store, useStore, TopNav, Footer, Section, StatCard, TypeBadge, BatchBadge, LangBadge,
  StarCurve, ColumnBars, CodeGrowth, PunchCard, RankedBars, LangBar,
  IconChevron, IconGit, IconStar, IconExt, fmtCompact, fmtInt, fmtMonth, typeColor,
} from './kit.jsx';

export default function RepoPage({ view, initialLocale }) {
  const { intl, T } = useStore();
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  if (!view) return <div className="wrap" style={{ padding: 60 }}>Repository not found.</div>;
  const { c, d } = view;
  const fc = (n) => fmtCompact(n, intl);
  const fi = (n) => fmtInt(n, intl);
  const viralMonth = d.starCurve.pts[d.starCurve.viralIndex]?.month;

  const stats = [
    ['Stars', fc(c.stars), d.starCurve.viralGain ? '+' + fc(d.starCurve.viralGain) + ' peak' : 'all-time', 'var(--rising)'],
    ['Commits', fc(c.commits), c.monthsActive + ' mo active', null],
    ['Commits / wk', fi(c.commitsPerWeek), 'lifetime avg', 'var(--steady)'],
    ['Contributors', fi(c.contributors), 'all-time', null],
    ['Liveness', c.liveness + '', T(c.type), typeColor(c.type)],
    ['Weekend %', c.weekendPct + '%', 'of commits', null],
    ['AI-assisted', c.aiAssisted + '%', 'of commits', c.aiAssisted >= 40 ? 'var(--accent)' : null],
    ['Months active', fi(c.monthsActive), 'since ' + c.batch, null],
  ];
  const metrics = [
    ['Conventional commits', d.workflow.conventionalCommits, 'var(--steady)'],
    ['PR merge rate', d.workflow.prMergeRate, 'var(--evergreen)'],
    ['AI co-authored', d.workflow.aiCoauthored, 'var(--accent)'],
  ];
  const ci = c.infra.includes('github-actions') ? 'GitHub Actions' : '—';
  const container = c.infra.some((i) => i.startsWith('docker')) ? 'Docker' : '—';

  return (
    <>
      <TopNav active="directory" />
      <main className="wrap" style={{ padding: '20px 20px 0' }}>
        <a href="/" className="row gap-2 faint" style={{ fontSize: 'var(--fs-sm)', marginBottom: 16, width: 'fit-content' }}>
          <IconChevron size={13} style={{ transform: 'rotate(90deg)' }} /> {T('directory')}
        </a>

        <div className="row spread" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ minWidth: 0, maxWidth: 680 }}>
            <div className="row gap-3" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 600, letterSpacing: '-.02em' }}>
                <span className="faint mono" style={{ fontSize: 'var(--fs-lg)', fontWeight: 400 }}>{c.org}/</span>{c.name}
              </h1>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}><TypeBadge type={c.type} /><BatchBadge batch={c.batch} /><LangBadge lang={c.lang} /></div>
            </div>
            <p className="muted" style={{ fontSize: 'var(--fs-md)', marginBottom: c.formerNames?.length ? 6 : 14 }}>{c.oneLiner}</p>
            {c.formerNames?.length > 0 && (
              <p className="faint mono" style={{ fontSize: 'var(--fs-xs)', marginBottom: 14 }}>↳ formerly {c.formerNames.join(', ')}</p>
            )}
            {d.starCurve.viralGain ? (
              <div className="viral-callout">
                <IconStar size={15} fill="currentColor" /><span className="big">+{fc(d.starCurve.viralGain)}</span>
                <span style={{ fontWeight: 500 }}>stars in {d.starCurve.viralDays} days · {fmtMonth(viralMonth, intl)}</span>
              </div>
            ) : null}
          </div>
          <div className="row gap-2">
            <a className="btn" href={`https://github.com/${c.github}`} target="_blank" rel="noreferrer"><IconGit size={14} /> GitHub <IconExt /></a>
          </div>
        </div>

        <div className="statcard-grid" style={{ marginBottom: 16 }}>
          {stats.map(([l, v, s, a]) => <StatCard key={l} label={l} value={v} sub={s} accent={a} />)}
        </div>

        {/* peer context + at-application snapshot */}
        <div className="viz-2col" style={{ marginBottom: 16 }}>
          <Section title="Versus peers" sub="Percentile across all tracked YC OSS repos">
            <div className="col gap-3">
              {[['Stars', c.peers.stars], ['Commits / week', c.peers.commitsPerWeek], ['Liveness', c.peers.liveness]].map(([k, p]) => (
                <div key={k} className="row spread" style={{ alignItems: 'center', gap: 12 }}>
                  <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{k}</span>
                  <span className="row gap-3" style={{ alignItems: 'center' }}>
                    <span className="meter" style={{ width: 120 }}><i style={{ width: `${100 - p}%`, background: p <= 25 ? 'var(--evergreen)' : p <= 60 ? 'var(--steady)' : 'var(--text-3)' }}></i></span>
                    <b className="mono tabular" style={{ fontSize: 'var(--fs-sm)', width: 56, textAlign: 'right' }}>top {p}%</b>
                  </span>
                </div>
              ))}
              <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 4 }}>Relative rank, not an absolute grade — context for "is this normal for the cohort?"</p>
            </div>
          </Section>

          {c.apply ? (
            <Section title="At YC application" sub="Approximate — reconstructed from commit & star history">
              <div className="row gap-6" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">Stars then</span><span className="mono" style={{ fontSize: 'var(--fs-xl)', fontWeight: 600 }}>{fc(c.apply.starsThen)}</span><span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>now {fc(c.stars)}</span></div>
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">Commits then</span><span className="mono" style={{ fontSize: 'var(--fs-xl)', fontWeight: 600 }}>{fc(c.apply.commitsThen)}</span><span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>now {fc(c.commits)}</span></div>
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">Head start</span><span className="mono" style={{ fontSize: 'var(--fs-xl)', fontWeight: 600 }}>{c.apply.leadMonths > 0 ? `~${c.apply.leadMonths} mo` : c.apply.leadMonths < 0 ? `+${-c.apply.leadMonths} mo` : '~0'}</span><span className="faint" style={{ fontSize: 'var(--fs-xs)' }}>{c.apply.leadMonths > 0 ? 'before batch' : c.apply.leadMonths < 0 ? 'into batch' : 'at batch'}</span></div>
              </div>
              <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.55 }}>
                {c.apply.leadMonths > 0
                  ? <>First commit was <b style={{ color: 'var(--text)' }}>~{c.apply.leadMonths} months before</b> the {c.batch} batch started — roughly what this team had built when they got in.</>
                  : c.apply.leadMonths < 0
                    ? <>The public repo began <b style={{ color: 'var(--text)' }}>~{-c.apply.leadMonths} months into</b> the {c.batch} batch.</>
                    : <>The public repo started right around the {c.batch} batch.</>}
              </p>
              <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 8 }}>Batch timing is approximate (YC applications close a few months before a batch begins).</p>
            </Section>
          ) : <Section title="At YC application" sub="Not available"><p className="faint" style={{ fontSize: 'var(--fs-sm)' }}>Batch date couldn't be resolved for this repo.</p></Section>}
        </div>

        <div className="viz-2col" style={{ marginBottom: 16 }}>
          <Section title="Star growth" sub="Cumulative GitHub stars · viral window + event days marked">
            <StarCurve series={d.starCurve.pts} viralIndex={d.starCurve.viralIndex} viralGain={d.starCurve.viralGain} spikes={d.starCurve.spikes} locale={intl} height={216} />
            {d.starCurve.spikes?.length > 0 && (
              <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                <span className="eyebrow">Top event days</span>
                {d.starCurve.spikes.slice(0, 5).map((s) => (
                  <span key={s.t} className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}>
                    <i style={{ width: 7, height: 7, borderRadius: 7, background: 'var(--rising)' }}></i>
                    <span className="mono">{s.t}</span><b className="mono tabular" style={{ color: 'var(--text)' }}>+{fc(s.gain)}</b>
                  </span>
                ))}
              </div>
            )}
            {d.starCurve.partial && (
              <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ color: 'var(--warn)' }}>⚠ Partial early history.</span> Our daily data starts {fmtMonth(d.starCurve.firstDate, intl)}; an earlier <b className="mono">{fc(d.starCurve.baseline)}</b> stars (under a previous repo name, or before it was public) are shown as a baseline. The full early shape is recovered by the rename-proof by-repo-id query.
              </p>
            )}
          </Section>
          <Section title="Monthly commit volume" sub="Commits authored per calendar month"><ColumnBars data={d.monthlyCommits} locale={intl} height={216} /></Section>
        </div>

        <Section title="Commit rhythm" sub={`Weekday × hour · author-local time · ${c.weekendPct}% on weekends (suggestive, not forensic)`} style={{ marginBottom: 16 }}
          right={<span className="row gap-2 faint" style={{ fontSize: 'var(--fs-xs)' }}>less <span className="meter" style={{ width: 60, background: 'linear-gradient(90deg, var(--heat-0), var(--accent))', height: 8 }}></span> more</span>}>
          <PunchCard grid={d.punchcard.grid} max={d.punchcard.max} locale={intl} />
        </Section>

        <div className="viz-2col" style={{ marginBottom: 16 }}>
          <Section title="Net code growth" sub="Lines added vs deleted per month"><CodeGrowth data={d.codeGrowth} locale={intl} height={208} /></Section>
          <Section title="Core contributors" sub={`${fi(c.contributors)} total · top contributor ${c.concentration.top1}% · top 3 = ${c.concentration.top3}% of commits`}><RankedBars items={d.contributors.map((p, i) => ({ label: p.handle, value: p.commits, color: i === 0 ? 'var(--accent)' : 'var(--steady)' }))} locale={intl} /></Section>
        </div>

        <div className="repo-side" style={{ marginBottom: 16 }}>
          <Section title="Tech stack" sub="Language composition & tooling">
            <LangBar langs={d.langs} />
            <div className="divider" style={{ margin: '16px 0' }}></div>
            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              {[['Package mgr', c.pkgManager], ['CI', ci], ['Container', container], ['License', c.license]].map(([k, v]) => (
                <div key={k} className="col" style={{ gap: 2 }}><span className="eyebrow">{k}</span><span className="mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>{v || '—'}</span></div>
              ))}
            </div>
            <div className="divider" style={{ margin: '16px 0' }}></div>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Workflow signals</span>
            {metrics.map(([label, val, col]) => (
              <div className="metric-row" key={label}>
                <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{label}</span>
                <span className="mono tabular" style={{ fontWeight: 600 }}>{val}%</span>
                <span className="metric-bar"><i style={{ width: val + '%', background: col }}></i></span>
              </div>
            ))}
          </Section>

          <Section title="AI coding tools detected" sub="From config files & commit co-authors">
            {d.aiTools.length ? (
              <div className="col gap-3">
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {d.aiTools.map((tl) => (
                    <span key={tl.id} className="tool-pill"><i style={{ width: 7, height: 7, borderRadius: 7, background: tl.id === 'claude-code' ? 'var(--accent)' : 'var(--text-3)' }}></i>{tl.name}<span className="sig">{tl.kind}</span></span>
                  ))}
                </div>
                <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5 }}>{c.aiAssisted}% of commits carry a Claude co-author trailer. Config-file detection is a lower bound.</p>
              </div>
            ) : <p className="faint" style={{ fontSize: 'var(--fs-sm)', padding: '12px 0' }}>No AI tooling config detected.</p>}
          </Section>
        </div>

        <Section style={{ marginBottom: 16 }}>
          <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
            <span style={{ width: 4, alignSelf: 'stretch', background: c.liveness >= 60 ? 'var(--evergreen)' : 'var(--rising)', borderRadius: 4, flex: '0 0 4px' }}></span>
            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>How the stars grew · context, not a verdict</span>
              <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, maxWidth: 820 }}>
                {c.starsPerFork != null && <>This repo has <b style={{ color: 'var(--text)' }}>{c.starsPerFork}:1</b> stars-per-fork{c.starsPerContributor != null && <> and <b style={{ color: 'var(--text)' }}>{fi(c.starsPerContributor)}:1</b> stars-per-contributor</>}. </>}
                These are neutral engagement ratios — high values can mean weak community pull or simply a very popular tool, and on their own say <b style={{ color: 'var(--text)' }}>nothing</b> about how the stars were earned. The star-growth curve above tells that story better — steady climb, an event-driven spike, or network amplification. {d.contributors.length > 6 ? 'Contribution is spread across the core team.' : 'Work is concentrated in a few maintainers.'}
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

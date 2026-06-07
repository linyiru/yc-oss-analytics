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
  const { c, d, total } = view;
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
      <TopNav active="directory" count={total} />
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
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}><TypeBadge type={c.type} /><BatchBadge batch={c.batch} /><LangBadge lang={c.lang} />
                {c.status && (() => { const col = { Active: 'var(--evergreen)', Acquired: 'var(--steady)', Public: 'var(--accent)', Inactive: 'var(--dormant)' }[c.status] || 'var(--text-3)'; return <span className="badge" style={{ color: col, borderColor: 'color-mix(in oklab, ' + col + ' 45%, transparent)' }}><i className="dot" style={{ background: col }}></i>{c.status}</span>; })()}
              </div>
            </div>
            <p className="muted" style={{ fontSize: 'var(--fs-md)', marginBottom: 6 }}>{c.oneLiner}</p>
            {c.ycName && c.ycName.replace(/[^a-z0-9]/gi, '').toLowerCase() !== c.name.replace(/[^a-z0-9]/gi, '').toLowerCase() && (
              <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginBottom: 8 }}>↳ YC company listed as <b style={{ color: 'var(--text-2)', fontWeight: 500 }}>{c.ycName}</b> (rebranded)</p>
            )}
            {(c.yearFounded || c.teamSize || c.partner || c.founders?.length) && (
              <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginBottom: 14, lineHeight: 1.6 }}>
                {c.yearFounded && <>Founded {c.yearFounded} · </>}{c.teamSize != null && <>team {c.teamSize} · </>}
                {c.founders?.length > 0 && <>{c.founders.map((f) => f.name).join(', ')}</>}
                {c.partner && <> · YC partner <b style={{ color: 'var(--text-2)', fontWeight: 500 }}>{c.partner}</b></>}
              </p>
            )}
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

        {c.traction && (() => {
          const t = c.traction;
          const dur = (d) => d == null ? null : d < 14 ? `${d}d` : d < 60 ? `~${Math.round(d / 7)} wk` : `~${Math.round(d / 30.4)} mo`;
          const items = [
            ['First public launch', dur(t.toLaunch), t.firstLaunchSource ? `${t.firstLaunchSource} · from first commit` : 'from first commit'],
            ['To 100 stars', dur(t.to100), 'from first commit'],
            ['To 1,000 stars', dur(t.to1000), 'from first commit'],
            ['To 10,000 stars', dur(t.to10000), 'from first commit'],
          ].filter(([, v]) => v != null);
          if (!items.length) return null;
          return (
            <Section title="Time to traction" sub="How long the long game ran before it broke out — elapsed from the first commit" style={{ marginBottom: 16 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: '18px 32px' }}>
                {items.map(([label, val, note]) => (
                  <div key={label} className="col" style={{ gap: 2 }}>
                    <span className="eyebrow">{label}</span>
                    <span className="mono" style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, color: 'var(--accent-text)' }}>{val}</span>
                    <span className="faint" style={{ fontSize: 'var(--fs-2xs)' }}>{note}</span>
                  </div>
                ))}
              </div>
              <p className="faint" style={{ fontSize: 'var(--fs-2xs)', lineHeight: 1.5, marginTop: 12 }}>
                Overnight success is rare: the median repo here took months — often years — from first commit to its star milestones. Measured only where full early star history is available.
              </p>
            </Section>
          );
        })()}

        {(() => {
          const L = d.starCurve.launches ?? [];
          const srcMeta = { HN: ['#ff6600', 'Hacker News'], PH: ['#da552f', 'Product Hunt'], YC: ['var(--accent)', 'YC Launch'] };
          const present = ['HN', 'PH', 'YC'].filter((s) => L.some((x) => x.source === s));
          const orphanSpikes = (d.starCurve.spikes ?? []).filter((s) => !L.some((x) => Math.abs(x.i - s.i) <= 4) && s.i !== d.starCurve.viralIndex);
          return (
            <Section title="Star growth, annotated" sub="Cumulative stars with the actual launch posts pinned to the curve — so you can see which spike came from what" style={{ marginBottom: 16 }}>
              <StarCurve series={d.starCurve.pts} viralIndex={d.starCurve.viralIndex} viralGain={d.starCurve.viralGain} spikes={d.starCurve.spikes} launches={L} locale={intl} height={300} />
              <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 12, alignItems: 'center', rowGap: 6 }}>
                <span className="eyebrow">Key</span>
                {present.map((s) => (
                  <span key={s} className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}>
                    <i style={{ width: 9, height: 9, borderRadius: 9, background: srcMeta[s][0], border: '1.5px solid var(--surface)', boxShadow: '0 0 0 1px ' + (srcMeta[s][0] === 'var(--accent)' ? 'var(--accent)' : srcMeta[s][0]) }}></i>{srcMeta[s][1]}
                  </span>
                ))}
                {orphanSpikes.length > 0 && <span className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}><i style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--rising)' }}></i>Spike, no known launch</span>}
                <span className="row gap-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-2)' }}><span style={{ width: 12, height: 0, borderTop: '2px dashed var(--accent-line)' }}></span>Viral window</span>
              </div>
              {L.length === 0 && <p className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>No HN / Product Hunt / YC launch posts on record for this repo — the marked dots are inferred spike days.</p>}
              {d.starCurve.partial && (
                <p className="faint" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span style={{ color: 'var(--warn)' }}>⚠ Partial early history.</span> Our daily data starts {fmtMonth(d.starCurve.firstDate, intl)}; an earlier <b className="mono">{fc(d.starCurve.baseline)}</b> stars (under a previous repo name, or before it was public) are shown as a baseline. The full early shape is recovered by the rename-proof by-repo-id query.
                </p>
              )}
            </Section>
          );
        })()}

        {d.launchEvents?.length > 0 && (
          <Section title="Launch moments" sub="Every dot on the curve above, in detail — the HN / Product Hunt / YC Launch posts, in order" style={{ marginBottom: 16 }}>
            <div className="col" style={{ gap: 0 }}>
              {d.launchEvents.map((e, i) => {
                const col = e.source === 'HN' ? '#ff6600' : e.source === 'PH' ? '#da552f' : 'var(--accent)';
                return (
                  <a key={i} href={e.url} target="_blank" rel="noreferrer" className="row spread" style={{ padding: '9px 0', borderBottom: i < d.launchEvents.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', alignItems: 'center', gap: 12 }}>
                    <span className="row gap-3" style={{ minWidth: 0, alignItems: 'center' }}>
                      <span className="badge mono" style={{ background: col + '22', color: col, borderColor: col + '55', flex: '0 0 auto' }}>{e.source}</span>
                      <span className="mono faint" style={{ fontSize: 'var(--fs-xs)', flex: '0 0 auto', width: 74 }}>{e.date}</span>
                      <span className="truncate" style={{ color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>{e.title}</span>
                    </span>
                    <span className="mono faint" style={{ fontSize: 'var(--fs-xs)', flex: '0 0 auto' }}>{e.meta}</span>
                  </a>
                );
              })}
            </div>
          </Section>
        )}

        {c.earlyNet && (c.earlyNet.first100_net_pct != null || c.earlyNet.first1000_net_pct != null) && (
          <Section title="Who seeded the early stars" sub="Share of the earliest stargazers who also back ≥2 other YC open-source repos — a de-identified read on YC-network distribution" style={{ marginBottom: 16 }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: '18px 40px', alignItems: 'flex-start' }}>
              {c.earlyNet.first100_net_pct != null && (
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">First 100 stars</span><span className="mono" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--accent-text)' }}>{c.earlyNet.first100_net_pct}%</span><span className="faint" style={{ fontSize: 'var(--fs-2xs)' }}>also back ≥2 other YC repos</span></div>
              )}
              {c.earlyNet.first1000_net_pct != null && (
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">First 1,000 stars</span><span className="mono" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--accent-text)' }}>{c.earlyNet.first1000_net_pct}%</span><span className="faint" style={{ fontSize: 'var(--fs-2xs)' }}>also back ≥2 other YC repos</span></div>
              )}
              {c.networkStarPct != null && (
                <div className="col" style={{ gap: 2 }}><span className="eyebrow">All-time</span><span className="mono" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--text-2)' }}>{c.networkStarPct}%</span><span className="faint" style={{ fontSize: 'var(--fs-2xs)' }}>of all stargazers</span></div>
              )}
            </div>
            <p className="faint" style={{ fontSize: 'var(--fs-2xs)', lineHeight: 1.5, marginTop: 12 }}>
              Across the dataset, a median <b style={{ color: 'var(--text-2)' }}>63%</b> of a repo's first 100 stargazers also back at least two <i>other</i> YC open-source repos. High here means the YC ecosystem seeded early traction; lower means it reached beyond the bubble sooner. Structural cross-star overlap only — no individuals identified.
            </p>
          </Section>
        )}

        <Section title="Monthly commit volume" sub="Commits authored per calendar month — the build cadence under the star curve" style={{ marginBottom: 16 }}><ColumnBars data={d.monthlyCommits} locale={intl} height={200} /></Section>

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

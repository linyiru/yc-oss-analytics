/* Methodology — honest method, limitations, and cautions. Content page in the design system. */
import React, { useEffect } from 'react';
import { Store, TopNav, Footer, Section } from './kit.jsx';

const DEFS = [
  ['Liveness (0–100)', 'A heuristic, not a validated index: 0.55·recency + 0.45·log-scaled 90-day commit volume. Treat it as ordinal — good for sorting, not a precise grade.'],
  ['Type (Evergreen / Rising / Steady / Dormant)', 'Crosses liveness with YC batch age. Evergreen = old cohort still very active; Dormant = liveness < 30. Squash-merge teams can look quieter than they are.'],
  ['Commit punch card', "Counts by weekday × hour in the commit's own recorded timezone. CI, rebases, travel and misconfigured clocks distort this — read night/weekend patterns as suggestive, never forensic."],
  ['Star-growth curve', 'Reconstructed from stargazer timestamps. Exact for repos under ~40k stars; larger repos are sampled (the API caps at ~400 pages), so their recent curve is approximate.'],
  ['AI-assisted %', 'Share of commits carrying a Co-Authored-By: Claude trailer. A lower bound — it only catches tools that write the trailer, and only when authors keep it.'],
  ['AI tool detection', 'From config files in the tree (CLAUDE.md, .cursor/, AGENTS.md, …). AGENTS.md is a vendor-neutral convention (not Codex-specific); MCP is excluded as it is a protocol, not a tool.'],
  ['Churn', 'Lines added/deleted per month via git numstat — computed only for fully-cloned repos; lock and generated files are not yet excluded.'],
  ['Contributor identity', 'Email-based. One person with multiple emails counts as several contributors; shared/bot emails merge people. Counts are approximate.'],
];
const LIMITS = [
  'Survivorship bias: only currently-listed, surviving companies appear — delisted/dead ones are invisible, inflating every "alive" impression.',
  'Stars ≠ adoption ≠ revenue. A public repo may also be marketing for a closed-source product.',
  'Small n per batch — do not rank cohorts on means.',
  'Composite scores (liveness) are weighted heuristics, not measurements; once visible, any metric can be gamed (Goodhart).',
  'Everything here is cross-sectional and correlational. It generates hypotheses to investigate, not causal proof.',
];
const Def = ({ k, v }) => (
  <div style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
    <div className="mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
    <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.55, margin: 0 }}>{v}</p>
  </div>
);

export default function MethodologyPage({ initialLocale }) {
  useEffect(() => { if (initialLocale && initialLocale !== Store.get().locale) Store.set({ locale: initialLocale }); }, []);
  return (
    <>
      <TopNav active="methodology" />
      <main className="wrap" style={{ padding: '26px 20px 0', maxWidth: 900 }}>
        <div style={{ marginBottom: 22 }}>
          <span className="eyebrow">Methodology</span>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.1, margin: '8px 0 10px' }}>How every number is made — and where it breaks.</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-md)', lineHeight: 1.55 }}>Independent analysis of public data on ~158 Y Combinator open-source companies. <b style={{ color: 'var(--text)' }}>Not affiliated with or endorsed by Y Combinator.</b> Every figure is an approximation with known caveats — we would rather under-claim.</p>
        </div>

        <Section title="How each metric is computed" sub="Definitions & the assumptions baked in" style={{ marginBottom: 16 }}>
          {DEFS.map(([k, v]) => <Def key={k} k={k} v={v} />)}
        </Section>

        <Section title="Limitations" sub="Read these before drawing conclusions" style={{ marginBottom: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {LIMITS.map((l, i) => <li key={i} className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, marginBottom: 8 }}>{l}</li>)}
          </ul>
        </Section>

        <Section title="Reading the star-growth story" sub="The shape and sources of growth — descriptive, not a verdict" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
            We're curious about <b style={{ color: 'var(--text)' }}>how</b> a project's stars accumulated, not whether they're "real". A curve's shape usually points to one of a few all-legitimate paths: <b style={{ color: 'var(--text)' }}>steady organic growth</b>, an <b style={{ color: 'var(--text)' }}>event-driven spike</b> (a YC Launch, Show HN, Product Hunt, an HN front page, a well-timed tweet), or <b style={{ color: 'var(--text)' }}>alumni / network amplification</b> (early stars from the YC orbit). Engagement ratios (stars-per-fork, stars-per-contributor) are shown with peer context as descriptive lenses on that story — never accusations. We do not publish personal data or label any project as fake.
          </p>
        </Section>

        <Section title="Sources & updates" sub="Provenance" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
            Company list & batches from the public YC directory via <span className="mono">yc-oss</span>. Repo metadata, languages and stargazer timestamps from the GitHub API (authenticated, rate-limit-respecting). Commit cadence, punch cards and churn from each repo's git history (cloned, analyzed, discarded). A scheduled job tracks companies appearing and disappearing upstream. If you'd like your project corrected or excluded, open an issue.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

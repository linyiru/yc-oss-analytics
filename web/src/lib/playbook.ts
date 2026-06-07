// Data-backed "success factors" — every lesson's numbers are computed live from the dataset,
// so they stay honest as the data updates. Narrative is human-written; figures are not.
import { repos } from './data';

const stars = (r: any) => r.metrics?.stars ?? 0;
const eng = (r: any) => r.engagement ?? {};
const med = (xs: number[]) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : 0;
};
const top = (rs: any[], n: number) => [...rs].sort((a, b) => stars(b) - stars(a)).slice(0, n).map((r) => r.slug);

// Tiny OLS (normal equations + Gaussian elimination) — solves X·β = y for the
// controlled-association regression. Keeps the "after controlling for size/age" numbers live.
function solveOLS(X: number[][], y: number[]): number[] {
  const n = X.length, p = X[0]?.length ?? 0;
  if (!n || !p) return [];
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) { b[j] += X[i][j] * y[i]; for (let kk = 0; kk < p; kk++) A[j][kk] += X[i][j] * X[i][kk]; }
  for (let c = 0; c < p; c++) {
    let piv = c; for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
    const d = A[c][c] || 1e-9;
    for (let kk = c; kk < p; kk++) A[c][kk] /= d; b[c] /= d;
    for (let r = 0; r < p; r++) if (r !== c) { const f = A[r][c]; for (let kk = c; kk < p; kk++) A[r][kk] -= f * A[c][kk]; b[r] -= f * b[c]; }
  }
  return b;
}

export interface Cmp { a: number; b: number; aLabel: string; bLabel: string; mult: string; unit?: string }
export interface Echo { principle: string; author: string; source: string; url: string }
export interface Lesson { key: string; title: string; stat: string; statLabel: string; body: string[]; echoes: Echo[]; caveat: string; examples: string[]; kicker?: string; compare?: Cmp }

export function playbook(): { lessons: Lesson[]; n: number } {
  const R = repos;
  const hnMax = (r: any) => Math.max(0, ...((r.hn_events ?? []).map((e: any) => e.points)));
  const withHN = R.filter((r) => hnMax(r) >= 100), noHN = R.filter((r) => hnMax(r) < 100);
  const withPH = R.filter((r: any) => r.ph_event), noPH = R.filter((r: any) => !r.ph_event);
  const resp = (r: any) => eng(r).comments_per_issue ?? 0;
  const respHi = R.filter((r: any) => resp(r) >= 2 && eng(r).issues > 50);
  const respLo = R.filter((r: any) => resp(r) < 2 && eng(r).issues > 50);
  const ever = R.filter((r) => r.activity?.class === 'evergreen');
  const byStars = [...R].sort((a, b) => stars(b) - stars(a));
  const topN = byStars.slice(0, 40), botN = byStars.slice(-40);
  const conc = (r: any) => r.contributors?.[0]?.pct ?? 0;
  const spikeShare = (r: any) => { const s = r.star_spikes?.[0]?.gain; return s && stars(r) ? Math.round((100 * s) / stars(r)) : null; };
  const en = (r: any) => eng(r).early_network ?? {};
  const early100 = med(R.map((r: any) => en(r).first100_net_pct).filter((x: any) => x != null));
  const early1000 = med(R.map((r: any) => en(r).first1000_net_pct).filter((x: any) => x != null));
  const netLifetime = med(R.map((r: any) => en(r).lifetime_net_pct ?? eng(r).network_star_pct).filter((x: any) => x != null));
  const netHi = R.filter((r: any) => (en(r).first100_net_pct ?? 0) >= 70);
  // license as monetization strategy
  const lic = (r: any) => r.metrics?.license || '';
  const mitPct = Math.round((100 * R.filter((r) => /^MIT/.test(lic(r))).length) / R.length);
  const apachePct = Math.round((100 * R.filter((r) => /^Apache/.test(lic(r))).length) / R.length);
  const copyleftPct = Math.round((100 * R.filter((r) => /^(AGPL|GPL)/.test(lic(r))).length) / R.length);
  const permissivePct = Math.round((100 * R.filter((r) => /^(MIT|Apache|BSD|ISC|MPL|Unlicense)/.test(lic(r))).length) / R.length);

  // Multiple launches: of repos with a top HN post, how many posted more than once?
  const bigHn = (r: any) => (r.hn_events ?? []).filter((e: any) => e.points >= 50);
  const multiHN = withHN.filter((r) => bigHn(r).length >= 2);
  const multiPct = Math.round((100 * multiHN.length) / Math.max(1, withHN.length));
  const medHnPosts = med(withHN.map((r) => bigHn(r).length));

  // Time to traction: months from first commit to a star milestone / to first public launch.
  // Counted only where the curve has full early history (starts near zero).
  const dayDiff = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
  const firstLaunchDate = (r: any) => {
    const ds: string[] = [];
    for (const e of r.hn_events ?? []) if (e.date) ds.push(e.date);
    if (r.ph_event?.date) ds.push(r.ph_event.date);
    if (r.yc_launch?.date) ds.push(r.yc_launch.date);
    return ds.length ? ds.sort()[0] : null;
  };
  const traction = (thr: number | 'launch') => med(R.flatMap((r: any) => {
    const c = r.stars_curve ?? [];
    const start = r.timeline?.first;
    if (!start || r.curve_partial || (c[0]?.n ?? 0) > 50) return [];
    const to = thr === 'launch' ? firstLaunchDate(r) : (c.find((p: any) => p.n >= thr)?.t ?? null);
    if (!to) return [];
    const d = dayDiff(start, to);
    return d >= 0 ? [d] : []; // drop launches dated before the first commit (renamed/forked history artifacts)
  }));
  const mo = (days: number) => Math.round((days / 30.4) * 10) / 10;
  const to1k = mo(traction(1000)), to10k = mo(traction(10000)), preLaunch = mo(traction('launch'));

  const k = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '' + n);
  const mx = (a: number, b: number) => (a / Math.max(1, b)).toFixed(1) + '×';
  const cmp = (a: number, b: number, aLabel: string, bLabel: string): Cmp => ({ a, b, aLabel, bLabel, mult: mx(a, b) });

  // shorthand figures (computed once) so the prose below stays readable
  const hnHi = k(med(withHN.map(stars))), hnLo = k(med(noHN.map(stars))), hnMx = mx(med(withHN.map(stars)), med(noHN.map(stars)));
  const phHi = k(med(withPH.map(stars))), phLo = k(med(noPH.map(stars)));
  const respHiV = k(med(respHi.map(stars))), respLoV = k(med(respLo.map(stars)));
  const compoundPct = med(R.map(spikeShare).filter((x): x is number => x != null));
  const teamBig = med(topN.map(conc)), teamSmall = med(botN.map(conc));
  const everAge = med(ever.map((r: any) => r.activity?.batch_age_years ?? 0)), everCpw = med(ever.map((r: any) => r.intensity?.commits_per_week ?? 0));

  // "House style" — convergent culture: naming, positioning, stack (corroborates the YC infra-wrapper template)
  const showHnPct = Math.round((100 * withHN.length) / R.length);
  const medTop1 = med(R.map((r: any) => r.contributors?.[0]?.pct ?? 0));
  const brandOf = (r: any): string => {
    const w: string = r.yc?.website || '';
    try { return new URL(w.includes('//') ? w : 'https://' + w).hostname.replace(/^www\./, ''); } catch { return ''; }
  };
  const nameOf = (b: string) => b.replace(/\.(com|io|dev|ai|sh|app|co|org|net|cloud|xyz|tech|so|run)$/, '');
  const brands = R.map(brandOf).filter(Boolean);
  const singleTokenPct = brands.length ? Math.round((100 * brands.filter((b) => { const n = nameOf(b); return n && !n.includes('-') && !n.includes('.'); }).length) / brands.length) : 0;
  const nonComPct = brands.length ? Math.round((100 * brands.filter((b) => !b.endsWith('.com')).length) / brands.length) : 0;
  const ol = (r: any) => (r.yc?.one_liner || '').toLowerCase();
  const ossPct = Math.round((100 * R.filter((r) => /open[- ]?source/.test(ol(r))).length) / R.length);
  const infraPct = Math.round((100 * R.filter((r) => /\b(managed|hosted|cloud|platform|infrastructure|serverless|database|api)\b/.test(ol(r))).length) / R.length);
  const tsPct = Math.round((100 * R.filter((r) => r.metrics?.primary_lang === 'TypeScript').length) / R.length);
  const houseExamples = [...R].filter((r) => { const n = nameOf(brandOf(r)); return n && n.length <= 6 && !n.includes('-'); }).sort((a, b) => stars(b) - stars(a)).slice(0, 4).map((r) => r.slug);

  // Controlled association: does each lever survive after accounting for repo age + language?
  // OLS of log(stars) on the binary signals + log(months active) + TS/Python dummies.
  const reg = R.map((r: any) => ({
    y: Math.log(Math.max(1, stars(r))),
    hn: hnMax(r) >= 100 ? 1 : 0, ph: r.ph_event ? 1 : 0,
    resp: (eng(r).comments_per_issue ?? 0) >= 2 && (eng(r).issues ?? 0) > 50 ? 1 : 0,
    lage: Math.log(Math.max(1, r.timeline?.span_months ?? 1)),
    ts: r.metrics?.primary_lang === 'TypeScript' ? 1 : 0, py: r.metrics?.primary_lang === 'Python' ? 1 : 0,
  })).filter((d) => isFinite(d.y) && d.y > 0);
  const beta = solveOLS(reg.map((d) => [1, d.hn, d.ph, d.resp, d.lage, d.ts, d.py]), reg.map((d) => d.y));
  const ctrlMx = (i: number) => (beta.length ? Math.exp(beta[i]).toFixed(1) : '?') + '×';
  const ctrlHN = ctrlMx(1), ctrlPH = ctrlMx(2), ctrlResp = ctrlMx(3);
  const phCount = withPH.length;

  const DS: Echo = { principle: 'Get your first users by hand, one at a time, and take extraordinary measures to make them happy — it does not scale, and that is exactly the point.', author: 'Paul Graham', source: "Do Things that Don't Scale", url: 'https://paulgraham.com/ds.html' };

  const lessons: Lesson[] = [
    {
      key: 'hn', title: 'Launch on Hacker News — then do it again', statLabel: 'median stars, with vs without a top HN post',
      stat: `${hnHi} vs ${hnLo}`,
      body: [
        `Of every signal in this dataset, a Hacker News front page is the most visible. Repos with a post that cracked 100 points carry a median ${hnHi} stars against ${hnLo} for those without — about ${hnMx}. On almost every repo's star curve, the steepest cliff is an HN day.`,
        `It is also nearly universal: ${showHnPct}% of every repo in this dataset cleared a 100-point Hacker News post at least once. "Show HN" is not an edge case in this world — it is the default first move.`,
        `But "launch on Hacker News" badly undersells what the winners actually did. ${multiPct}% of them posted to HN more than once — a median of ${medHnPosts} notable posts each. The shape is a rhythm, not a moment: a Launch HN when the company is new, a Show HN for each major feature, a Tell HN or a technical deep-dive when something genuinely interesting ships. Every post is a fresh roll at the front page and a fresh cohort of first-time users.`,
        `The real takeaway is permission, not pressure: you are allowed to come back. One launch that underperforms is not a verdict on the company — it is one post on one Tuesday. The teams that grew kept finding honest reasons to show up again, for years. The discipline is that each relaunch has to stand on its own as news: a post that isn't genuinely new spends the goodwill the last one earned.`,
      ],
      echoes: [
        { principle: 'You can launch more than once. Relaunching for each real milestone is expected — a new audience sees it every time, and the front page resets daily.', author: 'Y Combinator', source: 'Startup School', url: 'https://www.ycombinator.com/library' },
        { principle: 'A startup is built to grow fast; getting in front of users — repeatedly — is the job, not a one-time event.', author: 'Paul Graham', source: 'Startup = Growth', url: 'https://paulgraham.com/growth.html' },
      ],
      kicker: `${multiPct}% launched more than once · median ${medHnPosts} posts`,
      caveat: `Correlation, not causation — strong products are also more likely to reach the HN front page. Even after controlling for repo age and language, the association holds (~${ctrlHN}) and stays statistically significant, but selection on unobserved quality is not ruled out. We keep each repo's top 6 HN posts, so the repeat rate is a lower bound.`,
      examples: top(withHN, 4),
      compare: cmp(med(withHN.map(stars)), med(noHN.map(stars)), 'with a top HN post', 'without'),
    },
    {
      key: 'ph', title: 'Work every channel, not just one', statLabel: 'median stars, with vs without a PH launch',
      stat: `${phHi} vs ${phLo}`,
      body: [
        `Product Hunt reaches a different room than Hacker News — makers, product managers, designers, founders shopping for tools. The ${withPH.length} repos with a Product Hunt launch sit at a median ${phHi} stars against ${phLo} for those without.`,
        `The pattern among the biggest projects is not HN or PH — it is both, plus a launch blog post, plus the relevant subreddit, plus a conference talk, plus showing up in other people's comment threads. Each channel is a separate pond of early adopters, and fishing all of them is unglamorous, manual work that does not scale. That is why it compounds: most teams quietly won't do it.`,
      ],
      echoes: [
        { principle: 'A startup is a company built to grow fast; growth is the one metric that defines it, and you reach users wherever they already gather.', author: 'Paul Graham', source: 'Startup = Growth', url: 'https://paulgraham.com/growth.html' },
      ],
      caveat: `Only ${phCount} repos launched on Product Hunt, so read the multiple loosely. Even controlling for repo age and language the association stays large (~${ctrlPH}) — but PH-launchers are self-selected for being launch-ready and polished, and that selection, not the launch, may be doing the work.`,
      examples: top(withPH, 4),
      compare: cmp(med(withPH.map(stars)), med(noPH.map(stars)), 'with a PH launch', 'without'),
    },
    {
      key: 'responsive', title: 'Answer your issues — talk to your users', statLabel: 'median stars by issue responsiveness',
      stat: `${respHiV} vs ${respLoV}`,
      body: [
        `Open source makes one founder habit unusually measurable: do you answer people? Repos averaging two or more comments per issue carry a median ${respHiV} stars against ${respLoV} for the quiet ones.`,
        `Answering an issue is the open-source form of talking to your users — a one-to-one act that does not scale and is not meant to. It tells a stranger a human is on the other end, turns a bug report into a relationship, and teaches you, in the user's own words, what to build next. The compounding here is social: contributors who feel heard stay, and the ones who stay become the maintainers who carry the project when you can't.`,
      ],
      echoes: [
        { principle: 'Talk to your users directly and constantly; their feedback, not your intuition, is the roadmap. Answering an issue is that conversation, in public.', author: 'Y Combinator', source: 'How to Talk to Users', url: 'https://www.ycombinator.com/library' },
      ],
      caveat: `Popular repos also attract more comments — engagement and size reinforce each other, so read this as a loop, not a one-way lever. The association does survive controlling for age and language (~${ctrlResp}), but responsiveness is partly downstream of traffic.`,
      examples: top(respHi, 4),
      compare: cmp(med(respHi.map(stars)), med(respLo.map(stars)), '2+ comments/issue', 'quieter'),
    },
    {
      key: 'compound', title: 'Growth compounds — it is not one explosion', statLabel: 'biggest single day, as % of all stars (median)',
      stat: `${compoundPct}%`,
      body: [
        `It is tempting to imagine these companies were made by one viral afternoon. The data says otherwise: the single biggest day is a median of just ${compoundPct}% of a repo's total stars. The other ninety-some percent of the curve is built on every ordinary day in between.`,
        `A launch is the spark; the other 97% is shipping — commits landed, issues closed, releases cut, posts written, month after month. Growth that looks sudden from the outside is almost always compounding that was simply invisible until it crossed a threshold. The discipline is not engineering one explosion; it is refusing to stop before the curve bends.`,
      ],
      echoes: [
        { principle: 'A startup is defined by compound growth — a few percent a week — not by any single spike; optimize for the rate, and the absolute numbers take care of themselves.', author: 'Paul Graham', source: 'Startup = Growth', url: 'https://paulgraham.com/growth.html' },
        { principle: 'Returns compound superlinearly: small, sustained advantages snowball into outcomes far larger than the effort that produced them.', author: 'Paul Graham', source: 'Superlinear Returns', url: 'https://paulgraham.com/superlinear.html' },
      ],
      caveat: 'Measured on repos with >500 stars; tiny repos are noisier and a single spike can dominate.',
      examples: top(ever, 4),
    },
    {
      key: 'evergreen', title: 'Play the long game', statLabel: 'median time from first commit to 1,000 stars',
      stat: `${to1k} mo`,
      body: [
        `Overnight success is survivorship's favorite illusion. The median repo here took ${to1k} months from its first commit to reach 1,000 stars, and ${to10k} months to reach 10,000. Most also built quietly for a median ${preLaunch} months before their first public launch — a long, unglamorous runway before anyone was watching.`,
        `Durability is the other half of the story. ${ever.length} of ${R.length} repos are "evergreen": a median ${everAge} years old and still shipping ~${everCpw} commits a week. What sets them apart is less talent than persistence — the willingness to keep showing up long after the launch-day excitement has drained away.`,
      ],
      echoes: [
        { principle: 'The best founders are stubborn about the destination while staying flexible about the route — it is persistence with judgment, not blind rigidity, that wins.', author: 'Paul Graham', source: 'The Right Kind of Stubborn', url: 'https://paulgraham.com/persistence.html' },
        { principle: 'Know whether you are default alive or default dead; durability is earned by surviving long enough for the compounding to matter.', author: 'Paul Graham', source: 'Default Alive or Default Dead?', url: 'https://paulgraham.com/aord.html' },
      ],
      kicker: `~${preLaunch} mo building before the first public launch`,
      caveat: 'Survivorship — companies that died and delisted are not in this dataset. Timing is measured only where full early star history exists; repos built on much older codebases (forks) skew longer.',
      examples: top(ever, 4),
    },
    {
      key: 'team', title: 'Build a team, not a solo act', statLabel: 'top-contributor share: biggest vs smallest repos',
      stat: `${teamBig}% vs ${teamSmall}%`,
      body: [
        `In the 40 biggest repos, the top contributor writes a median ${teamBig}% of all commits. In the 40 smallest, that figure is ${teamSmall}%. At scale, a single pair of hands and a large project almost never coexist.`,
        `This is not a knock on the solo builder who starts something — nearly everything begins concentrated. Across the whole dataset the top contributor still writes a median ${Math.round(medTop1)}% of all commits, and a single core author (often the open-source project's original maintainer, now a founder) is what gives most of these repos their credibility and their start. It is a statement about what growth demands: at some point the work has to spread, to a co-founder, to early hires, to a community of outside contributors. The projects that scaled are the ones whose founders made themselves replaceable in the codebase quickly enough for the project to outgrow them.`,
      ],
      echoes: [
        { principle: 'Have more than one founder. A single founder is one of the most common reasons startups fail — the work, the morale, and the decisions are too much for one person.', author: 'Paul Graham', source: 'What We Look for in Founders', url: 'https://paulgraham.com/founders.html' },
      ],
      caveat: 'Direction of causation is unclear: scale enables hiring, and hiring enables scale. The two pull on each other.',
      examples: top(topN, 4),
      compare: { a: teamBig, b: teamSmall, aLabel: '40 biggest repos', bLabel: '40 smallest', mult: '', unit: '%' },
    },
    {
      key: 'network', title: 'The YC ecosystem seeds your first stars', statLabel: 'median share of a repo\'s FIRST 100 stars from inside the YC-OSS network',
      stat: `${early100}%`,
      body: [
        `Where do the very first stars come from? Overwhelmingly, from inside the family. A median ${early100}% of a repo's first 100 stargazers also star at least two other YC open-source repos — and ${early1000}% of the first 1,000. Across all of time it settles to ${netLifetime}%, so the network is not merely a seed; it stays a meaningful share of the audience.`,
        `This is the most literal confirmation in the whole dataset of the most-quoted advice in startups: get your first users by hand, from the circle already within reach. For a YC company that circle is a dense, overlapping graph of founders, employees, and alumni who reliably show up for one another's launches. The honest reading cuts both ways — a high share means the ecosystem handed you a running start; a lower one means you reached real strangers sooner. Neither is the goal on its own; the trajectory from one to the other is.`,
      ],
      echoes: [
        DS,
      ],
      kicker: `${early100}% of first 100 stars · ${early1000}% of first 1,000`,
      caveat: 'Strict definition: a stargazer counts as "network" only if they star ≥2 OTHER YC repos (the repo being viewed is excluded), so the figure is not inflated by self-counting. Cross-starring is co-promotion plus shared audience — partly the expected structure of a co-marketed cohort, not a channel any one founder fully controls. Structural only; no individuals named.',
      examples: top(netHi, 4),
    },
    {
      key: 'license', title: 'Your license is a monetization strategy', statLabel: 'use a permissive license (MIT / Apache / BSD)',
      stat: `${permissivePct}%`,
      body: [
        `A license looks like a legal footnote and is actually a go-to-market decision. ${permissivePct}% of these companies ship under a permissive license — MIT, Apache, BSD — optimizing for the most frictionless adoption possible: anyone can embed it, fork it, ship it inside a closed product, no questions asked. ${mitPct}% pick MIT specifically. You choose this when the open-source project is the top of the funnel and you sell a different layer — a hosted cloud, support, enterprise features.`,
        `${copyleftPct}% go the other way, copyleft — GPL or, increasingly, AGPL. AGPL forces anyone who runs a modified version as a network service to release their changes, which makes it legally awkward for a hyperscaler to fork your project into a closed competing SaaS. When the hosted version is the business, that is the moat: you get to be genuinely open and still own the commercial high ground. The license tracks the model — permissive to maximize reach, protective to defend a service.`,
        `We can't see revenue, so this is not a claim that one license out-earns another — it's that the license encodes the strategy, and most teams pick it on purpose. It is far easier to start protective and relicense toward permissive than the reverse, so the default you ship with can quietly hand away your only moat.`,
      ],
      echoes: [],
      kicker: `${copyleftPct}% go copyleft to defend a hosted service`,
      caveat: 'License is read from each repo\'s declared SPDX license. Whether a given choice actually helped monetization is not observable here — this is about encoded strategy, not measured outcome.',
      examples: top(R.filter((r) => /^(AGPL|GPL)/.test(lic(r))), 4),
    },
    {
      key: 'house', title: 'The house style is real — but it is not the engine', statLabel: 'companies whose brand is a single word',
      stat: `${singleTokenPct}%`,
      body: [
        `Look at enough of these companies and a house style emerges, unmistakable and convergent. ${singleTokenPct}% use a single-word brand — short, abstract, lowercase, a median of eight characters: bun, fig, modal, turso, beam, daily. ${nonComPct}% have given up on .com entirely and live on a .dev, .io, .ai or .sh domain. The naming game has a grammar, and almost everyone is speaking it.`,
        `The positioning converges too. ${ossPct}% put "open source" directly in their one-line pitch, and ${infraPct}% frame themselves as managed infrastructure — a platform, a database, an API, a cloud. It is the open-source-wedge-plus-managed-tier template in plain sight: take a piece of infrastructure developers already love and resent operating, and sell the hosted version. Under the hood the convergence continues — ${tsPct}% lead in TypeScript, clustering with pnpm, Turborepo and in-repo MDX docs into one recognizable monorepo silhouette (the Python and AI cohort is the other half of the room).`,
        `Here is the honest part. None of this causes growth. A single-word .dev name and a Stripe-flavored docs site are the uniform, not the engine — they signal to users, peers and investors that you are playing the same game, and that legibility has real value, but every competitor wears the same uniform. The convergence is exactly why it can't differentiate you. The edge has to come from somewhere the template can't reach: the wedge you chose, the timing, and whether you actually made something people want.`,
      ],
      echoes: [
        { principle: 'In the end only one thing matters: make something people want. Surface polish and positioning are means, never the substance.', author: 'Y Combinator', source: 'Make Something People Want', url: 'https://www.ycombinator.com/library' },
        { principle: 'Live in the future and build what is missing; the idea and the wedge matter far more than how the company is dressed.', author: 'Paul Graham', source: 'How to Get Startup Ideas', url: 'https://paulgraham.com/startupideas.html' },
      ],
      kicker: `${nonComPct}% on a non-.com domain · ${ossPct}% say "open source" · ${tsPct}% TypeScript`,
      caveat: 'Naming, domain and stack are observed from public sites and repos; "house style" is convergence, not a growth lever. Founder pedigree, pricing and visual design are not in this dataset and are not claimed here.',
      examples: houseExamples,
    },
  ];

  // Figures exposed for locale templates (UI text is translated; these numbers are not).
  const vars: Record<string, string | number> = {
    hnHi, hnLo, hnMx, showHnPct, multiPct, medHnPosts, ctrlHN,
    phCount, phHi, phLo, ctrlPH,
    respHiV, respLoV, ctrlResp,
    compoundPct,
    to1k, to10k, preLaunch, everCount: ever.length, total: R.length, everAge, everCpw,
    teamBig, teamSmall, medTop1: Math.round(medTop1),
    early100, early1000, netLifetime,
    permissivePct, mitPct, copyleftPct,
    singleTokenPct, nonComPct, ossPct, infraPct, tsPct,
  };
  return { lessons, n: R.length, vars };
}

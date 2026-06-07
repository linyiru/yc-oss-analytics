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

export interface Cmp { a: number; b: number; aLabel: string; bLabel: string; mult: string; unit?: string }
export interface Lesson { key: string; title: string; stat: string; statLabel: string; lesson: string; caveat: string; examples: string[]; kicker?: string; compare?: Cmp }

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
  const netHi = R.filter((r: any) => (eng(r).network_star_pct ?? 0) >= 75);

  // Multiple launches: of repos with a top HN post, how many posted more than once?
  const bigHn = (r: any) => (r.hn_events ?? []).filter((e: any) => e.points >= 50);
  const multiHN = withHN.filter((r) => bigHn(r).length >= 2);
  const multiPct = Math.round((100 * multiHN.length) / Math.max(1, withHN.length));
  const medHnPosts = med(withHN.map((r) => bigHn(r).length));

  const k = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '' + n);
  const mx = (a: number, b: number) => (a / Math.max(1, b)).toFixed(1) + '×';
  const cmp = (a: number, b: number, aLabel: string, bLabel: string): Cmp => ({ a, b, aLabel, bLabel, mult: mx(a, b) });
  const netMed = med(R.map((r: any) => eng(r).network_star_pct).filter((x: any) => x != null));

  const lessons: Lesson[] = [
    {
      key: 'hn', title: 'Launch on Hacker News', statLabel: 'median stars, with vs without a top HN post',
      stat: `${k(med(withHN.map(stars)))} vs ${k(med(noHN.map(stars)))}`,
      lesson: `Repos with a Hacker News post that cracked 100+ points carry a median ${k(med(withHN.map(stars)))} stars — roughly ${mx(med(withHN.map(stars)), med(noHN.map(stars)))} those without. But the real lesson is repetition: ${multiPct}% of them posted to HN more than once (a median of ${medHnPosts} notable posts each). Winners don't launch once — they relaunch every milestone: Launch HN, then Show HN for each big feature, then Tell HN.`,
      kicker: `${multiPct}% launched more than once · median ${medHnPosts} posts`,
      caveat: 'Correlation, not causation — strong products are also more likely to reach the HN front page. We store each repo\'s top 6 HN posts, so the repeat rate is a lower bound.',
      examples: top(withHN, 4),
      compare: cmp(med(withHN.map(stars)), med(noHN.map(stars)), 'with a top HN post', 'without'),
    },
    {
      key: 'ph', title: 'Launch on Product Hunt too', statLabel: 'median stars, with vs without a PH launch',
      stat: `${k(med(withPH.map(stars)))} vs ${k(med(noPH.map(stars)))}`,
      lesson: `The ${withPH.length} repos with a Product Hunt launch sit at a median ${k(med(withPH.map(stars)))} stars. HN and PH reach different crowds; the biggest projects did both.`,
      caveat: 'Heavy selection bias — bigger, more polished products are the ones that bother with PH.',
      examples: top(withPH, 4),
      compare: cmp(med(withPH.map(stars)), med(noPH.map(stars)), 'with a PH launch', 'without'),
    },
    {
      key: 'responsive', title: 'Answer your issues', statLabel: 'median stars by issue responsiveness',
      stat: `${k(med(respHi.map(stars)))} vs ${k(med(respLo.map(stars)))}`,
      lesson: `Repos averaging 2+ comments per issue carry a median ${k(med(respHi.map(stars)))} stars versus ${k(med(respLo.map(stars)))} for quiet ones. Showing up in the issue tracker compounds: contributors stay, users trust, momentum holds.`,
      caveat: 'Popular repos also attract more comments — engagement and size reinforce each other.',
      examples: top(respHi, 4),
      compare: cmp(med(respHi.map(stars)), med(respLo.map(stars)), '2+ comments/issue', 'quieter'),
    },
    {
      key: 'compound', title: 'Growth compounds — it is not one explosion', statLabel: 'biggest single day, as % of all stars (median)',
      stat: `${med(R.map(spikeShare).filter((x): x is number => x != null))}%`,
      lesson: `The single biggest day is a median of just ${med(R.map(spikeShare).filter((x): x is number => x != null))}% of a repo's stars. The launch lights the fuse, but the curve is built by staying shipped — months of steady commits, not one viral afternoon.`,
      caveat: 'Measured on repos with >500 stars; tiny repos are noisier.',
      examples: top(ever, 4),
    },
    {
      key: 'evergreen', title: 'Play the long game', statLabel: 'evergreen repos (old cohort, still very active)',
      stat: `${ever.length} / ${R.length}`,
      lesson: `${ever.length} of ${R.length} repos are "evergreen" — a median ${med(ever.map((r: any) => r.activity?.batch_age_years ?? 0))} years old and still shipping ~${med(ever.map((r: any) => r.intensity?.commits_per_week ?? 0))} commits/week. Durability comes from sustained cadence, not a fast start.`,
      caveat: 'Survivorship — companies that died and delisted are not in this dataset.',
      examples: top(ever, 4),
    },
    {
      key: 'team', title: 'Build a team, not a solo act', statLabel: 'top-contributor share: biggest vs smallest repos',
      stat: `${med(topN.map(conc))}% vs ${med(botN.map(conc))}%`,
      lesson: `In the 40 biggest repos the top contributor writes a median ${med(topN.map(conc))}% of commits; in the 40 smallest it's ${med(botN.map(conc))}%. Spreading the work — onboarding maintainers and external contributors — tracks with scale.`,
      caveat: 'Direction of causation is unclear: scale enables hiring, and hiring enables scale.',
      examples: top(topN, 4),
      compare: { a: med(topN.map(conc)), b: med(botN.map(conc)), aLabel: '40 biggest repos', bLabel: '40 smallest', mult: '', unit: '%' },
    },
    {
      key: 'network', title: 'The YC ecosystem is a launch channel', statLabel: 'median share of stars from the YC-OSS network',
      stat: `${med(netHi.length ? R.map((r: any) => eng(r).network_star_pct).filter((x: any) => x != null) : [0])}%`,
      lesson: `A median ${med(R.map((r: any) => eng(r).network_star_pct).filter((x: any) => x != null))}% of a repo's stargazers also star other YC open-source repos — a tight, overlapping audience. The YC network is real early distribution; tap it, but know a low share means you reached beyond the bubble.`,
      caveat: 'Derived structurally from cross-starring; not a roster of individuals.',
      examples: top(netHi, 4),
    },
  ];
  return { lessons, n: R.length };
}

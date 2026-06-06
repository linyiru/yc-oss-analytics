import { Bar } from 'react-chartjs-2';
import { grid, tick } from './setup';

const PALETTE = ['#7c5cff', '#3fb950', '#d29922', '#58a6ff', '#f85149', '#db61a2', '#39c5cf', '#a371f7', '#6e7681'];

export interface YearBucket {
  year: number; count: number; langs: Record<string, number>; aiAdoptionPct: number;
}

export default function LangTrends({ years, languages }: { years: YearBucket[]; languages: string[] }) {
  if (!years?.length) return <div style={{ color: '#8b949e', fontSize: 13 }}>Not enough data yet.</div>;
  const labels = years.map((y) => `'${String(y.year).slice(2)}`);
  return (
    <Bar
      height={300}
      data={{
        labels,
        datasets: languages.map((lang, i) => ({
          label: lang,
          data: years.map((y) => Math.round((y.langs[lang] ?? 0) * 100)),
          backgroundColor: lang === 'Other' ? '#30363d' : PALETTE[i % PALETTE.length],
          stack: 'lang',
        })),
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${c.raw}%` } },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: tick, title: { display: true, text: 'YC batch year', color: '#8b949e' } },
          y: { stacked: true, grid, ticks: { ...tick, callback: (v: any) => v + '%' }, max: 100, title: { display: true, text: 'language share', color: '#8b949e' } },
        },
      }}
    />
  );
}

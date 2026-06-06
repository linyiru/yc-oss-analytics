import { Bubble } from 'react-chartjs-2';
import { grid, tick } from './setup';

const CLASS_COLOR: Record<string, string> = {
  evergreen: '#2ea043', rising: '#7c5cff', steady: '#d29922', dormant: '#8b949e',
};

export interface Pt { slug: string; x: number; y: number; stars: number; cls: string; name: string }

export default function Scatter({ points }: { points: Pt[] }) {
  const byClass: Record<string, Pt[]> = {};
  for (const p of points) (byClass[p.cls] ||= []).push(p);
  return (
    <Bubble
      height={300}
      data={{
        datasets: Object.entries(byClass).map(([cls, pts]) => ({
          label: cls,
          data: pts.map((p) => ({ x: p.x, y: p.y, r: Math.max(4, Math.min(26, Math.sqrt(p.stars) / 12)), slug: p.slug, name: p.name, stars: p.stars } as any)),
          backgroundColor: (CLASS_COLOR[cls] || '#888') + 'cc',
        })),
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        onClick: (_e, els, chart) => {
          const el = els[0]; if (!el) return;
          const d: any = (chart.data.datasets[el.datasetIndex].data as any)[el.index];
          if (d?.slug) window.location.href = `./${d.slug}`;
        },
        plugins: {
          legend: { labels: { boxWidth: 12, usePointStyle: true } },
          tooltip: { callbacks: { label: (c: any) => `${c.raw.name}: ${c.raw.stars.toLocaleString()}★  (age ${c.raw.x}y, live ${c.raw.y})` } },
        },
        scales: {
          x: { grid, ticks: tick, title: { display: true, text: 'years since YC batch', color: '#8b949e' } },
          y: { grid, ticks: tick, min: 0, max: 100, title: { display: true, text: 'liveness', color: '#8b949e' } },
        },
      }}
    />
  );
}

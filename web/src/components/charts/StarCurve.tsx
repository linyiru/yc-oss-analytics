import { Line } from 'react-chartjs-2';
import { grid, tick } from './setup';

export default function StarCurve({ points, color = '#7c5cff' }: { points: { t: string; n: number }[]; color?: string }) {
  if (!points?.length) return <div style={{ color: '#8b949e', fontSize: 13 }}>No star data yet.</div>;
  return (
    <Line
      height={120}
      data={{
        labels: points.map((p) => p.t),
        datasets: [{ data: points.map((p) => p.n), borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.25, pointRadius: 0, borderWidth: 2 }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid, ticks: { ...tick, maxTicksLimit: 8 } }, y: { grid, ticks: tick } },
      }}
    />
  );
}

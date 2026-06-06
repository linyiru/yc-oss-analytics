import { Bar } from 'react-chartjs-2';
import { grid, tick } from './setup';

export default function Churn({ data, addLabel, delLabel }: { data: { m: string; add: number; del: number }[]; addLabel: string; delLabel: string }) {
  if (!data?.length) return null;
  return (
    <Bar
      height={180}
      data={{
        labels: data.map((d) => d.m.slice(2)),
        datasets: [
          { label: addLabel, data: data.map((d) => d.add), backgroundColor: '#2ea04388' },
          { label: delLabel, data: data.map((d) => -d.del), backgroundColor: '#f8514988' },
        ],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12 } } },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { ...tick, maxTicksLimit: 12 } }, y: { stacked: true, grid, ticks: tick } },
      }}
    />
  );
}

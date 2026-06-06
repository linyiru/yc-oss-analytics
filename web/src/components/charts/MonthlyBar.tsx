import { Bar } from 'react-chartjs-2';
import { grid, tick } from './setup';

export default function MonthlyBar({ data, color = '#7c5cff' }: { data: { m: string; c: number }[]; color?: string }) {
  if (!data?.length) return null;
  return (
    <Bar
      height={170}
      data={{ labels: data.map((d) => d.m.slice(2)), datasets: [{ data: data.map((d) => d.c), backgroundColor: color }] }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { ...tick, maxTicksLimit: 12 } }, y: { grid, ticks: tick } },
      }}
    />
  );
}

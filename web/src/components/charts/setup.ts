import {
  Chart, LineController, BarController, BubbleController,
  LineElement, PointElement, BarElement, LinearScale, CategoryScale,
  TimeScale, Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(
  LineController, BarController, BubbleController,
  LineElement, PointElement, BarElement, LinearScale, CategoryScale, TimeScale,
  Tooltip, Legend, Filler,
);
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "-apple-system,'PingFang TC',sans-serif";

export const grid = { color: '#21262d' };
export const tick = { color: '#8b949e', font: { size: 10 } };

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip);

/** Theme colors (match :root --primary-navy / --accent-teal in index.css). */
export const CHART_COLORS = {
  navy: '#0b2545',
  teal: '#139a8c',
  tealFill: 'rgba(19, 154, 140, 0.12)',
  grid: 'rgba(148, 163, 184, 0.18)',
  axis: '#64748b',
};

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Compact Indian notation for axis ticks: 250000 -> ₹2.5L, 45000 -> ₹45K */
export const inrCompact = (n: number) => {
  const v = Math.round(n || 0);
  if (v >= 1e7) return `₹${+(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${+(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${+(v / 1e3).toFixed(1)}K`;
  return `₹${v}`;
};

/** Shared, recessive axes + hover tooltip for single-series charts (no legend: the card title names the series). */
export const baseOptions = (
  formatValue: (n: number) => string,
  formatTick: (n: number) => string = formatValue,
): ChartOptions<'bar' | 'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: CHART_COLORS.navy,
      padding: 10,
      displayColors: false,
      callbacks: { label: (ctx) => formatValue(Number(ctx.parsed.y ?? ctx.parsed.x ?? 0)) },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: CHART_COLORS.axis, font: { size: 11 }, maxRotation: 0, autoSkip: true },
    },
    y: {
      beginAtZero: true,
      grid: { color: CHART_COLORS.grid },
      border: { display: false },
      ticks: {
        color: CHART_COLORS.axis,
        font: { size: 11 },
        maxTicksLimit: 5,
        precision: 0,
        callback: (v) => formatTick(Number(v)),
      },
    },
  },
});

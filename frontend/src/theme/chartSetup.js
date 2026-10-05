import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export const chartTextColor = '#64748B';
export const chartGridColor = '#F1F5F9';

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartTextColor, font: { family: 'Inter', size: 11 } },
    },
    tooltip: {
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#F8FAFC',
      bodyColor: '#CBD5E1',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      ticks: { color: chartTextColor, font: { family: 'Inter', size: 11 } },
      grid: { color: 'transparent' },
    },
    y: {
      ticks: { color: chartTextColor, font: { family: 'Inter', size: 11 } },
      grid: { color: chartGridColor },
    },
  },
};

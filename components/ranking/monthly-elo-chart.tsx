'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MonthlyEloData } from '@/lib/elo/reconstruct-monthly-history';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyEloChartProps {
  data: MonthlyEloData;
}

export function MonthlyEloChart({ data }: MonthlyEloChartProps) {
  if (!data || data.players.length === 0) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-base font-medium leading-normal">Points Evolution</p>
            <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight truncate">-</p>
          </div>
        </div>
        <div className="flex min-h-[300px] flex-1 flex-col gap-4 pt-4 items-center justify-center">
          <p className="text-gray-500 text-sm">No match data available</p>
        </div>
      </div>
    );
  }

  // Build datasets for each player
  const datasets = data.players.map((player) => {
    const playerData = data.months.map((month) => {
      const point = player.data.find((p) => p.month === month);
      return point ? point.elo : null;
    });

    // Check if player has data in the current (partial) month
    const hasPartialData = player.data.some((p) => p.isPartial);
    const lastMonthIndex = data.months.length - 1;

    return {
      label: player.playerName,
      data: playerData,
      borderColor: player.color,
      backgroundColor: player.color,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
      // Dashed line ONLY for the segment going to the partial (current) month
      segment: hasPartialData
        ? {
            borderDash: (ctx: any) => {
              // p1DataIndex is the index of the end point of the segment
              // Only dash the very last segment (the one ending at current month)
              return ctx.p1DataIndex === lastMonthIndex ? [5, 5] : undefined;
            },
          }
        : undefined,
    };
  });

  const chartData: ChartData<'line'> = {
    labels: data.months,
    datasets,
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#ffffff',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: ${Math.round(value)} pts`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          stepSize: 50,
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-base font-medium leading-normal">Points Evolution</p>
          <p className="text-gray-500 text-sm">{data.players.length} players</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex min-h-[350px] flex-1 flex-col gap-4 pt-4">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

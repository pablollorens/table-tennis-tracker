'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { EloHistoryStats } from '@/lib/elo/reconstruct-history';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface EloHistoryChartProps {
  eloHistory: EloHistoryStats | null;
}

export function EloHistoryChart({ eloHistory }: EloHistoryChartProps) {
  if (!eloHistory || eloHistory.history.length === 0) {
    return (
      <div className="px-4 pt-6">
        <div className="flex w-full flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-base font-medium leading-normal">Points History</p>
              <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight truncate">-</p>
            </div>
          </div>
          <div className="flex min-h-[180px] flex-1 flex-col gap-4 pt-4 items-center justify-center">
            <p className="text-gray-500 text-sm">No matches yet</p>
          </div>
        </div>
      </div>
    );
  }

  const { history, highestElo, lowestElo, lifetimeChange, currentElo } = eloHistory;

  // Format lifetime change with color
  const lifetimeChangeColor = lifetimeChange >= 0 ? 'text-green-500' : 'text-red-500';
  const lifetimeChangeText = lifetimeChange >= 0 ? `+${lifetimeChange}` : `${lifetimeChange}`;

  // Prepare chart data
  const chartData = {
    labels: history.map(point => point.date),
    datasets: [
      {
        label: 'Points',
        data: history.map(point => point.elo),
        fill: true,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(19, 127, 236, 0.05)');
          gradient.addColorStop(1, 'rgba(19, 127, 236, 0)');
          return gradient;
        },
        borderColor: '#137fec',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: '#137fec',
        pointRadius: (context: ScriptableContext<'line'>) => {
          const index = context.dataIndex;
          const data = context.dataset.data as number[];
          const value = data[index];
          // Show points only on highest/lowest values
          return value === highestElo || value === lowestElo ? 5 : 0;
        },
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#137fec',
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `Points: ${context.parsed.y}`;
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
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          // @ts-ignore - Chart.js types don't recognize borderDash
          borderDash: [5, 5],
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          stepSize: 100,
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex w-full flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-base font-medium leading-normal">Points History</p>
            <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight truncate">
              {currentElo}
            </p>
          </div>
          <div className="flex gap-1 items-baseline">
            <p className={`text-sm font-medium leading-normal ${lifetimeChangeColor}`}>
              {lifetimeChangeText} pts
            </p>
            <p className="text-gray-500 text-sm font-normal leading-normal">all time</p>
          </div>
        </div>

        {/* Chart */}
        <div className="flex min-h-[180px] flex-1 flex-col gap-4 pt-4">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useMonthlyEloData } from '@/hooks/use-monthly-elo-data';
import { MonthlyEloChart } from '@/components/ranking/monthly-elo-chart';

export default function EvolutionPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();
  const { data, loading: dataLoading, error } = useMonthlyEloData();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    // Redirect inactive users to profile
    if (!playerLoading && player && !player.isActive) {
      router.push('/profile');
    }
  }, [router, playerLoading, player]);

  const loading = playerLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200/50 px-4 py-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard/ranking')}
            className="text-gray-800 flex size-12 shrink-0 items-center justify-center -ml-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em]">
              Points Evolution
            </h2>
          </div>

          {/* Spacer for header balance */}
          <div className="size-12 shrink-0" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-gray-900 text-lg font-semibold">Error loading data</div>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </div>
        ) : (
          <MonthlyEloChart data={data} />
        )}
      </main>

      {/* Bottom padding for mobile nav */}
      <div className="h-24" />
    </div>
  );
}

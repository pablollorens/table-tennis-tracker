'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { Leaderboard } from '@/components/ranking/leaderboard';
import { Trophy, TrendingUp } from 'lucide-react';

export default function RankingPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();

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

  if (playerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/ranking/evolution')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Evolution</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Leaderboard />
      </main>
    </div>
  );
}

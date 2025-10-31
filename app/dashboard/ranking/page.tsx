'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { Leaderboard } from '@/components/ranking/leaderboard';
import { Trophy } from 'lucide-react';

export default function RankingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 safe-top">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">Leaderboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Leaderboard />
      </main>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();
  const { session, loading: sessionLoading } = useCurrentSession();

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

  if (playerLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMM d');
  const completionPercent = session
    ? Math.round((session.completedMatches / session.totalMatches) * 100)
    : 0;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-gray-50">
      <div className="mx-auto max-w-md w-full">
        {/* Header */}
        <div className="flex items-center p-4 pb-2 justify-between bg-gray-50">
          <h1 className="text-xl font-bold text-slate-900 flex-1">Ping Pong Tracker</h1>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-500" />
            <p className="text-slate-600 text-sm font-medium">{today}</p>
          </div>
        </div>

        {/* Content */}
        {!session ? (
          // No Session State
          <div className="p-4">
            <Card className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-4xl">🏓</span>
              </div>
              {/* Text */}
              <div className="flex flex-col gap-1">
                <h2 className="text-slate-900 text-2xl font-bold">Ready to Play?</h2>
                <p className="text-slate-600">No session has been created for today.</p>
              </div>
              {/* Button */}
              <div className="flex w-full pt-2">
                <Link href="/dashboard/player-selection" className="w-full">
                  <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                    Create Today&apos;s Session
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          // Session Active State
          <div className="p-4">
            <Card className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Headline */}
              <h2 className="text-slate-900 tracking-tight text-2xl font-bold leading-tight text-left">
                Today&apos;s Session
              </h2>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-lg p-4 bg-slate-100">
                  <p className="text-slate-600 text-sm font-medium leading-normal">Total Matches</p>
                  <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
                    {session.totalMatches}
                  </p>
                </div>
                <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-lg p-4 bg-slate-100">
                  <p className="text-slate-600 text-sm font-medium leading-normal">Completed</p>
                  <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
                    {session.completedMatches}
                  </p>
                </div>
                <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-lg p-4 bg-slate-100">
                  <p className="text-slate-600 text-sm font-medium leading-normal">Pending</p>
                  <p className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
                    {session.pendingMatches}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-6 justify-between items-center">
                  <p className="text-slate-900 text-base font-medium leading-normal">Completion</p>
                  <p className="text-slate-600 text-sm font-normal leading-normal">
                    {session.completedMatches}/{session.totalMatches}
                  </p>
                </div>
                <div className="w-full rounded-full bg-slate-200 h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Button */}
              <div className="flex pt-2">
                <Link href="/dashboard/today" className="w-full">
                  <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                    View Today&apos;s Matches
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Spacer for bottom nav */}
        <div className="h-24" />

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

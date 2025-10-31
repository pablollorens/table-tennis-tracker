'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ping Pong Tracker</h1>
          <p className="text-sm text-gray-600">{today}</p>
        </div>
      </div>

      {/* Today's Session Card */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Today&apos;s Session</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏓</div>
          <h3 className="text-lg font-semibold mb-2">Ready to Play?</h3>
          <p className="text-gray-600 mb-6">
            No session has been created for today.
          </p>
          <Link href="/dashboard/player-selection">
            <Button className="w-full h-12 text-base">
              Create Today&apos;s Session
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

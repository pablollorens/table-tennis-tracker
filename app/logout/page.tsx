'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthState } from '@/lib/firebase/auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear authentication state
    clearAuthState();

    // Redirect to home page after a brief delay
    setTimeout(() => {
      router.push('/');
    }, 500);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-xl font-semibold text-gray-700 mb-2">
          Logging out...
        </div>
        <div className="text-sm text-gray-500">
          You will be redirected shortly
        </div>
      </div>
    </div>
  );
}

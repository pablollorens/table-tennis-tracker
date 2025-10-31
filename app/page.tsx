'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordGate } from '@/components/auth/password-gate';
import { isAuthenticated } from '@/lib/firebase/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return <PasswordGate />;
}

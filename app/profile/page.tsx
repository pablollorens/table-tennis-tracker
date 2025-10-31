'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearAuthState } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { ProfileForm } from '@/components/profile/profile-form';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { player, loading } = useCurrentPlayer();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Player not found</div>
      </div>
    );
  }

  const handleSuccess = () => {
    if (!player.isActive) {
      // First time activation - redirect to dashboard
      router.push('/dashboard');
    } else {
      // Just saved changes - show success toast
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
        duration: 3000,
      });
    }
  };

  const handleLogout = () => {
    clearAuthState();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
      duration: 2000,
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 safe-top">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">
            {player.isActive ? 'Edit Profile' : 'Complete Your Profile'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {!player.isActive && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Complete your profile to start playing matches!
            </p>
          </div>
        )}

        <ProfileForm player={player} onSuccess={handleSuccess} />

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </main>

      {/* Bottom Navigation - Only show for active users */}
      {player.isActive && <BottomNav />}
    </div>
  );
}

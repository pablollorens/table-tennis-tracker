'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/firebase/messaging';
import { enablePlayerNotifications, disablePlayerNotifications } from '@/lib/firebase/players';
import toast from 'react-hot-toast';

interface NotificationToggleProps {
  playerId: string;
  initialEnabled: boolean;
}

export function NotificationToggle({ playerId, initialEnabled }: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);

    try {
      if (checked) {
        // Request permission and get FCM token
        const token = await requestNotificationPermission();

        if (!token) {
          toast.error('Please enable notifications in your browser settings', {
            duration: 5000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        // Save to Firestore
        await enablePlayerNotifications(playerId, token);
        setEnabled(true);

        toast.success("You'll receive daily reminders at 12:40", {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        // Disable notifications
        await disablePlayerNotifications(playerId);
        setEnabled(false);

        toast.success('Daily reminders disabled', {
          duration: 2000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('[NotificationToggle] Error:', error);
      toast.error('Failed to update notification settings', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        <Label
          htmlFor="notifications"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
        >
          {enabled ? (
            <Bell className="w-4 h-4 text-blue-600" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}
          Daily Match Reminders
        </Label>
      </div>
      <p className="text-xs text-gray-500 ml-6">
        Get notified at 12:40 to play your daily match
      </p>
    </div>
  );
}

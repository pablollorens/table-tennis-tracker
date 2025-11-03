'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Player } from '@/types';
import { updatePlayerProfile, updatePlayerAvatar } from '@/lib/firebase/players';
import { ImageUpload } from '@/components/ui/image-upload';
import { NotificationToggle } from '@/components/profile/notification-toggle';
import toast from 'react-hot-toast';

interface ProfileFormProps {
  player: Player;
  onSuccess?: () => void;
}

export function ProfileForm({ player, onSuccess }: ProfileFormProps) {
  const [name, setName] = useState(player.name || '');
  const [email, setEmail] = useState(player.email || '');
  const [avatar, setAvatar] = useState(player.avatar);
  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length >= 2 && email.includes('@');
  const buttonText = player.isActive ? 'Save Changes' : 'Save & Activate';

  const handleImageUpload = async (url: string) => {
    setAvatar(url);

    // Auto-save avatar to Firestore
    try {
      await updatePlayerAvatar(player.id, url);
      console.log('[ProfileForm] Avatar auto-saved to Firestore:', url);
    } catch (err) {
      console.error('[ProfileForm] Failed to auto-save avatar:', err);
      toast.error('Avatar uploaded but failed to save to profile', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const handleImageError = (error: Error) => {
    // Error is already shown by ImageUpload component via toast
    console.error('Image upload error:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setSaving(true);

    try {
      await updatePlayerProfile(player.id, {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar || undefined
      });

      toast.success('Profile saved successfully!', {
        duration: 3000,
        position: 'top-center',
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to save profile: ${errorMessage}`, {
        duration: 5000,
        position: 'top-center',
      });
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <ImageUpload
        playerId={player.id}
        currentImageUrl={avatar}
        onUploadComplete={handleImageUpload}
        onUploadError={handleImageError}
      />

      {/* Nickname (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={player.nickname}
          disabled
          className="bg-gray-50"
        />
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name<span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player's full name"
          required
          minLength={2}
          maxLength={50}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email<span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter player's email"
          required
        />
      </div>

      {/* Notifications Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
        <NotificationToggle
          playerId={player.id}
          initialEnabled={player.notificationEnabled ?? false}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || saving}
        className="w-full h-14 text-base"
      >
        {saving ? 'Saving...' : buttonText}
      </Button>
    </form>
  );
}

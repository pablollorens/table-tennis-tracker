'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Player } from '@/types';
import { updatePlayerProfile } from '@/lib/firebase/players';
import { Camera } from 'lucide-react';

interface ProfileFormProps {
  player: Player;
  onSuccess?: () => void;
}

export function ProfileForm({ player, onSuccess }: ProfileFormProps) {
  const [name, setName] = useState(player.name || '');
  const [email, setEmail] = useState(player.email || '');
  const [avatar, setAvatar] = useState(player.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2 && email.includes('@');
  const buttonText = player.isActive ? 'Save Changes' : 'Save & Activate';

  // For now, photo upload is disabled - we'll use emoji/initials
  // TODO: Implement photo upload functionality
  const handlePhotoClick = () => {
    // Placeholder for future photo upload
    console.log('Photo upload not yet implemented');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      await updatePlayerProfile(player.id, {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar || undefined
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save profile: ${errorMessage}`);
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-2xl">
            {avatar}
          </div>
          <button
            type="button"
            onClick={handlePhotoClick}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">Tap to add photo</p>
      </div>

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

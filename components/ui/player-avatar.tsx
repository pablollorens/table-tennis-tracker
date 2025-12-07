'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface PlayerAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Player ID - if provided with linkToProfile, avatar becomes clickable */
  playerId?: string;
  /** Enable navigation to player profile on click */
  linkToProfile?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-28 h-28 text-2xl',  // 112px for player stats page
  xl: 'w-32 h-32 text-3xl',
};

export function PlayerAvatar({
  avatar,
  name,
  size = 'md',
  className = '',
  playerId,
  linkToProfile = false,
}: PlayerAvatarProps) {
  const router = useRouter();

  // Check if avatar is a valid image URL
  const isValidUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'));

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClass = sizeClasses[size];
  const isClickable = linkToProfile && playerId;

  const handleClick = () => {
    if (isClickable) {
      router.push(`/dashboard/players/${playerId}`);
    }
  };

  const clickableClasses = isClickable
    ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 transition-all active:scale-95'
    : '';

  if (isValidUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden bg-blue-100 relative ${clickableClasses} ${className}`}
        onClick={handleClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
        title={isClickable ? `View ${name}'s profile` : undefined}
      >
        <Image
          src={avatar}
          alt={name || 'Player avatar'}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold ${clickableClasses} ${className}`}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
      title={isClickable ? `View ${name}'s profile` : undefined}
    >
      {getInitials()}
    </div>
  );
}

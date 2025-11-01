import Image from 'next/image';

interface PlayerAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-32 h-32 text-3xl',
};

export function PlayerAvatar({ avatar, name, size = 'md', className = '' }: PlayerAvatarProps) {
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

  if (isValidUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-blue-100 relative ${className}`}>
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
    <div className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold ${className}`}>
      {getInitials()}
    </div>
  );
}

import { getProbabilityLevel } from '@/lib/elo/probability';

interface WinProbabilityBadgeProps {
  probability: number;
  className?: string;
}

/**
 * Badge component displaying win probability percentage
 * Color-coded based on probability level:
 * - Favorite (>52%): Blue
 * - Underdog (<48%): Gray
 * - Even (48-52%): Gray
 */
export function WinProbabilityBadge({
  probability,
  className = ''
}: WinProbabilityBadgeProps) {
  const level = getProbabilityLevel(probability);

  // Styling based on probability level
  const baseClasses = 'flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors';
  const levelClasses = {
    favorite: 'bg-blue-500/10 text-blue-600',
    underdog: 'bg-gray-500/10 text-gray-600',
    even: 'bg-gray-500/10 text-gray-600',
  };

  return (
    <div className={`${baseClasses} ${levelClasses[level]} ${className}`}>
      {probability}%
    </div>
  );
}

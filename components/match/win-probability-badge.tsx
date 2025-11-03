interface WinProbabilityBadgeProps {
  probability: number;
  expectedPoints: number;
  className?: string;
}

/**
 * Display win probability and expected points gain
 * Shows: "55% 💰+12"
 */
export function WinProbabilityBadge({
  probability,
  expectedPoints,
  className = ''
}: WinProbabilityBadgeProps) {
  return (
    <p className={`text-sm font-normal leading-normal text-slate-600 ${className}`}>
      {probability}% 💰+{expectedPoints}
    </p>
  );
}

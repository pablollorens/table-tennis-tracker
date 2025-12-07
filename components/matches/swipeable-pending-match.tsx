'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { WinProbabilityBadge } from '@/components/match/win-probability-badge';
import { Match } from '@/types';
import { Trash2 } from 'lucide-react';

interface SwipeablePendingMatchProps {
  match: Match;
  onRecordResult: (match: Match) => void;
  onDelete: (matchId: string) => void;
}

export function SwipeablePendingMatch({ match, onRecordResult, onDelete }: SwipeablePendingMatchProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useMotionValue(0);
  const deleteThreshold = -100; // Swipe 100px left to reveal delete button

  // Transform for delete button opacity (appears when swiping left)
  const deleteButtonOpacity = useTransform(
    x,
    [deleteThreshold, 0],
    [1, 0]
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped significantly left, keep it open
    if (info.offset.x < deleteThreshold) {
      x.set(deleteThreshold);
    } else {
      // Otherwise snap back to closed
      x.set(0);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    // Wait for fade out animation
    setTimeout(async () => {
      await onDelete(match.id);
    }, 300);
  };

  const handleCloseSwipe = () => {
    x.set(0);
  };

  return (
    <div className="relative mb-4 overflow-hidden">
      {/* Delete Button Background */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 bg-red-500 rounded-xl"
        style={{ opacity: deleteButtonOpacity, width: '100%' }}
      >
        <button
          onClick={handleDelete}
          className="flex items-center text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          aria-label="Delete match"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Swipeable Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: deleteThreshold, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onClick={handleCloseSwipe}
        animate={isDeleting ? { opacity: 0, x: -300 } : {}}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Card className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm cursor-grab active:cursor-grabbing">
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 */}
            <div className="flex flex-1 items-start gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <PlayerAvatar
                  avatar={match.player1.avatar}
                  name={match.player1.name}
                  size="sm"
                  playerId={match.player1.id}
                  linkToProfile
                />
              </div>
              <div className="flex flex-col justify-between min-h-[52px]">
                <p className="text-base font-bold leading-tight">
                  {match.player1.name}
                </p>
                {match.player1.winProbability !== undefined && match.player1.expectedPoints !== undefined ? (
                  <WinProbabilityBadge
                    probability={match.player1.winProbability}
                    expectedPoints={match.player1.expectedPoints}
                  />
                ) : (
                  <p className="text-sm font-normal leading-normal text-slate-600">
                    Points: {match.player1.eloBefore}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm font-bold text-slate-500">vs</p>

            {/* Player 2 */}
            <div className="flex flex-1 items-start justify-end gap-3 text-right">
              <div className="flex flex-col justify-between min-h-[52px]">
                <p className="text-base font-bold leading-tight">
                  {match.player2.name}
                </p>
                {match.player2.winProbability !== undefined && match.player2.expectedPoints !== undefined ? (
                  <WinProbabilityBadge
                    probability={match.player2.winProbability}
                    expectedPoints={match.player2.expectedPoints}
                  />
                ) : (
                  <p className="text-sm font-normal leading-normal text-slate-600">
                    Points: {match.player2.eloBefore}
                  </p>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <PlayerAvatar
                  avatar={match.player2.avatar}
                  name={match.player2.name}
                  size="sm"
                  playerId={match.player2.id}
                  linkToProfile
                />
              </div>
            </div>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onRecordResult(match);
            }}
            className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700"
          >
            Record Result
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

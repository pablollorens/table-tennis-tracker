'use client';

import { useState } from 'react';
import { Dialog, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Match } from '@/types';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface MatchResultModalProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (matchId: string, player1Score: number, player2Score: number) => Promise<void>;
}

export function MatchResultModal({ match, open, onClose, onSubmit }: MatchResultModalProps) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeScorePicker, setActiveScorePicker] = useState<'player1' | 'player2' | null>(null);

  if (!match) return null;

  const handleScoreSelect = (score: number) => {
    if (activeScorePicker === 'player1') {
      setPlayer1Score(score);
    } else if (activeScorePicker === 'player2') {
      setPlayer2Score(score);
    }
    setActiveScorePicker(null);
  };

  const handleSubmit = async () => {
    if (player1Score === player2Score) {
      alert('Scores cannot be equal. There must be a winner.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(match.id, player1Score, player2Score);
      // Reset scores
      setPlayer1Score(0);
      setPlayer2Score(0);
      setActiveScorePicker(null);
      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Failed to save result. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        {/* Custom overlay with lighter opacity */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Bottom sheet content */}
        <DialogPrimitive.Content className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-xl border-0 p-0 max-w-full duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom focus:outline-none">
          {/* Handle */}
          <button
            onClick={onClose}
            className="flex h-5 w-full items-center justify-center pt-3"
          >
            <div className="h-1 w-9 rounded-full bg-gray-300" />
          </button>

        {/* Header */}
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex w-12 shrink-0 items-center" />
          <DialogTitle className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-gray-900">
            Log Match Result
          </DialogTitle>
          <div className="flex w-12 items-center justify-end">
            <button
              onClick={onClose}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 text-gray-800 hover:bg-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {!activeScorePicker ? (
          <div className="flex flex-col gap-4 p-4">
            {/* Player 1 Section */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex w-full items-center gap-4">
                {/* Profile */}
                <div className="flex flex-1 items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {match.player1.name?.substring(0, 2).toUpperCase() || 'NA'}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">
                      {match.player1.name}
                    </p>
                    <p className="text-sm font-normal leading-normal text-gray-500">
                      ELO: {match.player1.eloBefore}
                    </p>
                  </div>
                </div>

                {/* Score Display - Click to open picker */}
                <button
                  onClick={() => setActiveScorePicker('player1')}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-sm font-medium text-gray-600">Score</span>
                  <div className="w-20 h-14 flex items-center justify-center text-3xl font-bold border-2 border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-500 transition-colors">
                    {player1Score}
                  </div>
                </button>
              </div>
            </div>

            {/* VS Separator */}
            <div className="flex justify-center">
              <p className="text-base font-bold text-gray-400">VS</p>
            </div>

            {/* Player 2 Section */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex w-full items-center gap-4">
                {/* Profile */}
                <div className="flex flex-1 items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {match.player2.name?.substring(0, 2).toUpperCase() || 'NA'}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">
                      {match.player2.name}
                    </p>
                    <p className="text-sm font-normal leading-normal text-gray-500">
                      ELO: {match.player2.eloBefore}
                    </p>
                  </div>
                </div>

                {/* Score Display - Click to open picker */}
                <button
                  onClick={() => setActiveScorePicker('player2')}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-sm font-medium text-gray-600">Score</span>
                  <div className="w-20 h-14 flex items-center justify-center text-3xl font-bold border-2 border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-500 transition-colors">
                    {player2Score}
                  </div>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 pb-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold"
              >
                {submitting ? 'Saving...' : 'Save Result'}
              </Button>
            </div>
          </div>
        ) : (
          /* Number Picker */
          <div className="flex flex-col gap-4 p-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Select score for {activeScorePicker === 'player1' ? match.player1.name : match.player2.name}
              </h3>
            </div>

            {/* Common scores (0-5) - Large buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleScoreSelect(score)}
                  className="h-20 flex items-center justify-center text-4xl font-bold rounded-xl border-2 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 transition-colors"
                >
                  {score}
                </button>
              ))}
            </div>

            {/* Extended scores (6-15) - Smaller buttons */}
            <div className="pt-2">
              <p className="text-xs font-medium text-gray-500 mb-2 text-center">Extended scores</p>
              <div className="grid grid-cols-5 gap-2">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleScoreSelect(score)}
                    className="h-12 flex items-center justify-center text-2xl font-bold rounded-lg border-2 border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 transition-colors"
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel button */}
            <Button
              variant="outline"
              onClick={() => setActiveScorePicker(null)}
              className="w-full h-12 mt-2"
            >
              Cancel
            </Button>
          </div>
        )}

        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

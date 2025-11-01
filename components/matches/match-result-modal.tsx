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

  if (!match) return null;

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

              {/* Score Input */}
              <div className="flex flex-col">
                <Label
                  htmlFor="player1-score"
                  className="text-sm font-medium leading-normal pb-1 text-gray-600 text-center"
                >
                  Score
                </Label>
                <Input
                  id="player1-score"
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                  className="w-20 h-14 text-center text-3xl font-bold border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
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

              {/* Score Input */}
              <div className="flex flex-col">
                <Label
                  htmlFor="player2-score"
                  className="text-sm font-medium leading-normal pb-1 text-gray-600 text-center"
                >
                  Score
                </Label>
                <Input
                  id="player2-score"
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                  className="w-20 h-14 text-center text-3xl font-bold border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

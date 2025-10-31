'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayers } from '@/hooks/use-players';
import { calculateTotalMatches } from '@/lib/utils/round-robin';
import { createDailySession } from '@/lib/firebase/sessions';
import { Search, ArrowLeft } from 'lucide-react';

export function PlayerSelector() {
  const { players, loading } = usePlayers();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const filteredPlayers = players.filter(player =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === filteredPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(filteredPlayers.map(p => p.id));
    }
  };

  const handleCreateSession = async () => {
    if (selectedPlayers.length < 2) {
      alert('Please select at least 2 players');
      return;
    }

    setCreating(true);
    try {
      await createDailySession(selectedPlayers);
      router.push('/dashboard');
    } catch (error) {
      alert('Error creating session: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading players...</div>
      </div>
    );
  }

  const totalMatches = calculateTotalMatches(selectedPlayers.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="touch-target p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1">Today&apos;s Players</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for a player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Player Count & Select All */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Players ({filteredPlayers.length})
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 font-medium"
          >
            Select all
          </button>
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {filteredPlayers.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {player.avatar}
              </div>
              <div className="flex-1">
                <div className="font-medium">{player.name || player.nickname}</div>
                <div className="text-sm text-gray-500">ELO: {player.eloRating}</div>
              </div>
              <Checkbox
                checked={selectedPlayers.includes(player.id)}
                onCheckedChange={() => handleTogglePlayer(player.id)}
                className="w-6 h-6"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fixed Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom">
        <div className="max-w-2xl mx-auto space-y-4">
          {selectedPlayers.length >= 2 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedPlayers.length} players selected → Generates {totalMatches} matches
              </p>
            </div>
          )}
          <Button
            onClick={handleCreateSession}
            disabled={selectedPlayers.length < 2 || creating}
            className="w-full h-14 text-base"
          >
            {creating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

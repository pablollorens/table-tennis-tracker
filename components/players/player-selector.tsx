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

  // Check if there are enough players
  const notEnoughPlayers = players.length < 2;

  const totalMatches = calculateTotalMatches(selectedPlayers.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
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
        {/* Not Enough Players Warning */}
        {notEnoughPlayers && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Need More Players
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                You need at least 2 active players to create a session.
                Currently you have {players.length} player{players.length === 1 ? '' : 's'}.
              </p>
              <p className="text-xs text-yellow-700">
                Invite your colleagues to register and activate their profiles!
              </p>
            </div>
          </Card>
        )}

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

      {/* Bottom Fixed Action - positioned above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Debug info - always show */}
          <div className="text-center p-2 bg-gray-100 rounded text-xs">
            Selected: {selectedPlayers.length} | Total players: {players.length}
          </div>

          {selectedPlayers.length >= 2 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedPlayers.length} players selected → Generates {totalMatches} match{totalMatches === 1 ? '' : 'es'}
              </p>
            </div>
          )}
          <Button
            onClick={handleCreateSession}
            disabled={selectedPlayers.length < 2 || creating}
            className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {creating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

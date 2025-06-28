import React from 'react';
import { Gamepad2, Users } from 'lucide-react';
import { GameLobby } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceSettings } from '@/components/voice/VoiceSettings';

interface LobbyScreenProps {
  games: GameLobby[];
  onStartGame: () => void;
  onJoinGame: (gameId: number) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  games,
  onStartGame,
  onJoinGame,
  voiceEnabled,
  onToggleVoice
}) => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="p-6">
        <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="bg-purple-primary/10 p-2 rounded-xl mr-3">
            <Gamepad2 className="w-6 h-6 text-purple-primary" />
          </div>
          Create Game
        </h2>
        <div className="space-y-4">
          <Button onClick={onStartGame} className="w-full" size="lg">
            Start New Game
          </Button>
          <div className="text-center text-gray-500">
            <p>Whisper Chase: 20 Questions is a multiplayer guessing game where you and others team up—or compete—against an AI to uncover a secret word in 20 questions or less. With each round, the challenge grows, making every guess count as the mystery word gets trickier to crack.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="bg-success-green/20 p-2 rounded-xl mr-3">
            <Users className="w-6 h-6 text-success-green" />
          </div>
          Join Game
        </h2>
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-primary/30 transition-colors hover:shadow-md">
              <div>
                <div className="font-semibold text-gray-800">{game.host}'s Game</div>
                <div className="text-sm text-gray-500">
                  Status: <span className={game.status === 'waiting' ? 'text-success-green' : 'text-orange-600'}>{game.status}</span>
                </div>
              </div>
              <Button
                onClick={() => onJoinGame(game.id)}
                disabled={game.status === 'active'}
                variant={game.status === 'waiting' ? 'primary' : 'secondary'}
                size="sm"
              >
                {game.status === 'waiting' ? 'Join' : 'Full'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <VoiceSettings 
          voiceEnabled={voiceEnabled}
          onToggleVoice={onToggleVoice}
        />
      </div>
    </div>
  </div>
);
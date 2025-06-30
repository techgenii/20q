import React from 'react';
import { Gamepad2, Users, Play, Sparkles } from 'lucide-react';
import { GameLobby } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceSettings } from '@/components/voice/VoiceSettings';

interface LobbyScreenProps {
  games: GameLobby[];
  onStartGame: (gameData: { difficulty: number; gameType: 'solo' | 'multi-player'; maxPlayers: number; guessedWord: string }) => void;
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
}) => {
  const handleStartNewGame = () => {
    // Use the specified defaults with valid difficulty value
    onStartGame({
      guessedWord: '',
      difficulty: 0,
      gameType: 'solo',
      maxPlayers: 1
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Game Card */}
        <Card className="p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-primary/10 to-pink-accent/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-accent/10 to-purple-primary/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="bg-gradient-to-r from-purple-primary to-pink-accent p-3 rounded-2xl mr-4 shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              Create Game
            </h2>
            
            <div className="space-y-6">
              {/* Enhanced Start Game Button */}
              <div className="relative group">
                <button
                  onClick={handleStartNewGame}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-purple-primary via-purple-primary to-pink-accent hover:from-purple-primary/90 hover:via-purple-primary/90 hover:to-pink-accent/90 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg group"
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-accent to-purple-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Button content */}
                  <div className="relative flex items-center justify-center space-x-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg font-semibold">Start New Game</span>
                    <Sparkles className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500"></div>
                </button>
              </div>
              
              {/* Description */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-primary/5 to-pink-accent/5 rounded-2xl p-6 border border-purple-primary/10">
                  <p className="text-gray-600 leading-relaxed">
                    Start a solo game with AI-generated challenges. The system will automatically create a mystery word for you to discover through strategic yes/no questions.
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className="bg-purple-primary/10 text-purple-primary px-3 py-1 rounded-full text-xs font-medium">
                      AI Powered
                    </span>
                    <span className="bg-pink-accent/10 text-pink-accent px-3 py-1 rounded-full text-xs font-medium">
                      Solo Play
                    </span>
                    <span className="bg-success-green/10 text-success-green px-3 py-1 rounded-full text-xs font-medium">
                      Instant Start
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Join Game Card */}
        <Card className="p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-success-green/10 to-blue-500/10 rounded-full -translate-y-14 translate-x-14"></div>
          
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="bg-gradient-to-r from-success-green to-blue-500 p-3 rounded-2xl mr-4 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              Join Game
            </h2>
            
            <div className="space-y-4">
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">No active games available</p>
                  <p className="text-gray-400 text-sm">Create a new game to get started!</p>
                </div>
              ) : (
                games.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-2xl hover:border-purple-primary/30 transition-all hover:shadow-lg bg-gradient-to-r from-white to-gray-50/50">
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{game.host}'s Game</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Status: <span className={`font-semibold ${game.status === 'waiting' ? 'text-success-green' : 'text-orange-600'}`}>{game.status}</span>
                        {' • '}
                        Players: <span className="font-semibold text-gray-700">{game.players}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => onJoinGame(game.id)}
                      disabled={game.status === 'active'}
                      variant={game.status === 'waiting' ? 'primary' : 'secondary'}
                      size="sm"
                      className="rounded-xl font-semibold"
                    >
                      {game.status === 'waiting' ? 'Join' : 'Full'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Settings Card */}
        <div>
          <VoiceSettings 
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
          />
        </div>
      </div>
    </div>
  );
};
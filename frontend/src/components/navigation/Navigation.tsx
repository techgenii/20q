import React from 'react';
import { Target, Gamepad2, Trophy, History, User, Volume2, LogOut } from 'lucide-react';
import { Screen } from '@/types';
import { Button } from '@/components/ui/Button';

interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onLogout: () => void;
  voiceEnabled: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onScreenChange,
  onLogout,
  voiceEnabled
}) => {
  const navItems = [
    { id: 'lobby' as Screen, icon: Gamepad2, label: 'Lobby' },
    { id: 'leaderboard' as Screen, icon: Trophy, label: 'Leaderboard' },
    { id: 'history' as Screen, icon: History, label: 'History' },
    { id: 'profile' as Screen, icon: User, label: 'Profile' }
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-primary to-pink-accent p-2 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-primary to-pink-accent bg-clip-text text-transparent">
                Whisper Chase
              </span>
              {voiceEnabled && (
                <div className="flex items-center space-x-1 bg-success-green/20 px-2 py-0.5 rounded-full ml-2 inline-flex">
                  <Volume2 className="w-3 h-3 text-success-green" />
                  <span className="text-xs text-success-green font-medium">Voice</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => onScreenChange(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    currentScreen === id
                      ? 'bg-purple-primary/10 text-purple-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block font-medium">{label}</span>
                </button>
              ))}
            </div>
            
            <div className="ml-4 pl-4 border-l border-gray-200">
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-gray-600 hover:bg-red-50 hover:text-red-600 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
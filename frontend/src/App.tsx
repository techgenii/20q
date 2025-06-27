import React, { useState, Suspense } from 'react';
import { User, Screen, LeaderboardEntry } from '@/types';
import { mockUser, mockLeaderboard, mockHistory, mockGames } from '@/data/mockData';
import { useVoice } from '@/hooks/useVoice';

// Components that are always needed
import { LoginForm } from '@/components/auth/LoginForm';
import { Navigation } from '@/components/navigation/Navigation';

// Lazy-loaded screen components
const ProfileScreen = React.lazy(() => import('@/components/screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const LobbyScreen = React.lazy(() => import('@/components/screens/LobbyScreen').then(module => ({ default: module.LobbyScreen })));
const GameScreen = React.lazy(() => import('@/components/screens/GameScreen').then(module => ({ default: module.GameScreen })));
const LeaderboardScreen = React.lazy(() => import('@/components/screens/LeaderboardScreen').then(module => ({ default: module.LeaderboardScreen })));
const HistoryScreen = React.lazy(() => import('@/components/screens/HistoryScreen').then(module => ({ default: module.HistoryScreen })));

// Loading component for Suspense fallback
const ScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-primary/5 via-white to-pink-accent/5 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-12 h-12 border-4 border-purple-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [viewedProfileUser, setViewedProfileUser] = useState<User | null>(null);
  const { voiceState, audioRef, startRecording, stopRecording, playAudio, pauseAudio, toggleVoiceEnabled, clearTranscription } = useVoice();

  const handleLogin = (userData: any) => {
    setUser(mockUser);
    setCurrentScreen('lobby');
  };

  const handleLogout = () => {
    setUser(null);
    setViewedProfileUser(null);
    setCurrentScreen('login');
  };

  const handleScreenChange = (screen: Screen) => {
    // Clear viewed profile when navigating away from profile screen
    if (screen !== 'profile') {
      setViewedProfileUser(null);
    }
    setCurrentScreen(screen);
  };

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleJoinGame = (gameId: number) => {
    setCurrentScreen('game');
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
  };

  const handleViewProfile = (player: LeaderboardEntry) => {
    // If viewing current user's profile, use the full user data
    if (player.username === user?.username && user) {
      setViewedProfileUser(user);
    } else {
      // Map LeaderboardEntry to User type for other players
      const mappedUser: User = {
        id: player.rank.toString(),
        username: player.username,
        email: `${player.username.toLowerCase()}@example.com`,
        totalGames: Math.floor(player.wins / (player.winRate / 100)),
        gamesWon: player.wins,
        winRate: player.winRate,
        bestStreak: Math.max(player.streak, Math.floor(player.streak * 1.5)),
        currentStreak: player.streak,
        avatar: null,
        joinDate: '2024-01-01', // Default join date
        favoriteCategory: 'General', // Default category
        achievements: player.winRate > 80 ? ['High Achiever', 'Win Streak Master'] : ['Getting Started'],
        gamesToday: 0,
        averageQuestions: 0,
        fastestWin: 0
      };
      setViewedProfileUser(mappedUser);
    }
    setCurrentScreen('profile');
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  // Render login screen if no user
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-primary/5 via-white to-pink-accent/5">
      <Navigation 
        currentScreen={currentScreen}
        onScreenChange={handleScreenChange}
        onLogout={handleLogout}
        voiceEnabled={voiceState.voiceEnabled}
      />
      
      <main className="py-8">
        <Suspense fallback={<ScreenLoader />}>
          {currentScreen === 'profile' && (
            <ProfileScreen 
              user={viewedProfileUser || user}
              voiceEnabled={voiceState.voiceEnabled}
              onToggleVoice={toggleVoiceEnabled}
              history={mockHistory}
              onViewHistory={handleViewHistory}
            />
          )}
          
          {currentScreen === 'lobby' && (
            <LobbyScreen 
              games={mockGames}
              onStartGame={handleStartGame}
              onJoinGame={handleJoinGame}
              voiceEnabled={voiceState.voiceEnabled}
              onToggleVoice={toggleVoiceEnabled}
            />
          )}
          
          {currentScreen === 'game' && (
            <GameScreen 
              onBackToLobby={handleBackToLobby}
              voiceState={voiceState}
              startRecording={startRecording}
              stopRecording={stopRecording}
              playAudio={playAudio}
              pauseAudio={pauseAudio}
              clearTranscription={clearTranscription}
            />
          )}
          
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen 
              leaderboard={mockLeaderboard}
              currentUser={user}
              onViewProfile={handleViewProfile}
            />
          )}
          
          {currentScreen === 'history' && (
            <HistoryScreen history={mockHistory} />
          )}
        </Suspense>
      </main>
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => {}}
        className="hidden"
      />
    </div>
  );
};

export default App;
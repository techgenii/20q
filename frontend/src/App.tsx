import React, { useState, Suspense, useEffect } from 'react';
import { User, Screen, LeaderboardEntry, LoginResponse, StartGameResponse } from '@/types';
import { mockLeaderboard, mockHistory, mockGames } from '@/data/mockData';
import { useVoice } from '@/hooks/useVoice';
import { apiClient } from '@/lib/apiClient';
import { mapApiUserToUser } from '@/utils/userMapper';

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<StartGameResponse | null>(null);
  const { voiceState, audioRef, startRecording, stopRecording, playAudio, pauseAudio, toggleVoiceEnabled, clearTranscription } = useVoice();

  // Initialize API client callbacks
  useEffect(() => {
    apiClient.setCallbacks(
      (token: string | null) => {
        setAccessToken(token);
        if (token) {
          console.log('Access token updated');
        }
      },
      () => {
        console.log('Session expired, logging out');
        handleLogout();
      }
    );
  }, []);

  // Set access token in API client when it changes
  useEffect(() => {
    apiClient.setAccessToken(accessToken);
  }, [accessToken]);

  const handleLogin = (loginData: LoginResponse) => {
    console.log('Login successful:', loginData);
    
    // Set access token
    setAccessToken(loginData.access_token);
    
    // Convert API user to internal user format
    const mappedUser = mapApiUserToUser(loginData.user);
    setUser(mappedUser);
    
    // Navigate to lobby
    setCurrentScreen('lobby');
  };

  const handleLogout = async () => {
    try {
      // Call logout API if we have a token
      if (accessToken) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      setViewedProfileUser(null);
      setAccessToken(null);
      setCurrentGame(null);
      setCurrentScreen('login');
    }
  };

  const handleScreenChange = (screen: Screen) => {
    // Clear viewed profile when navigating away from profile screen
    if (screen !== 'profile') {
      setViewedProfileUser(null);
    }
    // Clear game data when navigating away from game screen
    if (screen !== 'game') {
      setCurrentGame(null);
    }
    setCurrentScreen(screen);
  };

  const handleStartGame = async (gameData: { difficulty: number; gameType: 'solo' | 'multi-player'; maxPlayers: number; guessedWord: string }) => {
    try {
      console.log('Starting game with:', gameData);
      
      const startGameRequest = {
        difficulty: gameData.difficulty,
        game_type: gameData.gameType,
        max_players: gameData.maxPlayers,
        guessed_word: gameData.guessedWord
      };

      console.log('Sending start game request:', startGameRequest);
      const response = await apiClient.startGame(startGameRequest);
      
      if (response.error) {
        console.error('Failed to start game:', response.error);
        // Show user-friendly error message
        alert(`Failed to start game: ${response.error}`);
        return;
      }

      if (response.data) {
        console.log('Game started successfully:', response.data);
        setCurrentGame(response.data);
        setCurrentScreen('game');
      } else {
        console.error('No game data received from API');
        alert('Failed to start game: No response data received');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('An unexpected error occurred while starting the game. Please try again.');
    }
  };

  const handleJoinGame = (gameId: number) => {
    setCurrentScreen('game');
  };

  const handleBackToLobby = () => {
    setCurrentGame(null);
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
        full_name: player.username,
        created_at: '2024-01-01T00:00:00Z',
        avatar_url: '',
        last_login_at: '2024-01-01T00:00:00Z',
        bio: '',
        totalGames: Math.floor(player.wins / (player.winRate / 100)),
        gamesWon: player.wins,
        winRate: player.winRate,
        bestStreak: Math.max(player.streak, Math.floor(player.streak * 1.5)),
        currentStreak: player.streak,
        avatar: null,
        joinDate: '2024-01-01',
        favoriteCategory: 'General',
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

  const handleUpdateUser = (updatedUser: User) => {
    // Update the main user state
    setUser(updatedUser);
    
    // If we're viewing the current user's profile, update that too
    if (viewedProfileUser && viewedProfileUser.id === updatedUser.id) {
      setViewedProfileUser(updatedUser);
    }
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
              onUpdateUser={handleUpdateUser}
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
              gameData={currentGame}
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
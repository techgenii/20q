export interface User {
  id: string;
  username: string;
  email: string;
  totalGames: number;
  gamesWon: number;
  winRate: number;
  bestStreak: number;
  currentStreak: number;
  avatar: string | null;
  joinDate: string;
  favoriteCategory: string;
  achievements: string[];
  gamesToday: number;
  averageQuestions: number;
  fastestWin: number;
  // Add API fields
  full_name: string;
  created_at: string;
  avatar_url: string;
  last_login_at: string;
  bio: string;
}

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  avatar_url: string;
  last_login_at: string;
  bio: string;
  favorite_category: string;
  achievements: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface GameMessage {
  id: number;
  user: string;
  message: string;
  type: 'question' | 'answer' | 'guess';
  answer?: string;
  hasAudio?: boolean;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  winRate: number;
  streak: number;
}

export interface GameHistory {
  id: number;
  opponent: string;
  result: 'won' | 'lost';
  word: string;
  questions: number;
  date: string;
}

export interface GameLobby {
  id: number;
  host: string;
  status: 'waiting' | 'active';
  players: number;
}

export interface VoiceState {
  isRecording: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  voiceEnabled: boolean;
  transcription: string;
  isTranscribing: boolean;
  audioBlob: Blob | null;
  recordingDuration: number;
}

export interface GameScreenProps {
  onBackToLobby: () => void;
  voiceState: VoiceState;
  startRecording: () => void;
  stopRecording: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  clearTranscription: () => void;
}

export interface ProfileScreenProps {
  user: User;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  history?: GameHistory[];
  onViewHistory?: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export interface EditProfileScreenProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export type Screen = 'login' | 'lobby' | 'game' | 'leaderboard' | 'history' | 'profile';
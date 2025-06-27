import { User, LeaderboardEntry, GameHistory, GameLobby } from '@/types';

export const mockUser: User = {
  id: '1',
  username: 'Player123',
  email: 'player@example.com',
  totalGames: 45,
  gamesWon: 32,
  winRate: 71,
  bestStreak: 8,
  currentStreak: 3,
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  joinDate: '2024-01-15',
  favoriteCategory: 'Animals',
  achievements: ['First Win', 'Speed Demon', 'Question Master', 'Streak Champion', 'Category Expert', 'Lightning Round', 'Perfect Game'],
  gamesToday: 7,
  averageQuestions: 12.8,
  fastestWin: 6
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'QuestionMaster', wins: 156, winRate: 89, streak: 12 },
  { rank: 2, username: 'GuessingGuru', wins: 134, winRate: 85, streak: 7 },
  { rank: 3, username: 'MindReader', wins: 128, winRate: 82, streak: 9 },
  { rank: 4, username: 'Player123', wins: 32, winRate: 71, streak: 3 },
  { rank: 5, username: 'BrainBox', wins: 98, winRate: 76, streak: 5 },
  { rank: 6, username: 'WordWizard', wins: 87, winRate: 73, streak: 4 },
  { rank: 7, username: 'ThinkTank', wins: 92, winRate: 68, streak: 6 },
  { rank: 8, username: 'LogicLord', wins: 76, winRate: 79, streak: 2 },
  { rank: 9, username: 'PuzzlePro', wins: 83, winRate: 65, streak: 8 },
  { rank: 10, username: 'GameGenie', wins: 71, winRate: 74, streak: 1 },
  { rank: 11, username: 'ClueChaser', wins: 69, winRate: 72, streak: 3 },
  { rank: 12, username: 'RiddleRanger', wins: 64, winRate: 67, streak: 5 },
  { rank: 13, username: 'MysteryMaven', wins: 58, winRate: 69, streak: 2 },
  { rank: 14, username: 'EnigmaExpert', wins: 55, winRate: 71, streak: 4 },
  { rank: 15, username: 'SecretSeeker', wins: 52, winRate: 66, streak: 1 },
  { rank: 16, username: 'HintHunter', wins: 49, winRate: 63, streak: 7 },
  { rank: 17, username: 'CodeCracker', wins: 47, winRate: 68, streak: 3 },
  { rank: 18, username: 'PuzzlePirate', wins: 44, winRate: 61, streak: 2 },
  { rank: 19, username: 'BrainBuster', wins: 41, winRate: 64, streak: 6 },
  { rank: 20, username: 'QuizQueen', wins: 38, winRate: 59, streak: 1 },
  { rank: 21, username: 'FactFinder', wins: 36, winRate: 62, streak: 4 },
  { rank: 22, username: 'TriviaKing', wins: 33, winRate: 57, streak: 2 },
  { rank: 23, username: 'SmartSolver', wins: 31, winRate: 60, streak: 3 },
  { rank: 24, username: 'WiseWhiz', wins: 28, winRate: 55, streak: 1 },
  { rank: 25, username: 'CleverCat', wins: 26, winRate: 58, streak: 5 }
];

export const mockHistory: GameHistory[] = [
  { id: 1, opponent: 'QuestionMaster', result: 'won', word: 'Elephant', questions: 15, date: '2024-06-20' },
  { id: 2, opponent: 'GuessingGuru', result: 'lost', word: 'Telescope', questions: 20, date: '2024-06-19' },
  { id: 3, opponent: 'MindReader', result: 'won', word: 'Pizza', questions: 12, date: '2024-06-18' },
  { id: 4, opponent: 'BrainBox', result: 'won', word: 'Guitar', questions: 8, date: '2024-06-17' },
  { id: 5, opponent: 'WordWizard', result: 'lost', word: 'Microscope', questions: 20, date: '2024-06-16' },
  { id: 6, opponent: 'ThinkTank', result: 'won', word: 'Butterfly', questions: 14, date: '2024-06-15' },
  { id: 7, opponent: 'LogicLord', result: 'won', word: 'Sandwich', questions: 11, date: '2024-06-14' }
];

export const mockGames: GameLobby[] = [
  { id: 1, host: 'QuestionMaster', status: 'waiting', players: 1 },
  { id: 2, host: 'BrainBox', status: 'active', players: 2 },
  { id: 3, host: 'GuessingGuru', status: 'waiting', players: 1 }
];
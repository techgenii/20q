import { User, ApiUser } from '@/types';

// Convert API user data to internal User format
export const mapApiUserToUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    username: apiUser.full_name || apiUser.email.split('@')[0], // Use full_name or fallback to email prefix
    email: apiUser.email,
    full_name: apiUser.full_name,
    created_at: apiUser.created_at,
    avatar_url: apiUser.avatar_url,
    last_login_at: apiUser.last_login_at,
    bio: apiUser.bio,
    favoriteCategory: apiUser.favorite_category || 'General',
    achievements: apiUser.achievements || [],
    
    // Default values for game-specific fields (these would come from game API later)
    totalGames: 0,
    gamesWon: 0,
    winRate: 0,
    bestStreak: 0,
    currentStreak: 0,
    avatar: apiUser.avatar_url,
    joinDate: apiUser.created_at,
    gamesToday: 0,
    averageQuestions: 0,
    fastestWin: 0
  };
};

// Convert internal User to API format for updates
export const mapUserToApiUser = (user: User): Partial<ApiUser> => {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    favorite_category: user.favoriteCategory,
    achievements: user.achievements
  };
};
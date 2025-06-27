import { DivideIcon as LucideIcon, Trophy, Zap, Target, Crown, Star, Award, Medal, Flame, Clock, Brain, Heart, Shield, Rocket, Gem, Sparkles } from 'lucide-react';

export interface AchievementDetail {
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const achievementMap: Record<string, AchievementDetail> = {
  'First Win': {
    icon: Trophy,
    description: 'Won your first game',
    color: 'text-yellow-700',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
    borderColor: 'border-yellow-300',
    rarity: 'common'
  },
  'Speed Demon': {
    icon: Zap,
    description: 'Won a game in under 10 questions',
    color: 'text-blue-700',
    bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-200',
    borderColor: 'border-blue-300',
    rarity: 'rare'
  },
  'Question Master': {
    icon: Brain,
    description: 'Asked 100 strategic questions',
    color: 'text-purple-700',
    bgColor: 'bg-gradient-to-r from-purple-100 to-purple-200',
    borderColor: 'border-purple-300',
    rarity: 'epic'
  },
  'Streak Champion': {
    icon: Flame,
    description: 'Achieved a 5-game win streak',
    color: 'text-orange-700',
    bgColor: 'bg-gradient-to-r from-orange-100 to-red-200',
    borderColor: 'border-orange-300',
    rarity: 'epic'
  },
  'Category Expert': {
    icon: Target,
    description: 'Mastered your favorite category',
    color: 'text-green-700',
    bgColor: 'bg-gradient-to-r from-green-100 to-emerald-200',
    borderColor: 'border-green-300',
    rarity: 'rare'
  },
  'Perfect Game': {
    icon: Star,
    description: 'Won without any wrong guesses',
    color: 'text-indigo-700',
    bgColor: 'bg-gradient-to-r from-indigo-100 to-indigo-200',
    borderColor: 'border-indigo-300',
    rarity: 'legendary'
  },
  'Lightning Round': {
    icon: Clock,
    description: 'Won a game in under 5 minutes',
    color: 'text-cyan-700',
    bgColor: 'bg-gradient-to-r from-cyan-100 to-teal-200',
    borderColor: 'border-cyan-300',
    rarity: 'rare'
  },
  'Mind Reader': {
    icon: Heart,
    description: 'Guessed correctly on first try 3 times',
    color: 'text-pink-700',
    bgColor: 'bg-gradient-to-r from-pink-100 to-rose-200',
    borderColor: 'border-pink-300',
    rarity: 'epic'
  },
  'Unstoppable': {
    icon: Shield,
    description: 'Won 10 games in a row',
    color: 'text-gray-700',
    bgColor: 'bg-gradient-to-r from-gray-100 to-slate-200',
    borderColor: 'border-gray-300',
    rarity: 'legendary'
  },
  'Rising Star': {
    icon: Rocket,
    description: 'Reached top 100 on leaderboard',
    color: 'text-violet-700',
    bgColor: 'bg-gradient-to-r from-violet-100 to-purple-200',
    borderColor: 'border-violet-300',
    rarity: 'epic'
  },
  'Veteran Player': {
    icon: Medal,
    description: 'Played 50 games',
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-200',
    borderColor: 'border-amber-300',
    rarity: 'common'
  },
  'High Achiever': {
    icon: Crown,
    description: 'Maintained 80%+ win rate',
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-r from-yellow-200 to-amber-300',
    borderColor: 'border-yellow-400',
    rarity: 'legendary'
  },
  'Win Streak Master': {
    icon: Gem,
    description: 'Multiple win streaks of 5+',
    color: 'text-emerald-700',
    bgColor: 'bg-gradient-to-r from-emerald-100 to-green-200',
    borderColor: 'border-emerald-300',
    rarity: 'epic'
  },
  'Getting Started': {
    icon: Sparkles,
    description: 'Welcome to the game!',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-100',
    borderColor: 'border-blue-200',
    rarity: 'common'
  }
};

export const getAchievementDetails = (achievementName: string): AchievementDetail => {
  return achievementMap[achievementName] || {
    icon: Award,
    description: 'Special achievement',
    color: 'text-gray-700',
    bgColor: 'bg-gradient-to-r from-gray-100 to-gray-200',
    borderColor: 'border-gray-300',
    rarity: 'common'
  };
};

export const getRarityBadge = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return {
        text: 'LEGENDARY',
        className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm'
      };
    case 'epic':
      return {
        text: 'EPIC',
        className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm'
      };
    case 'rare':
      return {
        text: 'RARE',
        className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm'
      };
    case 'common':
    default:
      return {
        text: 'COMMON',
        className: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm'
      };
  }
};
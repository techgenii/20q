import React from 'react';
import { User, Zap, Crown, Target, Clock, Trophy, ArrowRight, Edit3 } from 'lucide-react';
import { User as UserType, GameHistory, ProfileScreenProps } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceSettings } from '@/components/voice/VoiceSettings';
import { formatDate } from '@/utils/formatters';
import { getAchievementDetails, getRarityBadge } from '@/utils/achievementDetails';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  voiceEnabled,
  onToggleVoice,
  history = [],
  onViewHistory
}) => {
  // Get the 5 most recent games for the activity feed
  const recentActivity = history.slice(0, 5);

  const getResultColor = (result: 'won' | 'lost') => {
    return result === 'won' 
      ? 'text-success-green bg-success-green/10 border-success-green/20' 
      : 'text-red-600 bg-red-50 border-red-200';
  };

  const handleEditProfile = () => {
    alert('Edit Profile functionality coming soon! This will allow you to update your avatar, username, and other profile settings.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card variant="elevated" className="overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-br from-purple-primary via-purple-primary to-pink-accent px-8 py-12">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-start space-x-6">
                {/* Avatar Display */}
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl w-28 h-28 flex items-center justify-center border border-white/30 overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-14 h-14 text-white" />
                  )}
                </div>
                <div className="text-white flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold">{user.username}</h1>
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 rounded-lg transition-all font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-white/80 text-lg mb-4">{user.email}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">Streak: {user.currentStreak}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Crown className="w-5 h-5" />
                      <span className="font-semibold">Best: {user.bestStreak}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Target className="w-5 h-5" />
                      <span className="font-semibold">{user.favoriteCategory}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Performance Stats</h2>
                <div className="text-sm text-gray-500">
                  Member since {formatDate(user.joinDate)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-success-green/10 to-success-green/20 p-6 rounded-2xl border border-success-green/30 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-success-green mb-2">{user.totalGames}</div>
                  <div className="text-success-green font-semibold">Total Games</div>
                  <div className="text-sm text-success-green mt-1">All time</div>
                </div>
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{user.gamesWon}</div>
                  <div className="text-blue-700 font-semibold">Games Won</div>
                  <div className="text-sm text-blue-600 mt-1">Victory count</div>
                </div>
                <div className="group bg-gradient-to-br from-purple-primary/5 to-pink-accent/5 p-6 rounded-2xl border border-purple-primary/20 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-purple-primary mb-2">{user.winRate}%</div>
                  <div className="text-purple-primary font-semibold">Win Rate</div>
                  <div className="text-sm text-purple-primary mt-1">Success ratio</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Achievements Card - Now Separate */}
          <Card variant="elevated" className="overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Trophy className="w-7 h-7 mr-3 text-yellow-500" />
                  Achievements
                </h3>
                <div className="text-sm text-gray-500">
                  {user.achievements.length} earned
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {user.achievements.map((achievement, index) => {
                  const details = getAchievementDetails(achievement);
                  const rarity = getRarityBadge(details.rarity);
                  const IconComponent = details.icon;
                  
                  return (
                    <div 
                      key={index} 
                      className={`group relative ${details.bgColor} p-5 rounded-2xl border-2 ${details.borderColor} hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-2 right-2 transform rotate-12">
                          <IconComponent className="w-16 h-16" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl bg-white/80 shadow-sm ${details.color}`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className={`font-bold text-lg ${details.color}`}>
                                {achievement}
                              </h4>
                              <p className={`text-sm ${details.color} opacity-80`}>
                                {details.description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Rarity Badge */}
                          <div className={rarity.className}>
                            {rarity.text}
                          </div>
                        </div>
                        
                        {/* Achievement Progress Bar (for visual appeal) */}
                        <div className="w-full bg-white/50 rounded-full h-2 mt-3">
                          <div className="bg-white/80 h-2 rounded-full w-full shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Achievement Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['common', 'rare', 'epic', 'legendary'].map((rarity) => {
                  const count = user.achievements.filter(achievement => 
                    getAchievementDetails(achievement).rarity === rarity
                  ).length;
                  const rarityInfo = getRarityBadge(rarity);
                  
                  return (
                    <div key={rarity} className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-800 mb-1">{count}</div>
                      <div className={`inline-block ${rarityInfo.className} text-xs`}>
                        {rarityInfo.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <VoiceSettings 
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
          />
          
          {/* Quick Stats - Now appears first */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Games Today</span>
                <span className="font-bold text-gray-800">{user.gamesToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Questions</span>
                <span className="font-bold text-gray-800">{user.averageQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fastest Win</span>
                <span className="font-bold text-gray-800">{user.fastestWin} questions</span>
              </div>
            </div>
          </Card>
          
          {/* Recent Activity Feed - Now appears second */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-primary" />
                Recent Activity
              </h3>
              {onViewHistory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewHistory}
                  className="flex items-center space-x-1 text-purple-primary hover:text-purple-primary/80"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((game) => (
                  <div key={game.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-800">vs {game.opponent}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getResultColor(game.result)}`}>
                          {game.result === 'won' ? 'W' : 'L'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{game.date}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium">{game.word}</span>
                      <span>{game.questions}/20 questions</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent games</p>
                <p className="text-gray-400 text-xs">Start playing to see your activity here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
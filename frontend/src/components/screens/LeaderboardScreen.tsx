import React, { useState, useMemo } from 'react';
import { Trophy, Zap, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Users } from 'lucide-react';
import { LeaderboardEntry, User } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  currentUser?: User;
  onViewProfile: (player: LeaderboardEntry) => void;
}

type SortField = 'rank' | 'username' | 'wins' | 'winRate' | 'streak';
type SortDirection = 'asc' | 'desc';

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400';
    case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500';
    default: return 'bg-gradient-to-r from-purple-primary/80 to-pink-accent/80';
  }
};

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  leaderboard,
  currentUser,
  onViewProfile
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [minWinRate, setMinWinRate] = useState<number | ''>('');
  const [minStreak, setMinStreak] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = leaderboard.filter(player => {
      const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWinRate = minWinRate === '' || player.winRate >= minWinRate;
      const matchesStreak = minStreak === '' || player.streak >= minStreak;
      
      return matchesSearch && matchesWinRate && matchesStreak;
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'wins':
          aValue = a.wins;
          bValue = b.wins;
          break;
        case 'winRate':
          aValue = a.winRate;
          bValue = b.winRate;
          break;
        case 'streak':
          aValue = a.streak;
          bValue = b.streak;
          break;
        case 'rank':
        default:
          aValue = a.rank;
          bValue = b.rank;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leaderboard, searchTerm, minWinRate, minStreak, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = processedData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minWinRate, minStreak, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-purple-primary" /> : 
      <ArrowDown className="w-4 h-4 text-purple-primary" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinWinRate('');
    setMinStreak('');
  };

  const hasActiveFilters = searchTerm || minWinRate !== '' || minStreak !== '';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-primary to-pink-accent px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display text-3xl font-bold text-white flex items-center">
                <Trophy className="w-8 h-8 mr-3" />
                Leaderboard
              </h1>
              <p className="text-white/80 mt-2">Top players this month</p>
            </div>
            <div className="text-white/90 text-right">
              <div className="font-display text-2xl font-bold">{processedData.length}</div>
              <div className="text-sm">Total Players</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                hasActiveFilters 
                  ? 'text-purple-primary border-purple-primary bg-purple-primary/5' 
                  : 'text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-purple-primary text-white text-xs px-2 py-1 rounded-full">
                  {[searchTerm, minWinRate !== '', minStreak !== ''].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Items per page */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-primary"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Win Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                    value={minWinRate}
                    onChange={(e) => setMinWinRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Streak
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 5"
                    value={minStreak}
                    onChange={(e) => setMinStreak(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="bg-gray-100 px-6 py-3">
          <div className="grid grid-cols-11 gap-4 items-center text-sm font-semibold text-gray-700">
            <button
              onClick={() => handleSort('rank')}
              className="col-span-1 flex items-center space-x-1 hover:text-purple-primary transition-colors"
            >
              <span>Rank</span>
              {getSortIcon('rank')}
            </button>
            
            <button
              onClick={() => handleSort('username')}
              className="col-span-4 flex items-center space-x-1 hover:text-purple-primary transition-colors text-left"
            >
              <span>Player</span>
              {getSortIcon('username')}
            </button>
            
            <button
              onClick={() => handleSort('wins')}
              className="col-span-2 flex items-center space-x-1 hover:text-purple-primary transition-colors"
            >
              <span>Wins</span>
              {getSortIcon('wins')}
            </button>
            
            <button
              onClick={() => handleSort('winRate')}
              className="col-span-2 flex items-center space-x-1 hover:text-purple-primary transition-colors"
            >
              <span>Win Rate</span>
              {getSortIcon('winRate')}
            </button>
            
            <button
              onClick={() => handleSort('streak')}
              className="col-span-2 flex items-center space-x-1 hover:text-purple-primary transition-colors"
            >
              <span>Streak</span>
              {getSortIcon('streak')}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-6">
          {currentPageData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-gray-600 mb-2">No players found</h3>
              <p className="text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No players match your criteria'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentPageData.map((player) => (
                <div 
                  key={player.rank} 
                  onClick={() => onViewProfile(player)}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                    player.username === currentUser?.username 
                      ? 'border-purple-primary/30 bg-purple-primary/5 shadow-sm' 
                      : 'border-gray-200 hover:border-purple-primary/30 hover:bg-purple-primary/5'
                  }`}
                >
                  <div className="grid grid-cols-11 gap-4 items-center">
                    {/* Rank */}
                    <div className="col-span-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getRankColor(player.rank)}`}>
                        {player.rank}
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-bold text-gray-800 flex items-center space-x-2">
                            <span>{player.username}</span>
                            {player.username === currentUser?.username && (
                              <span className="bg-purple-primary text-white text-xs px-2 py-1 rounded-full">You</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{player.rank} globally
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Wins */}
                    <div className="col-span-2">
                      <div className="font-semibold text-gray-800">{player.wins}</div>
                      <div className="text-sm text-gray-500">victories</div>
                    </div>
                    
                    {/* Win Rate */}
                    <div className="col-span-2">
                      <div className="font-semibold text-gray-800">{player.winRate}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-purple-primary to-pink-accent h-2 rounded-full transition-all"
                          style={{ width: `${player.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Streak */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 text-pink-accent">
                        <Zap className="w-4 h-4" />
                        <span className="font-semibold">{player.streak}</span>
                      </div>
                      <div className="text-sm text-gray-500">current</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of {processedData.length} players
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-primary text-white'
                            : 'text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
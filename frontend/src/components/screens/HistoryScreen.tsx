import React, { useState, useMemo } from 'react';
import { History, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Users, Trophy, Target, Clock, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameHistory } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface HistoryScreenProps {
  history: GameHistory[];
}

type SortField = 'date' | 'opponent' | 'result' | 'questions' | 'word';
type SortDirection = 'asc' | 'desc';
type FilterResult = 'all' | 'won' | 'lost';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<FilterResult>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Memoized processed data
  const processedHistory = useMemo(() => {
    let filtered = history.filter(game => {
      const matchesSearch = 
        game.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.word.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesResult = filterResult === 'all' || game.result === filterResult;
      
      return matchesSearch && matchesResult;
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'opponent':
          aValue = a.opponent.toLowerCase();
          bValue = b.opponent.toLowerCase();
          break;
        case 'result':
          aValue = a.result;
          bValue = b.result;
          break;
        case 'questions':
          aValue = a.questions;
          bValue = b.questions;
          break;
        case 'word':
          aValue = a.word.toLowerCase();
          bValue = b.word.toLowerCase();
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [history, searchTerm, filterResult, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(processedHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = processedHistory.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterResult, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const totalGames = processedHistory.length;
    const wins = processedHistory.filter(game => game.result === 'won').length;
    const losses = processedHistory.filter(game => game.result === 'lost').length;
    const avgQuestions = totalGames > 0 
      ? Math.round(processedHistory.reduce((sum, game) => sum + game.questions, 0) / totalGames * 10) / 10
      : 0;
    const bestGame = processedHistory
      .filter(game => game.result === 'won')
      .sort((a, b) => a.questions - b.questions)[0];

    return { totalGames, wins, losses, avgQuestions, bestGame };
  }, [processedHistory]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
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
    setFilterResult('all');
    setSortField('date');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchTerm || filterResult !== 'all' || sortField !== 'date' || sortDirection !== 'desc';

  const getResultColor = (result: 'won' | 'lost') => {
    return result === 'won' 
      ? 'text-success-green bg-success-green/10 border-success-green/20' 
      : 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-primary to-pink-accent px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <History className="w-8 h-8 mr-3" />
                Game History
              </h1>
              <p className="text-white/80 mt-2">Your gaming journey and achievements</p>
            </div>
            <div className="text-white/90 text-right">
              <div className="text-2xl font-bold">{stats.totalGames}</div>
              <div className="text-sm">Total Games</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-success-green mb-1">{stats.wins}</div>
              <div className="text-sm text-gray-600">Wins</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.losses}</div>
              <div className="text-sm text-gray-600">Losses</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-primary mb-1">{stats.avgQuestions}</div>
              <div className="text-sm text-gray-600">Avg Questions</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-pink-accent mb-1">
                {stats.bestGame ? stats.bestGame.questions : '-'}
              </div>
              <div className="text-sm text-gray-600">Best Game</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by opponent or word..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>

            {/* Result Filter Buttons */}
            <div className="flex items-center space-x-2">
              {(['all', 'won', 'lost'] as FilterResult[]).map((result) => (
                <button
                  key={result}
                  onClick={() => setFilterResult(result)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterResult === result
                      ? 'bg-purple-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {result === 'all' ? 'All Games' : result === 'won' ? 'Wins' : 'Losses'}
                </button>
              ))}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                hasActiveFilters 
                  ? 'text-purple-primary border-purple-primary bg-purple-primary/5' 
                  : 'text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Sort</span>
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

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Sort Controls */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Sort by:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { field: 'date' as SortField, label: 'Date', icon: Calendar },
                  { field: 'opponent' as SortField, label: 'Opponent', icon: Users },
                  { field: 'result' as SortField, label: 'Result', icon: Trophy },
                  { field: 'questions' as SortField, label: 'Questions', icon: Target },
                  { field: 'word' as SortField, label: 'Word', icon: Clock }
                ].map(({ field, label, icon: Icon }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      sortField === field
                        ? 'bg-purple-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {sortField === field && getSortIcon(field)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game History List - Leaderboard Style */}
        <div className="p-6">
          {currentPageData.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No games found</h3>
              <p className="text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Start playing to build your history!'}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentPageData.map((game) => (
                <div 
                  key={game.id} 
                  className="p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer border-gray-200 hover:border-purple-primary/30"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Result Icon */}
                    <div className="col-span-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        game.result === 'won' 
                          ? 'bg-gradient-to-r from-success-green to-success-green/80' 
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                      }`}>
                        {game.result === 'won' ? '🏆' : '😔'}
                      </div>
                    </div>
                    
                    {/* Player and Result Badge */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-bold text-gray-800 flex items-center space-x-2">
                            <span>vs {game.opponent}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getResultColor(game.result)}`}>
                              {game.result.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Game #{game.id}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Word */}
                    <div className="col-span-2">
                      <div className="font-semibold text-gray-800">{game.word}</div>
                      <div className="text-sm text-gray-500">word</div>
                    </div>
                    
                    {/* Questions Used with Progress Bar */}
                    <div className="col-span-3">
                      <div className="font-semibold text-gray-800">{game.questions}/20</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            game.result === 'won' 
                              ? 'bg-gradient-to-r from-success-green to-success-green/80' 
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${(game.questions / 20) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div className="col-span-2">
                      <div className="font-semibold text-gray-800">{formatDate(game.date)}</div>
                      <div className="text-sm text-gray-500">date played</div>
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
                Showing {startIndex + 1} to {Math.min(endIndex, processedHistory.length)} of {processedHistory.length} games
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
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
};

export const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400';
    case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500';
    default: return 'bg-gradient-to-r from-purple-primary/80 to-pink-accent/80';
  }
};
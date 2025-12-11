/**
 * LeaderboardTable Component
 * Displays real-time leaderboard with live updates
 */
import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: number;
  player_nickname: string;
  player_country?: string;
  completion_time: number;
  hints_used: number;
  score: number;
  difficulty: string;
  rank?: number;
  percentile?: number;
  created_at?: string;
}

interface LeaderboardTableProps {
  shortCode: string;
  entries: LeaderboardEntry[];
  onNewScore?: (entry: LeaderboardEntry) => void;
  showDifficulty?: boolean;
  highlightNickname?: string;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  shortCode,
  entries,
  onNewScore,
  showDifficulty = false,
  highlightNickname
}) => {
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    const colors: { [key: string]: string } = {
      simple: 'text-green-500',
      medium: 'text-yellow-500',
      hard: 'text-orange-500',
      expert: 'text-red-500'
    };
    return colors[difficulty] || 'text-gray-500';
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900'; // Gold
    if (rank === 2) return 'bg-gray-300 text-gray-900'; // Silver
    if (rank === 3) return 'bg-orange-400 text-orange-900'; // Bronze
    return 'bg-gray-600 text-white';
  };

  // Get rank icon
  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // Highlight new entries
  useEffect(() => {
    if (onNewScore && entries.length > 0) {
      const latestEntry = entries[0];
      setHighlightedId(latestEntry.id);

      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [entries, onNewScore]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No entries yet!</p>
        <p className="text-sm mt-2">Be the first to complete the challenge!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Player</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Score</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Hints</th>
            {showDifficulty && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Difficulty</th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const isHighlighted = highlightedId === entry.id;
            const isCurrentUser = highlightNickname && entry.player_nickname === highlightNickname;

            return (
              <tr
                key={entry.id}
                className={`
                  border-b border-gray-700 transition-all duration-300
                  ${isHighlighted ? 'animate-pulse bg-green-500/20' : ''}
                  ${isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-gray-800/50'}
                `}
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${getRankIcon(rank) ? '' : 'hidden'}`}>
                      {getRankIcon(rank)}
                    </span>
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-bold
                        ${getRankBadgeColor(rank)}
                      `}
                    >
                      #{rank}
                    </span>
                  </div>
                </td>

                {/* Player */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {entry.player_nickname}
                    </span>
                    {entry.player_country && (
                      <span className="text-sm opacity-75">{entry.player_country}</span>
                    )}
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                        You
                      </span>
                    )}
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3">
                  <span className="font-bold text-lg text-yellow-400">
                    {entry.score.toLocaleString()}
                  </span>
                </td>

                {/* Time */}
                <td className="px-4 py-3">
                  <span className="font-mono text-green-400">
                    {formatTime(entry.completion_time)}
                  </span>
                </td>

                {/* Hints */}
                <td className="px-4 py-3">
                  <span className={entry.hints_used === 0 ? 'text-green-400' : 'text-gray-400'}>
                    {entry.hints_used === 0 ? '💪 None' : entry.hints_used}
                  </span>
                </td>

                {/* Difficulty */}
                {showDifficulty && (
                  <td className="px-4 py-3">
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-semibold uppercase
                        ${getDifficultyColor(entry.difficulty)}
                      `}
                    >
                      {entry.difficulty}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary stats */}
      <div className="mt-4 p-4 bg-gray-800/50 rounded flex justify-around text-sm">
        <div className="text-center">
          <div className="text-gray-400">Total Entries</div>
          <div className="text-xl font-bold text-white">{entries.length}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Best Score</div>
          <div className="text-xl font-bold text-yellow-400">
            {Math.max(...entries.map(e => e.score)).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Fastest Time</div>
          <div className="text-xl font-bold text-green-400">
            {formatTime(Math.min(...entries.map(e => e.completion_time)))}
          </div>
        </div>
      </div>
    </div>
  );
};

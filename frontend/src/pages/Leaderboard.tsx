/**
 * Global Leaderboard Page
 * Shows top scores across all URLs
 */
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data: any = await api.leaderboard.getGlobal(timeFilter, 100);

      // Transform the data to match the expected format
      const transformedEntries = data.entries.map((entry: any) => ({
        rank: entry.rank,
        nickname: entry.player_nickname,
        score: entry.score,
        time: formatTime(entry.completion_time),
        difficulty: entry.difficulty || 'medium',
        short_code: entry.short_code
      }));

      setLeaderboard(transformedEntries);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      // Show empty state on error
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Format time from seconds to "MM:SS" or "Xs" format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-8 pt-20 md:pt-24">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">🏆 Global Leaderboard</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Top players across all challenges
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center gap-4 mb-8">
          {['all', 'week', 'today'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all duration-200 ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'Today'}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-2xl">Loading...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-700 dark:text-gray-300">
                No Scores Yet!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to complete a challenge and claim the top spot on the leaderboard!
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">Rank</th>
                  <th className="px-6 py-4 text-left">Player</th>
                  <th className="px-6 py-4 text-right">Score</th>
                  <th className="px-6 py-4 text-right">Time</th>
                  <th className="px-6 py-4 text-right">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.nickname}-${entry.score}`}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                        {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                        {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                        <span className="font-bold text-lg">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-lg">{entry.nickname}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-yellow-500 font-bold text-lg">
                        {entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono">{entry.time}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        entry.difficulty === 'expert' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                        entry.difficulty === 'hard' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' :
                        entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {entry.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

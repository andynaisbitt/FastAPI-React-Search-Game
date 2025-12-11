/**
 * My URLs Page - JFGI Edition
 * View all URLs you've created
 */
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface URLItem {
  short_code: string;
  long_url: string;
  difficulty: string;
  challenge_text: string | null;
  created_at: string;
  total_plays: number;
  total_completions: number;
  is_banned: boolean;
}

export const MyURLs: React.FC = () => {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyUrls = async () => {
      try {
        setLoading(true);
        const data = await api.urls.getMyUrls(50) as URLItem[];
        setUrls(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch My URLs:', err);
        setError('Failed to load your URLs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyUrls();
  }, []);

  const copyToClipboard = (shortCode: string) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    // TODO: Add toast notification
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8 pt-20 sm:pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4">🔗 My URLs</h1>
          <p className="text-base sm:text-lg lg:text-xl text-purple-300">
            All the links you've created to torture people
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <p className="text-2xl text-purple-300">Loading your URLs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/10 border-2 border-red-500/50 rounded-3xl p-8 text-center"
          >
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-lg text-red-300">{error}</p>
          </motion.div>
        )}

        {/* URL Grid */}
        {!loading && !error && (
          <div className="grid gap-6">
            {urls.map((url, idx) => (
              <motion.div
                key={url.short_code}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-2 shadow-2xl ${
                  url.is_banned ? 'border-red-500/50 opacity-60' : 'border-purple-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex-1 w-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-2">
                      /{url.short_code}
                      {url.is_banned && <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-red-400">🚫 BANNED</span>}
                    </h3>
                    <p className="text-xs sm:text-sm text-purple-300 font-mono break-all sm:truncate sm:max-w-md">
                      {url.long_url}
                    </p>
                    {url.challenge_text && (
                      <p className="text-xs text-green-300 mt-2 italic">
                        "{url.challenge_text}"
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm text-purple-400">Created</div>
                    <div className="text-base sm:text-lg font-bold text-white">{formatDate(url.created_at)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
                  <div className="bg-purple-500/10 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center border-2 border-purple-500/20">
                    <div className="text-xs sm:text-sm text-purple-300">Plays</div>
                    <div className="text-2xl sm:text-3xl font-black text-white">{url.total_plays}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center border-2 border-green-500/20">
                    <div className="text-xs sm:text-sm text-green-300">Completed</div>
                    <div className="text-2xl sm:text-3xl font-black text-white">{url.total_completions}</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center border-2 border-orange-500/20">
                    <div className="text-xs sm:text-sm text-orange-300">Difficulty</div>
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-white capitalize">{url.difficulty}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `/leaderboard/${url.short_code}`}
                    className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
                  >
                    📊 View Leaderboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => copyToClipboard(url.short_code)}
                    className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                  >
                    🔗 Copy Link
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && urls.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🤷</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              No URLs yet
            </h2>
            <p className="text-xl text-purple-300 mb-8">
              Create your first link and start trolling people!
            </p>
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-10 py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-2xl"
            >
              🚀 Create URL
            </motion.a>
          </motion.div>
        )}
      </div>
    </div>
  );
};

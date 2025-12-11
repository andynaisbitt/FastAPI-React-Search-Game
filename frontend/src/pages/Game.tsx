/**
 * Game Page - JFGI Edition
 * 12/10 Visual Design - The actual game with stunning UI + MENTAL ROASTING SYSTEM 🔥
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChalkboardCanvas } from '../components/game/ChalkboardCanvas';
import { LeaderboardTable } from '../components/game/LeaderboardTable';
import { useLeaderboardWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import { getUserNickname, setUserNickname } from '../utils/userPreferences';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export const Game: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [currentHintRoast, setCurrentHintRoast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [endMessage, setEndMessage] = useState('');
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const { isConnected, activePlayers, leaderboardData } = useLeaderboardWebSocket(
    shortCode || '',
    {
      onLeaderboardUpdate: (data) => {
        setLeaderboardEntries(data.entries || []);
      }
    }
  );

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      if (!shortCode) return;

      try {
        setLoading(true);
        const data = await api.game.initialize(shortCode);
        setGameData(data);
        setTimeRemaining(data.time_limit);
        setSessionId(data.difficulty_config?.session_id || null);

        // Auto-fill search if enabled (Simple mode)
        if (data.difficulty_config?.auto_fill_search && data.game_question) {
          const keywords = data.game_question.split(' ').slice(0, 5).join(' ');
          setSearchQuery(keywords);
        }

        const leaderboard = await api.game.getLeaderboard(shortCode);
        setLeaderboardEntries(leaderboard.entries || []);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setLoading(false);
      }
    };

    initGame();
  }, [shortCode]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeRemaining]);

  const startGame = () => {
    setGameStarted(true);
  };

  const handleTimeout = async () => {
    setGameStarted(false);
    setEndMessage("⏰ Time's up! Better luck tomorrow.");
    await endGame('timeout', 0);
  };

  const endGame = async (outcome: string, score: number) => {
    if (!shortCode) return;

    try {
      const completionTime = gameData.time_limit - timeRemaining;

      const endGameData: any = {
        outcome,
        score,
        time_remaining: timeRemaining,
        hints_used: hintsUsed,
        attempts: 1,
        completion_time: completionTime,
        submit_to_leaderboard: false
      };

      // Only include session_id if it exists
      if (sessionId) {
        endGameData.session_id = sessionId;
      }

      await api.game.end(shortCode, endGameData);

      setFinalScore(score);
      setShowEndModal(true);
    } catch (err) {
      console.error('Failed to end game:', err);
      showToast('Failed to end game. Your progress was not saved.', 'error');
    }
  };

  const submitToLeaderboard = async (nickname: string) => {
    if (!shortCode) return;

    try {
      // Save nickname for future use
      const cleanNickname = nickname.trim() || 'Anonymous';
      setUserNickname(cleanNickname);

      const completionTime = gameData.time_limit - timeRemaining;

      const leaderboardData: any = {
        outcome: 'completed',
        score: finalScore,
        time_remaining: timeRemaining,
        hints_used: hintsUsed,
        attempts: 1,
        completion_time: completionTime,
        submit_to_leaderboard: true,
        nickname: cleanNickname
      };

      // Only include session_id if it exists
      if (sessionId) {
        leaderboardData.session_id = sessionId;
      }

      await api.game.end(shortCode, leaderboardData);

      const leaderboard = await api.game.getLeaderboard(shortCode);
      setLeaderboardEntries(leaderboard.entries || []);

      setShowEndModal(false);
      setShowLeaderboard(true);
      showToast(`🏆 Score submitted as "${cleanNickname}"!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit to leaderboard', 'error');
    }
  };

  const getHint = async () => {
    if (!shortCode) return;

    try {
      const hintLevel = hintsUsed + 1;
      const response = await api.game.getHint(shortCode, hintLevel);

      setCurrentHint(response.hint);
      setCurrentHintRoast(response.roast);
      setHintsUsed(hintLevel);

      // DEDUCT TIME! (hint penalty)
      setTimeRemaining((prev) => Math.max(0, prev - response.hint_penalty_seconds));

      // Show roast toast
      showToast(response.roast, 'info');

      // Show penalty warning if time deducted
      if (response.hint_penalty_seconds > 0) {
        setTimeout(() => {
          showToast(`⏰ -${response.hint_penalty_seconds}s penalty for using hint!`, 'error');
        }, 2000);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to get hint', 'error');
    }
  };

  const performSearch = async () => {
    if (!shortCode || !searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await api.game.search(shortCode, searchQuery);
      setSearchResults(response.results || []);
      setFallbackMode(response.fallback_mode || false);
      setSearching(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Search failed');
      setSearching(false);
    }
  };

  const submitAnswer = async (selectedUrl: string) => {
    if (!shortCode) return;

    try {
      const response = await api.game.checkAnswer(shortCode, selectedUrl);

      if (response.correct) {
        setGameStarted(false);
        setEndMessage(response.roast); // Use backend roast
        showToast(response.roast, 'success');
        await endGame('completed', response.score);
      } else {
        setEndMessage(response.roast); // Use backend roast
        showToast(response.roast, 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to check answer', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
          />
          <div className="text-3xl text-white font-bold">Loading game...</div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-8xl mb-6">💀</div>
          <div className="text-3xl text-red-400 font-bold mb-6">{error}</div>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl shadow-2xl shadow-purple-500/50 transition-all"
          >
            🏠 Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!gameData) return null;

  const timerColor = timeRemaining < 10 ? 'from-red-500 to-red-600' : timeRemaining < 30 ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-600';
  const timerShadow = timeRemaining < 10 ? 'shadow-red-500/50' : timeRemaining < 30 ? 'shadow-yellow-500/50' : 'shadow-green-500/50';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Chalkboard Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="chalkboard rounded-3xl p-8 mb-6 min-h-[250px] shadow-2xl"
        >
          <ChalkboardCanvas text={gameData.game_question} />
        </motion.div>

        {/* Game Stats Bar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-6xl mx-auto mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Timer */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${timerColor} shadow-2xl ${timerShadow} overflow-hidden`}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <div className="relative z-10 text-center">
                <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Time Left</div>
                <div className="text-4xl font-black text-white">{timeRemaining}s</div>
              </div>
            </motion.div>

            {/* Difficulty */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-2xl shadow-purple-500/50 overflow-hidden"
            >
              <div className="relative z-10 text-center">
                <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Difficulty</div>
                <div className="text-3xl">{gameData.difficulty_config.icon}</div>
                <div className="text-sm font-bold text-white mt-1">{gameData.difficulty_config.name}</div>
              </div>
            </motion.div>

            {/* Hints */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/50 overflow-hidden"
            >
              <div className="relative z-10 text-center">
                <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Hints Used</div>
                <div className="text-4xl font-black text-white">{hintsUsed}/{gameData.max_hints}</div>
              </div>
            </motion.div>

            {/* Active Players */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/50 overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
              />
              <div className="relative z-10 text-center">
                <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Live Players</div>
                <div className="text-4xl font-black text-white">{activePlayers}</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Game Area */}
        {!gameStarted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-20 py-8 rounded-3xl font-black text-4xl text-white overflow-hidden
                       bg-gradient-to-r from-green-600 via-emerald-600 to-green-600
                       shadow-2xl shadow-green-500/50 hover:shadow-green-500/80
                       transition-all duration-300 group"
            >
              {/* Animated glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 opacity-0 group-hover:opacity-30 blur-xl"
                animate={{ backgroundPosition: ['0%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200%' }}
              />

              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              />

              <span className="relative z-10 flex items-center gap-4">
                <span>🚀</span>
                <span>Start Game</span>
              </span>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-xl text-purple-300 italic font-medium"
            >
              {gameData.roast || "Ready to embarrass yourself?"}
            </motion.p>
          </motion.div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-purple-500/20"
            >
              <h3 className="text-2xl font-black text-white mb-5 flex items-center gap-2">
                <span>🔍</span>
                <span>Search for the answer:</span>
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="Type your search query..."
                  className="flex-1 px-8 py-5 rounded-2xl bg-white/10 backdrop-blur border-2 border-purple-500/30
                           text-white text-xl placeholder:text-purple-300/40
                           focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20
                           shadow-lg transition-all duration-300"
                />
                <motion.button
                  onClick={performSearch}
                  disabled={searching || !searchQuery.trim()}
                  whileHover={{ scale: searching ? 1 : 1.05, y: searching ? 0 : -2 }}
                  whileTap={{ scale: searching ? 1 : 0.95 }}
                  className="relative px-10 py-5 rounded-2xl font-black text-xl text-white overflow-hidden
                           bg-gradient-to-r from-blue-600 to-cyan-600
                           disabled:from-gray-600 disabled:to-gray-700
                           shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70
                           transition-all duration-300 group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative z-10">
                    {searching ? '⏳ Searching...' : '🔍 Search'}
                  </span>
                </motion.button>
              </div>

              {/* Search Operators (shown on Simple/Medium difficulty) */}
              {gameData.difficulty_config?.show_search_operators && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-2xl"
                >
                  <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                    <span>🎓</span>
                    <span>Search Operators (Use These!):</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-green-200">
                    <div className="bg-black/30 p-2 rounded-lg">
                      <code className="text-cyan-400 font-mono">site:domain.com</code>
                      <p className="mt-1 text-purple-200">Search specific site</p>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <code className="text-cyan-400 font-mono">intitle:keyword</code>
                      <p className="mt-1 text-purple-200">Search in page title</p>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <code className="text-cyan-400 font-mono">intext:keyword</code>
                      <p className="mt-1 text-purple-200">Search in page text</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Search Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-purple-500/20"
                >
                  <h3 className="text-2xl font-black text-white mb-5 flex items-center gap-2">
                    <span>📋</span>
                    <span>Search Results</span>
                    {fallbackMode && <span className="text-sm font-normal text-yellow-400 ml-2">(Fallback Mode)</span>}
                  </h3>
                  <div className="space-y-4">
                    {searchResults.map((result, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.08, type: 'spring', bounce: 0.4 }}
                        onClick={() => !fallbackMode && submitAnswer(result.url)}
                        whileHover={!fallbackMode ? { scale: 1.02, x: 4 } : {}}
                        className={`relative p-6 rounded-2xl transition-all duration-300 overflow-hidden
                          ${!fallbackMode
                            ? 'cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20'
                            : 'bg-yellow-500/10 border-2 border-yellow-500/50'
                          }`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        />

                        <div className="relative z-10">
                          <div className="text-xl font-bold text-cyan-400 mb-2">{result.title}</div>
                          <div className="text-sm text-green-400 mb-3 font-mono">{result.url}</div>
                          <div className="text-sm text-purple-200 leading-relaxed">{result.snippet}</div>
                          {!fallbackMode && (
                            <div className="mt-3 text-xs text-purple-400 italic font-medium">
                              👆 Click to submit this as your answer
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-purple-500/20"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>💡</span>
                  <span>Need a hint?</span>
                </h3>
                <motion.button
                  onClick={getHint}
                  disabled={hintsUsed >= gameData.max_hints}
                  whileHover={{ scale: hintsUsed < gameData.max_hints ? 1.05 : 1 }}
                  whileTap={{ scale: hintsUsed < gameData.max_hints ? 0.95 : 1 }}
                  className="relative px-8 py-4 rounded-2xl font-black text-lg text-white overflow-hidden
                           bg-gradient-to-r from-yellow-600 to-orange-600
                           disabled:from-gray-600 disabled:to-gray-700
                           shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70
                           transition-all duration-300"
                >
                  Get Hint ({hintsUsed}/{gameData.max_hints})
                </motion.button>
              </div>

              {currentHint && (
                <>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl shadow-xl"
                  >
                    <p className="text-lg text-yellow-100 font-medium leading-relaxed">{currentHint}</p>
                  </motion.div>

                  {/* Hint Roast Message */}
                  {currentHintRoast && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl"
                    >
                      <p className="text-sm text-orange-200 italic text-center">{currentHintRoast}</p>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>

            {/* Leaderboard Toggle */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-12 py-5 rounded-2xl font-black text-xl text-white overflow-hidden
                         bg-gradient-to-r from-purple-600 to-pink-600
                         shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70
                         transition-all duration-300"
              >
                {showLeaderboard ? '👁️ Hide Leaderboard' : '🏆 Show Leaderboard'}
              </motion.button>
            </motion.div>

            {/* Leaderboard */}
            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: -20 }}
                  className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-purple-500/20"
                >
                  <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                    <span>🏆</span>
                    <span>Leaderboard</span>
                    {isConnected && activePlayers > 0 && (
                      <span className="text-base font-normal text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        {activePlayers} {activePlayers === 1 ? 'player' : 'players'} active
                      </span>
                    )}
                  </h3>
                  <LeaderboardTable
                    shortCode={shortCode || ''}
                    entries={leaderboardData.length > 0 ? leaderboardData : leaderboardEntries}
                    showDifficulty={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* End Game Modal */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.8, rotate: 5, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 rounded-3xl shadow-2xl p-10 max-w-lg w-full border-2 border-purple-500/30 overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative z-10">
                <motion.h2
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
                  className="text-5xl font-black mb-4 text-center text-white"
                >
                  {finalScore > 0 ? '🎉 Nice!' : '💀 Rekt'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-purple-300 italic mb-8 text-lg"
                >
                  {endMessage}
                </motion.p>

                <div className="text-center mb-8">
                  <p className="text-xl text-purple-200 mb-3 font-medium">Your Score:</p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', bounce: 0.6 }}
                    className="text-7xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent"
                  >
                    {finalScore.toLocaleString()}
                  </motion.p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/40 rounded-2xl p-5 text-center border-2 border-purple-500/20">
                    <p className="text-sm text-purple-300 font-medium mb-2">Time Used</p>
                    <p className="text-3xl font-black text-white">{gameData.time_limit - timeRemaining}s</p>
                  </div>
                  <div className="bg-black/40 rounded-2xl p-5 text-center border-2 border-purple-500/20">
                    <p className="text-sm text-purple-300 font-medium mb-2">Hints Used</p>
                    <p className="text-3xl font-black text-white">{hintsUsed}</p>
                  </div>
                </div>

                {finalScore > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <input
                      type="text"
                      placeholder="Enter your nickname"
                      id="nickname-input"
                      defaultValue={getUserNickname() === 'Anonymous' ? '' : getUserNickname()}
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border-2 border-purple-500/30 text-white text-lg placeholder:text-purple-300/40 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 mb-4 transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const nickname = input?.value || 'Anonymous';
                          submitToLeaderboard(nickname);
                        }
                      }}
                    />
                    <motion.button
                      onClick={() => {
                        const input = document.getElementById('nickname-input') as HTMLInputElement;
                        const nickname = input?.value || 'Anonymous';
                        submitToLeaderboard(nickname);
                      }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full px-8 py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transition-all"
                    >
                      📊 Submit to Leaderboard
                    </motion.button>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => setShowEndModal(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-4 rounded-2xl font-bold text-lg text-white bg-gray-600 hover:bg-gray-700 shadow-xl transition-all"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl shadow-purple-500/50 transition-all"
                  >
                    🏠 Home
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <motion.div
              className={`relative px-8 py-5 rounded-3xl shadow-2xl border-2 overflow-hidden
                ${toastType === 'success' ? 'bg-green-600/90 border-green-400/50 backdrop-blur-xl' : ''}
                ${toastType === 'error' ? 'bg-red-600/90 border-red-400/50 backdrop-blur-xl' : ''}
                ${toastType === 'info' ? 'bg-purple-600/90 border-purple-400/50 backdrop-blur-xl' : ''}
              `}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="relative z-10 text-white font-bold text-lg text-center">
                {toastMessage}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

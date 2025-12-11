/**
 * Solo Play Page
 * Generate random challenges for practice
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const SoloPlay: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const handleStartGame = async () => {
    setLoading(true);

    try {
      // Create a random challenge
      const randomUrls = [
        'https://www.wikipedia.org',
        'https://www.github.com',
        'https://www.stackoverflow.com',
        'https://www.reddit.com',
        'https://www.youtube.com',
      ];

      const randomUrl = randomUrls[Math.floor(Math.random() * randomUrls.length)];

      const response = await api.urls.create({
        long_url: randomUrl,
        difficulty: selectedDifficulty,
        challenge_text: 'Can you find this popular website?',
      });

      // Navigate to the game page
      navigate(`/${response.short_code}`);
    } catch (err) {
      alert('Failed to start game: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const difficulties = [
    { value: 'simple', label: 'Simple', emoji: '😊', time: '60s', description: 'Easy questions, perfect for beginners' },
    { value: 'medium', label: 'Medium', emoji: '🤔', time: '120s', description: 'Moderate challenge, requires thinking' },
    { value: 'hard', label: 'Hard', emoji: '😰', time: '180s', description: 'Tough questions, for experienced players' },
    { value: 'expert', label: 'Expert', emoji: '💀', time: '300s', description: 'Extreme difficulty, only for pros' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-20 md:pt-24">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">🎮 Solo Play</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Practice with random challenges
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Choose Your Difficulty</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setSelectedDifficulty(diff.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedDifficulty === diff.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-4xl">{diff.emoji}</span>
                  <div>
                    <div className="font-bold text-xl">{diff.label}</div>
                    <div className="text-sm text-gray-500">{diff.time} time limit</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {diff.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartGame}
          disabled={loading}
          className="w-full px-12 py-6 rounded-xl font-bold text-white text-2xl
                   bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                   disabled:from-gray-400 disabled:to-gray-500
                   transform hover:scale-105 active:scale-95
                   transition-all duration-200 shadow-2xl"
        >
          {loading ? 'Starting Game...' : '🚀 Start Game'}
        </button>

        {/* Info */}
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p>
            A random challenge will be generated for you based on your selected difficulty.
          </p>
          <p className="mt-2 text-sm">
            Your score will be saved to the global leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Page
 * Shows user stats and recent games
 */
export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen p-8 pt-20 md:pt-24">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-5xl font-bold mb-8">📊 Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="text-4xl mb-2">🎮</div>
            <div className="text-3xl font-bold mb-1">24</div>
            <div className="text-gray-600 dark:text-gray-400">Games Played</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-3xl font-bold mb-1">18</div>
            <div className="text-gray-600 dark:text-gray-400">Wins</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-3xl font-bold mb-1">75%</div>
            <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
          <p className="text-gray-600 dark:text-gray-400">No games played yet. Start playing to see your history!</p>
        </div>
      </div>
    </div>
  );
};

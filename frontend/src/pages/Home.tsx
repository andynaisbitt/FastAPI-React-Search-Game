/**
 * Home Page - JFGI Edition
 * 12/10 Visual Design
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

const roasts = [
  "Let me Google that for you... oh wait",
  "Your mom could find this faster",
  "Did you even TRY searching first?",
];

export const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.urls.create({ long_url: url, difficulty });
      setResult(res);
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const diffs = [
    {
      id: 'simple',
      label: 'Baby Mode',
      emoji: '🍼',
      gradient: 'from-emerald-400 via-green-500 to-emerald-600',
      shadow: 'shadow-emerald-500/50',
      glow: 'hover:shadow-emerald-500/80'
    },
    {
      id: 'medium',
      label: 'Average Joe',
      emoji: '🤔',
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      shadow: 'shadow-yellow-500/50',
      glow: 'hover:shadow-yellow-500/80'
    },
    {
      id: 'hard',
      label: 'Try Hard',
      emoji: '😰',
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      shadow: 'shadow-red-500/50',
      glow: 'hover:shadow-red-500/80'
    },
    {
      id: 'expert',
      label: 'Big Brain',
      emoji: '💀',
      gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
      shadow: 'shadow-purple-500/50',
      glow: 'hover:shadow-purple-500/80'
    },
  ];

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-8xl font-black mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-2xl"
            animate={{
              backgroundPosition: ['0%', '200%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200%' }}
          >
            JFGI
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-purple-300 font-bold tracking-wide"
          >
            Just Fucking Google It
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-md text-purple-400 mt-2 italic"
          >
            Make lazy people work for their answers 😤
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* URL Input */}
          <motion.div
            whileFocus={{ scale: 1.01 }}
            className="relative"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the URL they're too lazy to Google..."
              required
              className="w-full px-8 py-6 rounded-2xl bg-black/40 backdrop-blur-xl border-2 border-purple-500/30
                       text-white text-xl placeholder:text-purple-300/40
                       focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20
                       shadow-2xl shadow-purple-500/10
                       transition-all duration-300"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-pink-500/0 pointer-events-none" />
          </motion.div>

          {/* Difficulty Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {diffs.map((d, idx) => (
              <motion.button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 + idx * 0.1, type: 'spring', bounce: 0.6 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-6 rounded-2xl font-bold text-white transition-all duration-300 overflow-hidden
                  ${difficulty === d.id
                    ? `bg-gradient-to-br ${d.gradient} shadow-2xl ${d.shadow} ring-4 ring-white/30`
                    : 'bg-white/5 hover:bg-white/10 shadow-lg border-2 border-white/10'
                  }`}
              >
                {/* Glow effect for selected */}
                {difficulty === d.id && (
                  <motion.div
                    layoutId="selected-glow"
                    className={`absolute inset-0 bg-gradient-to-br ${d.gradient} opacity-50 blur-xl`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-2">{d.emoji}</div>
                  <div className="text-base font-black tracking-wide">{d.label}</div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative w-full py-7 rounded-2xl font-black text-3xl text-white overflow-hidden
                     bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600
                     shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300
                     group"
          >
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-30"
              animate={{ backgroundPosition: ['0%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200%' }}
            />

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
            />

            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Make That Link</span>
                </>
              )}
            </span>
          </motion.button>
        </motion.form>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ scale: 0, rotate: 180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: -180, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              className="mt-8 p-8 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20
                       backdrop-blur-xl rounded-3xl border-2 border-green-400/50
                       shadow-2xl shadow-green-500/20 relative overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-3 flex items-center gap-3">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    ✅
                  </motion.span>
                  Link Created!
                </h3>
                <p className="text-purple-300 mb-5 italic text-lg">
                  {roasts[Math.floor(Math.random() * roasts.length)]}
                </p>
                <motion.a
                  href={`/${result.short_code}`}
                  target="_blank"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="block p-6 bg-black/40 rounded-2xl font-mono text-xl text-cyan-300 hover:text-cyan-200
                           break-all transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/50
                           shadow-xl hover:shadow-cyan-500/30"
                >
                  {window.location.origin}/{result.short_code}
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

/**
 * Hamburger Menu - JFGI Edition
 * Sick slide-out navigation with theme switcher
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';

export const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, availableThemes } = useThemeStore();

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠', gradient: 'from-purple-600 to-pink-600' },
    { path: '/play', label: 'Solo Play', icon: '🎮', gradient: 'from-blue-600 to-cyan-600' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆', gradient: 'from-yellow-500 to-orange-500' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊', gradient: 'from-green-600 to-emerald-600' },
    { path: '/my-urls', label: 'My URLs', icon: '🔗', gradient: 'from-indigo-600 to-purple-600' },
    { path: '/how-it-works', label: 'How It Works', icon: '❓', gradient: 'from-pink-600 to-rose-600' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-6 left-6 z-40 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 hover:border-purple-400/50 transition-all"
      >
        <div className="space-y-2">
          <motion.div className="w-8 h-1 bg-white rounded-full" />
          <motion.div className="w-8 h-1 bg-white rounded-full" />
          <motion.div className="w-8 h-1 bg-white rounded-full" />
        </div>
      </motion.button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                {/* Close Button */}
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <div className="text-2xl text-white">✕</div>
                </motion.button>

                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                    JFGI
                  </h1>
                  <p className="text-sm text-purple-300 mt-1">Just Fucking Google It</p>
                </motion.div>

                {/* Navigation Items */}
                <div className="space-y-3 mb-8">
                  {menuItems.map((item, idx) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => handleNavigate(item.path)}
                        whileHover={{ scale: 1.03, x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full p-4 rounded-2xl text-left font-bold text-lg transition-all flex items-center gap-3 relative overflow-hidden
                          ${isActive
                            ? `bg-gradient-to-r ${item.gradient} shadow-xl text-white`
                            : 'bg-white/5 hover:bg-white/10 text-purple-200'
                          }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                            transition={{ type: 'spring', bounce: 0.2 }}
                          />
                        )}
                        <span className="text-3xl">{item.icon}</span>
                        <span className="relative z-10">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Theme Switcher */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="border-t-2 border-purple-500/20 pt-6"
                >
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3">
                    Theme
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {availableThemes.map((t) => (
                      <motion.button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                          ${theme === t.id
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 text-purple-200'
                          }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span>{t.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 pt-6 border-t-2 border-purple-500/20 text-center text-xs text-purple-400"
                >
                  <p>Made with 💀 and sarcasm</p>
                  <p className="mt-1">v2.0.0</p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

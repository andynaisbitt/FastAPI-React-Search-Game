/**
 * Navigation Component
 * Mobile-friendly navigation with hamburger menu
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/play', label: 'Solo Play', icon: '🎮' },
    { path: '/leaderboard', label: 'Leaderboards', icon: '🏆' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/create', label: 'Create URL', icon: '✨' },
    { path: '/about', label: 'About', icon: 'ℹ️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-gray-800 dark:bg-gray-700 text-white shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-gray-900 dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              JFGI
            </Link>

            {/* Nav Items */}
            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />

            {/* Slide-in Menu */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-gray-900 dark:bg-gray-800 shadow-2xl z-40 md:hidden overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="p-6 border-b border-gray-700">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="text-3xl font-bold text-white hover:text-blue-400 transition-colors"
                >
                  Just Fucking Google It
                </Link>
                <p className="text-gray-400 text-sm mt-2">
                  URL shortener with a challenge twist
                </p>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold text-lg">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700 bg-gray-800">
                <p className="text-gray-400 text-sm text-center">
                  Made with 🔥 by TheITApprentice
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

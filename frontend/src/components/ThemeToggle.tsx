/**
 * Theme Toggle Component
 * Allows users to switch between light/dark/seasonal themes
 */
import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { themes, type ThemeId } from '../themes/themes';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    document.documentElement.className = theme === 'light' ? '' : theme;
  }, [theme]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   transition-all duration-200"
      >
        {Object.values(themes).map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

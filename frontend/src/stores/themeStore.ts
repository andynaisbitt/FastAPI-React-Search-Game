/**
 * Theme Store (Zustand)
 * Manages global theme state
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../themes/themes';
import { detectSeasonalTheme } from '../themes/themes';

interface ThemeOption {
  id: ThemeId;
  name: string;
  icon: string;
}

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
  availableThemes: ThemeOption[];
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initialize with seasonal theme or user preference
      theme: detectSeasonalTheme(),

      // Available themes with icons
      availableThemes: [
        { id: 'light', name: 'Light', icon: '☀️' },
        { id: 'dark', name: 'Dark', icon: '🌙' },
        { id: 'christmas', name: 'Xmas', icon: '🎄' },
        { id: 'newyear', name: 'New Year', icon: '🎉' },
      ],

      // Set specific theme
      setTheme: (theme: ThemeId) => {
        set({ theme });
        // Apply theme class to document
        document.documentElement.className = theme === 'light' ? '' : theme;
      },

      // Toggle between light and dark
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'jfgi-theme', // localStorage key
    }
  )
);

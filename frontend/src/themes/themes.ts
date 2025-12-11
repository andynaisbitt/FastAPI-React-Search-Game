/**
 * Theme definitions for JFGI
 * Supports light, dark, and seasonal themes
 */

export type ThemeId = 'light' | 'dark' | 'christmas' | 'newyear';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    chalkboardBg: string;
    chalkboardText: string;
    accent: string;
  };
  animations?: {
    particles?: 'snow' | 'confetti' | 'fireworks';
    chalkboard?: 'classic' | 'neon';
  };
}

export const themes: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      background: '#fafafa',
      text: '#1a1a1a',
      chalkboardBg: '#2F5233', // Classic green chalkboard
      chalkboardText: '#ffffff',
      accent: '#2563eb',
    },
  },

  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      background: '#0a0a0a',
      text: '#f5f5f5',
      chalkboardBg: '#1a1a1a', // Black chalkboard
      chalkboardText: '#f5f5f5',
      accent: '#3b82f6',
    },
  },

  christmas: {
    id: 'christmas',
    name: 'Christmas 🎄',
    colors: {
      primary: '#0f1419',
      secondary: '#1a2027',
      background: '#0a0e13',
      text: '#f5f5f5',
      chalkboardBg: '#165a3c', // Christmas green
      chalkboardText: '#ffffff',
      accent: '#ff0000', // Red
    },
    animations: {
      particles: 'snow', // Falling snowflakes
    },
  },

  newyear: {
    id: 'newyear',
    name: 'New Year 🎉',
    colors: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      background: '#000000',
      text: '#ffd700', // Gold
      chalkboardBg: '#1a1a1a',
      chalkboardText: '#ffd700',
      accent: '#ffd700',
    },
    animations: {
      particles: 'confetti', // Falling confetti
      chalkboard: 'neon', // Glowing neon effect
    },
  },
};

/**
 * Detect seasonal theme based on current date
 */
export const detectSeasonalTheme = (): ThemeId => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // December 1-31: Christmas theme
  if (month === 12) return 'christmas';

  // January 1-7: New Year theme
  if (month === 1 && day <= 7) return 'newyear';

  // Default: system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

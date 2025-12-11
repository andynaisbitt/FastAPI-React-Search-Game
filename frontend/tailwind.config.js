/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Chalkboard theme colors
        chalkboard: {
          green: '#2F5233',
          black: '#1a1a1a',
          chalk: '#F5F5F5',
          yellow: '#FFD700',
        },
        // Seasonal themes
        christmas: {
          green: '#165a3c',
          red: '#ff0000',
        },
        newyear: {
          gold: '#ffd700',
          black: '#0a0a0a',
        }
      },
      fontFamily: {
        chalk: ['"Architects Daughter"', 'cursive'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      animation: {
        'chalk-write': 'chalkWrite 0.5s ease-out',
        'snow-fall': 'snowFall 10s linear infinite',
        'confetti-fall': 'confettiFall 5s linear infinite',
      },
      keyframes: {
        chalkWrite: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        snowFall: {
          '0%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

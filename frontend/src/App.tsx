/**
 * Main App Component
 * Entry point for JFGI frontend application
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Game } from './pages/Game';
import { Leaderboard } from './pages/Leaderboard';
import { Dashboard } from './pages/Dashboard';
import { SoloPlay } from './pages/SoloPlay';
import { MyURLs } from './pages/MyURLs';
import { HowItWorks } from './pages/HowItWorks';
import { HamburgerMenu } from './components/HamburgerMenu';
import { useThemeStore } from './stores/themeStore';

function App() {
  const theme = useThemeStore((state) => state.theme);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.className = theme === 'light' ? '' : theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="app">
        <HamburgerMenu />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<SoloPlay />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-urls" element={<MyURLs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/create" element={<Home />} />
          <Route path="/game/:shortCode" element={<Game />} />
          <Route path="/:shortCode" element={<Game />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

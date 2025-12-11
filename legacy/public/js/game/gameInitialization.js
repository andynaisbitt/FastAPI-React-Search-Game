// public/js/game/gameInitialization.js

document.addEventListener('DOMContentLoaded', function() {
    const gameStateData = document.getElementById('gameStateData');
    if (!gameStateData) {
      console.error('Game state data element not found');
      return;
    }

    const gameData = {
      uniqueId: decodeURIComponent(gameStateData.dataset.uniqueId || ''),
      shortCode: decodeURIComponent(gameStateData.dataset.shortCode || ''),
      longUrl: decodeURIComponent(gameStateData.dataset.longUrl || ''),
      gameQuestion: decodeURIComponent(gameStateData.dataset.gameQuestion || ''),
      searchOperators: JSON.parse(decodeURIComponent(gameStateData.dataset.searchOperators || '[]')),
      difficulty: gameStateData.dataset.difficulty || 'medium',
      timeLimit: parseInt(gameStateData.dataset.timeLimit, 10) || 120,
      maxHints: parseInt(gameStateData.dataset.maxHints, 10) || 3,
      sessionId: gameStateData.dataset.sessionId || null,
      adsEnabled: gameStateData.dataset.adsEnabled === 'true',
    };

    console.log('[GAME] Game data loaded:', {
      difficulty: gameData.difficulty,
      timeLimit: gameData.timeLimit,
      maxHints: gameData.maxHints,
      adsEnabled: gameData.adsEnabled,
    });

    if (typeof window.initGame === 'function') {
      window.initGame(gameData);
    } else {
      console.error('initGame function not found');
    }
  });
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
    };
  
    if (typeof window.initGame === 'function') {
      window.initGame(gameData);
    } else {
      console.error('initGame function not found');
    }
  });
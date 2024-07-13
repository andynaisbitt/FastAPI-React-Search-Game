// /js/game/gameState.js
(function() {
    const gameStateData = document.getElementById('gameStateData');
    
    window.gameState = {
      uniqueId: gameStateData.dataset.uniqueId,
      shortCode: gameStateData.dataset.shortCode,
      longUrl: gameStateData.dataset.longUrl,
      gameQuestion: gameStateData.dataset.gameQuestion,
      searchOperators: JSON.parse(gameStateData.dataset.searchOperators || '[]'),
      score: 0,
      timeLeft: 30,
      currentHintLevel: 0,
      gameActive: false
    };
  })();
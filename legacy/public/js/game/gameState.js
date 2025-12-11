// /js/game/gameState.js
(function() {
    const gameStateData = document.getElementById('gameStateData');

    // Read difficulty-based configuration from gameStateData
    const difficulty = gameStateData.dataset.difficulty || 'medium';
    const timeLimit = parseInt(gameStateData.dataset.timeLimit, 10) || 120;
    const maxHints = parseInt(gameStateData.dataset.maxHints, 10) || 3;
    const sessionId = gameStateData.dataset.sessionId || null;
    const adsEnabled = gameStateData.dataset.adsEnabled === 'true';

    window.gameState = {
      uniqueId: gameStateData.dataset.uniqueId,
      shortCode: gameStateData.dataset.shortCode,
      longUrl: gameStateData.dataset.longUrl,
      gameQuestion: gameStateData.dataset.gameQuestion,
      searchOperators: JSON.parse(gameStateData.dataset.searchOperators || '[]'),
      difficulty: difficulty,
      timeLimit: timeLimit,
      totalTime: timeLimit,
      timeLeft: timeLimit,
      maxHints: maxHints,
      sessionId: sessionId,
      adsEnabled: adsEnabled,
      score: 0,
      currentHintLevel: 0,
      gameActive: false
    };

    console.log(`[GAME] Initialized with difficulty: ${difficulty}, time limit: ${timeLimit}s, max hints: ${maxHints}`);
  })();
// public/js/game/gameScore.js

function initGameScore() {
  try {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = window.gameState.score;
      console.log('Game score initialized successfully');
    } else {
      throw new Error('Score element not found');
    }
  } catch (error) {
    console.error('Error initializing game score:', error);
    throw error;
  }
}

function updateScore(points) {
  window.gameState.score += points;
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = window.gameState.score;
  } else {
    console.error('Score element not found');
  }
}

// Export functions to the global scope
window.initGameScore = initGameScore;
window.updateScore = updateScore;
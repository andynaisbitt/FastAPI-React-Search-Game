// public/js/game/gameTimer.js
let gameTimer;

function initGameTimer() {
  try {
    const timerElement = document.querySelector('.game-timer');
    if (timerElement) {
      window.gameState.totalTime = parseInt(timerElement.dataset.totalTime, 10) || 30;
      window.gameState.timeLeft = window.gameState.totalTime;
      updateTimerDisplay();
      console.log('Game timer initialized successfully');
    } else {
      throw new Error('Timer element not found');
    }
  } catch (error) {
    console.error('Error initializing game timer:', error);
    throw error;
  }
}

function startGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  gameTimer = setInterval(updateTimer, 1000);
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

function updateTimer() {
  if (window.gameState.timeLeft > 0) {
    window.gameState.timeLeft--;
    updateTimerDisplay();
  } else {
    stopGameTimer();
    if (typeof window.endGame === 'function') {
      window.endGame(false);
    } else {
      console.error('endGame function not found');
    }
  }
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  const progressBar = document.getElementById('progress');
  if (timerElement) {
    timerElement.textContent = window.gameState.timeLeft;
  } else {
    console.error('Timer display element not found');
  }
  if (progressBar) {
    progressBar.style.width = `${(window.gameState.timeLeft / window.gameState.totalTime) * 100}%`;
  } else {
    console.error('Progress bar element not found');
  }
}

function resetTimer() {
  stopGameTimer();
  window.gameState.timeLeft = window.gameState.totalTime;
  updateTimerDisplay();
}

// Export functions to the global scope
window.initGameTimer = initGameTimer;
window.startGameTimer = startGameTimer;
window.stopGameTimer = stopGameTimer;
window.resetTimer = resetTimer;
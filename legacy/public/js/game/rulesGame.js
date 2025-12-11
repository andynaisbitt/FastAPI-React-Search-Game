// public/js/game/rulesGame.js
function initRulesGame() {
  const rulesGame = document.querySelector('.rules-game');
  const countdownTimer = document.getElementById('countdown-timer');
  const startGameBtn = document.getElementById('start-game-btn');
  const skipRulesBtn = document.getElementById('skip-rules-btn');
  let countdown = 5;
  let countdownInterval;

  function startCountdown() {
    countdownInterval = setInterval(() => {
      if (countdownTimer) {
        countdownTimer.textContent = countdown;
      }
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownInterval);
        startGame();
      }
    }, 1000);
  }

  function startGame() {
    if (rulesGame) {
      rulesGame.style.display = 'none';
    }
    if (typeof window.showGameArea === 'function') {
      window.showGameArea();
    } else {
      console.error('showGameArea function is not defined');
    }
  }

  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      clearInterval(countdownInterval);
      startGame();
    });
  }

  if (skipRulesBtn) {
    skipRulesBtn.addEventListener('click', () => {
      clearInterval(countdownInterval);
      startGame();
    });
  }

  startCountdown();
}

window.initRulesGame = initRulesGame;
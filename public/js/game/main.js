// public/js/game/main.js

window.gameState = {
  uniqueId: '',
  shortCode: '',
  longUrl: '',
  gameQuestion: '',
  searchOperators: [],
  score: 0,
  timeLeft: 30,
  totalTime: 30,
  currentHintLevel: 0,
  gameActive: false
};

let gameInitialized = false;

function initGame(data) {
  if (gameInitialized) return;
  gameInitialized = true;

  // Initialize game state
  window.gameState = {
    ...window.gameState,
    ...data,
    score: 0,
    timeLeft: window.gameState.totalTime,
    currentHintLevel: 0,
    gameActive: false
  };

  // Setup event listeners
  setupEventListeners();
  // Initial UI update
  updateGameUI();
}

function setupEventListeners() {
  const elements = {
    startGameBtn: document.getElementById('start-game-btn'),
    searchForm: document.getElementById('search-form'),
    getHintBtn: document.getElementById('get-hint-btn'),
    submitAnswerBtn: document.getElementById('submit-answer-btn'),
    restartGameBtn: document.getElementById('restartButton')
  };

  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.warn(`Element '${key}' not found in the DOM`);
      continue;
    }

    switch (key) {
      case 'startGameBtn':
        element.addEventListener('click', startGame);
        break;
      case 'searchForm':
        element.addEventListener('submit', handleSearch);
        break;
      case 'getHintBtn':
        element.addEventListener('click', getHint);
        break;
      case 'submitAnswerBtn':
        element.addEventListener('click', submitAnswer);
        break;
      case 'restartGameBtn':
        element.addEventListener('click', restartGame);
        break;
    }
  }
}

function startGame() {
  if (window.gameState.gameActive) return; // Prevent starting multiple games
  window.gameState.gameActive = true;
  resetScore();
  resetTimer();
  resetHintLevel();
  startGameTimer();
  enableGameComponents();
  window.showGameArea();
  updateGameUI();
}

function handleSearch(event) {
  event.preventDefault();
  if (!window.gameState.gameActive) return;

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    const query = searchInput.value;
    performSearch(query, 1);
  }
}

function getHint() {
  if (!window.gameState.gameActive) return;

  window.gameState.currentHintLevel++;
  fetchHint(window.gameState.currentHintLevel);
  updateGameUI();
}

function submitAnswer() {
  if (!window.gameState.gameActive) return;

  const selectedAnswer = document.querySelector('input[name="search-result"]:checked');
  if (selectedAnswer) {
    checkAnswer(selectedAnswer.value);
  } else {
    displaySearchError('Please select an answer before submitting.');
  }
}

function restartGame() {
  hideEndGameModal();
  window.gameState.gameActive = false;
  startGame();
}

function enableGameComponents() {
  const elements = {
    searchForm: document.getElementById('search-form'),
    getHintBtn: document.getElementById('get-hint-btn'),
    submitAnswerBtn: document.getElementById('submit-answer-btn')
  };

  for (const [key, element] of Object.entries(elements)) {
    if (element) {
      element.disabled = false;
    } else {
      console.warn(`Element '${key}' not found when enabling game components`);
    }
  }
}

function endGame(success) {
  window.gameState.gameActive = false;
  stopGameTimer();
  showEndGameModal(success);
  updateGameUI();
}

function updateScore(points) {
  window.gameState.score += points;
  updateGameUI();
}

function resetScore() {
  window.gameState.score = 0;
  updateScore(0);
}

function updateHintButton() {
  const hintButton = document.getElementById('get-hint-btn');
  if (hintButton) {
    if (window.gameState.currentHintLevel >= 3) {
      hintButton.disabled = true;
      hintButton.textContent = 'No more hints';
    } else {
      hintButton.disabled = false;
      hintButton.textContent = 'Get a hint';
    }
  } else {
    console.warn('Hint button not found when updating');
  }
}

function resetHintLevel() {
  window.gameState.currentHintLevel = 0;
  updateHintButton();
}

function resetTimer() {
  window.gameState.timeLeft = window.gameState.totalTime;
  updateGameUI();
}

function updateGameUI() {
  // Update score
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = window.gameState.score;
  } else {
    console.warn('Score element not found when updating UI');
  }

  // Update timer
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = window.gameState.timeLeft;
  } else {
    console.warn('Timer element not found when updating UI');
  }

  // Update hint button
  updateHintButton();

  // Update game question
  const questionElement = document.getElementById('game-question');
  if (questionElement) {
    questionElement.textContent = window.gameState.gameQuestion;
  } else {
    console.warn('Game question element not found when updating UI');
  }

  // Update game state visibility
  const gameAreaElement = document.getElementById('game-area');
  const rulesAreaElement = document.getElementById('rules-area');
  if (gameAreaElement && rulesAreaElement) {
    if (window.gameState.gameActive) {
      gameAreaElement.style.display = 'block';
      rulesAreaElement.style.display = 'none';
    } else {
      gameAreaElement.style.display = 'none';
      rulesAreaElement.style.display = 'block';
    }
  } else {
    console.warn('Game area or rules area elements not found when updating UI');
  }
}

// Expose necessary functions to the global scope
window.initGame = initGame;
window.endGame = endGame;
window.updateScore = updateScore;
window.restartGame = restartGame;
window.startGame = startGame;

// These functions are assumed to be defined in other files
function performSearch(query, page) { /* Implementation in gameSearch.js */ }
function fetchHint(level) { /* Implementation in gameHint.js */ }
function checkAnswer(answer) { /* Implementation to be added */ }
function displaySearchError(message) { /* Implementation to be added */ }
function hideEndGameModal() { /* Implementation in endGameModal.js */ }
function startGameTimer() { /* Implementation in gameTimer.js */ }
function stopGameTimer() { /* Implementation in gameTimer.js */ }
function showEndGameModal(success) { /* Implementation in endGameModal.js */ }

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameStateData = document.getElementById('gameStateData');
  if (!gameStateData) {
    console.error('Game state data element not found');
    return;
  }

  const gameData = {
    uniqueId: gameStateData.dataset.uniqueId || '',
    shortCode: gameStateData.dataset.shortCode || '',
    longUrl: gameStateData.dataset.longUrl || '',
    gameQuestion: gameStateData.dataset.gameQuestion || '',
    searchOperators: JSON.parse(gameStateData.dataset.searchOperators || '[]'),
  };
  initGame(gameData);
});
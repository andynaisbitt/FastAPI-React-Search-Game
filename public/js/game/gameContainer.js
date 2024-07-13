// public/js/game/gameContainer.js

let gameContainer;
let loadingSpinner;
let errorMessage;
let rulesArea;
let gameArea;

function initGameContainer() {
  gameContainer = document.getElementById('gameContainer');
  if (!gameContainer) {
    console.error('Game container not found');
    return;
  }

  rulesArea = document.getElementById('rulesArea');
  gameArea = document.getElementById('gameArea');

  if (!rulesArea || !gameArea) {
    console.error('Required game elements not found');
    return;
  }

  loadingSpinner = createLoadingSpinner();
  errorMessage = createErrorMessage();

  gameContainer.appendChild(loadingSpinner);

  initializeGameComponents()
    .then(() => {
      loadingSpinner.style.display = 'none';
      if (typeof window.initGame === 'function') {
        const gameData = getGameData();
        window.initGame(gameData);
      } else {
        throw new Error('initGame function is not defined');
      }
    })
    .catch((error) => {
      console.error('Error initializing game:', error);
      displayErrorMessage('Oops! Something went wrong while loading the game. Please try again.');
    });
}

async function initializeGameComponents() {
  // Initialize gameState first
  if (typeof window.initGame === 'function') {
    const gameData = getGameData();
    window.initGame(gameData);
  } else {
    throw new Error('initGame function is not defined');
  }

  const components = [
    'initRulesGame',
    'initGameTimer',
    'initGameScore',
    'initGameSearch',
    'initGameHint',
    'initEndGameModal',
    'initChalkboard'
  ];

  for (const component of components) {
    if (typeof window[component] === 'function') {
      try {
        await window[component]();
      } catch (error) {
        console.error(`Error initializing ${component}:`, error);
        throw error;
      }
    } else {
      console.warn(`${component} function is not defined`);
    }
  }
}

function getGameData() {
  const gameStateData = document.getElementById('gameStateData');
  if (!gameStateData) {
    console.error('Game state data element not found');
    return {};
  }

  return {
    uniqueId: decodeURIComponent(gameStateData.dataset.uniqueId || ''),
    shortCode: decodeURIComponent(gameStateData.dataset.shortCode || ''),
    longUrl: decodeURIComponent(gameStateData.dataset.longUrl || ''),
    gameQuestion: decodeURIComponent(gameStateData.dataset.gameQuestion || ''),
    searchOperators: JSON.parse(decodeURIComponent(gameStateData.dataset.searchOperators || '[]')),
  };
}

function createLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.classList.add('loading-spinner');
  spinner.innerHTML = `
    <div class="spinner">
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    </div>
    <p>Loading game components...</p>
  `;
  return spinner;
}

function createErrorMessage() {
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('error-message');
  return errorDiv;
}

function displayErrorMessage(message) {
  errorMessage.textContent = message;
  gameContainer.innerHTML = '';
  gameContainer.appendChild(errorMessage);
}

function showGameArea() {
  if (rulesArea && gameArea) {
    rulesArea.style.display = 'none';
    gameArea.style.display = 'block';
  } else {
    console.error('Game areas not found');
  }
}

function hideGameArea() {
  if (rulesArea && gameArea) {
    gameArea.style.display = 'none';
    rulesArea.style.display = 'block';
  } else {
    console.error('Game areas not found');
  }
}

// Expose necessary functions to the global scope
window.showGameArea = showGameArea;
window.hideGameArea = hideGameArea;

// Initialize the game container when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGameContainer);
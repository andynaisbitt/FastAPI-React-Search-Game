function initGameHint() {
  const getHintBtn = document.getElementById('get-hint-btn');
  const hintElement = document.getElementById('hintText');

  if (!getHintBtn || !hintElement) {
    console.warn('Hint elements not found. They will be initialized when available.');
    const observer = new MutationObserver((mutations, obs) => {
      const getHintBtn = document.getElementById('get-hint-btn');
      const hintElement = document.getElementById('hintText');
      if (getHintBtn && hintElement) {
        setupHintFunctionality(getHintBtn, hintElement);
        obs.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    setupHintFunctionality(getHintBtn, hintElement);
  }

  console.log('Game hint initialized successfully');
}

function setupHintFunctionality(getHintBtn, hintElement) {
  getHintBtn.addEventListener('click', () => fetchHint(hintElement));
}

async function fetchHint(hintElement) {
  try {
    const response = await fetch(`/game/${window.gameState.uniqueId}/${window.gameState.shortCode}/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hintLevel: window.gameState.currentHintLevel + 1 }),
    });

    if (response.ok) {
      const data = await response.json();
      displayHint(data.hint, hintElement);
      window.gameState.currentHintLevel++;
      updateHintButton();
    } else {
      throw new Error('Error retrieving hint');
    }
  } catch (error) {
    console.error('Error retrieving hint:', error);
    displayHintError('An error occurred while retrieving the hint.', hintElement);
  }
}

function displayHint(hint, hintElement) {
  hintElement.textContent = hint;
}

function displayHintError(message, hintElement) {
  hintElement.textContent = message;
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
  }
}

window.initGameHint = initGameHint;
window.updateHintButton = updateHintButton;
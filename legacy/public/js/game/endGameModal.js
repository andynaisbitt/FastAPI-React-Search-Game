// public/js/game/endGameModal.js
function initEndGameModal() {
  const endGameModal = document.getElementById('endGameModal');
  const endGameMessage = document.getElementById('endGameMessage');
  const finalScore = document.getElementById('finalScore');
  const originalUrlContainer = document.getElementById('originalUrlContainer');
  const originalUrlLink = document.getElementById('originalUrlLink');
  const restartGameBtn = document.getElementById('restartButton');
  const twitterShareBtn = document.getElementById('twitterShareButton');
  const facebookShareBtn = document.getElementById('facebookShareButton');

  if (!endGameModal || !endGameMessage || !finalScore || !originalUrlContainer || !originalUrlLink || !restartGameBtn || !twitterShareBtn || !facebookShareBtn) {
    console.error('Required elements for end game modal not found');
    return;
  }

  async function showEndGameModal(success) {
    const message = success
      ? 'Congratulations! You found the original URL.'
      : "Time's up! You didn't find the original URL.";

    endGameMessage.textContent = message;
    finalScore.textContent = window.gameState.score;

    if (window.gameState.longUrl) {
      originalUrlLink.href = window.gameState.longUrl;
      originalUrlLink.textContent = window.gameState.longUrl;
      originalUrlContainer.style.display = 'block';
    } else {
      originalUrlContainer.style.display = 'none';
    }

    // Track game completion to backend
    await trackGameEnd(success);

    endGameModal.style.display = 'block';
    endGameModal.classList.add('modal-show');
  }

  async function trackGameEnd(success) {
    try {
      const outcome = success ? 'completed' : (window.gameState.timeLeft === 0 ? 'timeout' : 'failed');
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      const response = await fetch(`/game/${window.gameState.uniqueId}/${window.gameState.shortCode}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          outcome: outcome,
          score: window.gameState.score,
          timeLeft: window.gameState.timeLeft,
          submitToLeaderboard: false,
        }),
      });

      if (response.ok) {
        console.log('[GAME] Game completion tracked successfully');
      } else {
        console.error('[GAME] Failed to track game completion');
      }
    } catch (error) {
      console.error('[GAME] Error tracking game end:', error);
    }
  }

  function hideEndGameModal() {
    endGameModal.classList.add('modal-hide');
    setTimeout(() => {
      endGameModal.style.display = 'none';
      endGameModal.classList.remove('modal-hide');
    }, 300);
  }

  restartGameBtn.addEventListener('click', () => {
    hideEndGameModal();
    if (typeof window.restartGame === 'function') {
      window.restartGame();
    } else {
      console.error('restartGame function is not defined');
    }
  });

  twitterShareBtn.addEventListener('click', () => {
    shareGameResult('twitter');
  });

  facebookShareBtn.addEventListener('click', () => {
    shareGameResult('facebook');
  });

  function shareGameResult(platform) {
    const score = window.gameState.score;
    const originalUrl = window.gameState.longUrl;
    const shareUrl = getShareUrl(platform, score, originalUrl);
    window.open(shareUrl, '_blank');
  }

  function getShareUrl(platform, score, originalUrl) {
    const shareText = `I scored ${score} points in the "Find the Original URL" game! Can you beat my score?`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(originalUrl);

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      default:
        return '';
    }
  }

  window.showEndGameModal = showEndGameModal;
  window.hideEndGameModal = hideEndGameModal;
}

window.initEndGameModal = initEndGameModal;
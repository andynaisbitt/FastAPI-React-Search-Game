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

  function showEndGameModal(success) {
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

    endGameModal.style.display = 'block';
    endGameModal.classList.add('modal-show');
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
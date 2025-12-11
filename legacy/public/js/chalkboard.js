// public/js/chalkboard.js
function initChalkboard() {
  const chalkboardCanvas = document.getElementById('chalkboardCanvas');
  // Homepage uses 'searchInput', game page uses 'search-input'
  const searchInput = document.getElementById('searchInput') || document.getElementById('search-input');
  // Homepage uses '.character' div, game page uses '#chalkboardArea'
  const chalkboardArea = document.querySelector('.character') || document.getElementById('chalkboardArea');

  if (!chalkboardCanvas) {
    console.warn('Chalkboard canvas not found');
    return;
  }

  if (!searchInput) {
    console.warn('Search input not found - chalkboard will show placeholder text only');
  }

  setupChalkboard(chalkboardCanvas, searchInput, chalkboardArea);
}

function setupChalkboard(chalkboardCanvas, searchInput, chalkboardArea) {
  const ctx = chalkboardCanvas.getContext('2d');
  const placeholderText = 'I will use Google before asking dumb questions.';
  let audioTimeout;

  function resizeCanvas() {
    const containerWidth = chalkboardArea.clientWidth || window.innerWidth;
    const containerHeight = chalkboardArea.clientHeight || window.innerHeight;

    chalkboardCanvas.width = containerWidth;
    chalkboardCanvas.height = containerHeight;

    drawChalkText(searchInput ? searchInput.value : placeholderText);
  }

  function drawChalkText(text = '') {
    // Better positioning for mobile and desktop
    const isMobile = window.innerWidth < 768;
    const chalkboardWidth = chalkboardCanvas.width * (isMobile ? 0.9 : 0.6);
    const chalkboardHeight = chalkboardCanvas.height * (isMobile ? 0.4 : 0.5);
    const chalkboardX = chalkboardCanvas.width * (isMobile ? 0.05 : 0.2);
    const chalkboardY = chalkboardCanvas.height * (isMobile ? 0.15 : 0.25);

    ctx.clearRect(0, 0, chalkboardCanvas.width, chalkboardCanvas.height);
    ctx.save();

    // Responsive font size
    const fontSize = isMobile ? 18 : 28;
    const lineHeight = isMobile ? 24 : 36;

    ctx.font = `${fontSize}px Architects Daughter`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxLines = Math.floor(chalkboardHeight / lineHeight);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > chalkboardWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }

    lines.push(currentLine);

    let startIndex = Math.max(0, lines.length - maxLines);
    let displayLines = lines.slice(startIndex, startIndex + maxLines);

    let y = chalkboardY + (chalkboardHeight - displayLines.length * lineHeight) / 2;

    for (let i = 0; i < displayLines.length; i++) {
      const textX = chalkboardX + chalkboardWidth / 2;
      ctx.fillText(displayLines[i], textX, y);
      y += lineHeight;
    }

    ctx.restore();
  }

  let lastTypingTime = Date.now();
  const ENABLE_CHALK_AUDIO = false; // Disabled by default - audio file likely missing

  function playChalkAudio() {
    if (!ENABLE_CHALK_AUDIO) return;

    try {
      const audio = new Audio('/sounds/chalk.mp3');
      audio.volume = 0.2; // Lower volume

      audio.addEventListener('error', () => {
        console.warn('Chalk audio file not found - disabling audio');
      });

      audio.addEventListener('loadedmetadata', () => {
        audio.currentTime = Math.random() * audio.duration;
      });

      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (e) {
      // Silently fail
    }
  }

  // Only attach event listeners if searchInput exists
  if (searchInput) {
    searchInput.addEventListener('click', function() {
      if (this.value === '') {
        drawChalkText(placeholderText);
      } else {
        drawChalkText(this.value);
      }
    });

    searchInput.addEventListener('input', function() {
      const text = this.value || placeholderText;
      drawChalkText(text);

      // Debounce audio to prevent spam (increased from 100ms to 300ms)
      clearTimeout(audioTimeout);
      audioTimeout = setTimeout(playChalkAudio, 300);
    });
  }

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
}

window.initChalkboard = initChalkboard;
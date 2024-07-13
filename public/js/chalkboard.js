// public/js/chalkboard.js
function initChalkboard() {
  const chalkboardCanvas = document.getElementById('chalkboardCanvas');
  const searchInput = document.getElementById('search-input');
  const chalkboardArea = document.getElementById('chalkboardArea');

  if (!chalkboardCanvas || !searchInput || !chalkboardArea) {
    console.warn('Required elements for chalkboard not found. They will be initialized when available.');
    const observer = new MutationObserver((mutations, obs) => {
      const chalkboardCanvas = document.getElementById('chalkboardCanvas');
      const searchInput = document.getElementById('search-input');
      const chalkboardArea = document.getElementById('chalkboardArea');
      if (chalkboardCanvas && searchInput && chalkboardArea) {
        setupChalkboard(chalkboardCanvas, searchInput, chalkboardArea);
        obs.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    setupChalkboard(chalkboardCanvas, searchInput, chalkboardArea);
  }
}

function setupChalkboard(chalkboardCanvas, searchInput, chalkboardArea) {
  const ctx = chalkboardCanvas.getContext('2d');
  const placeholderText = 'I will use Google before asking dumb questions.';
  let audioTimeout;

  function resizeCanvas() {
    const containerWidth = chalkboardArea.clientWidth;
    const containerHeight = chalkboardArea.clientHeight;

    chalkboardCanvas.width = containerWidth;
    chalkboardCanvas.height = containerHeight;

    drawChalkText(placeholderText);
  }

  function drawChalkText(text = '') {
    const chalkboardWidth = chalkboardCanvas.width * 0.8;
    const chalkboardHeight = chalkboardCanvas.height * 0.6;
    const chalkboardX = chalkboardCanvas.width * 0.1;
    const chalkboardY = chalkboardCanvas.height * 0.2;

    ctx.clearRect(0, 0, chalkboardCanvas.width, chalkboardCanvas.height);
    ctx.save();
    ctx.font = '24px Architects Daughter';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineHeight = 30;
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

  function playChalkAudio() {
    const audio = new Audio('/sounds/chalk.mp3');
    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = Math.random() * audio.duration;
    });

    const currentTypingTime = Date.now();
    const typingSpeed = 1 / (currentTypingTime - lastTypingTime);
    lastTypingTime = currentTypingTime;

    const minVolume = 0.1;
    const maxVolume = 0.4;
    const minSpeed = 0.001;
    const maxSpeed = 0.01;
    audio.volume = Math.min(Math.max(minVolume + (maxVolume - minVolume) * ((typingSpeed - minSpeed) / (maxSpeed - minSpeed)), minVolume), maxVolume);

    audio.play();
  }

  searchInput.addEventListener('click', function() {
    if (this.value === '') {
      drawChalkText(placeholderText);
    }
  });

  searchInput.addEventListener('input', function() {
    const text = this.value;
    drawChalkText(text);

    clearTimeout(audioTimeout);
    audioTimeout = setTimeout(playChalkAudio, 100);
  });

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
}

window.initChalkboard = initChalkboard;
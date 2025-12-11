document.addEventListener('DOMContentLoaded', function() {
  const factBubble = document.getElementById('factBubble');
  const themeToggle = document.getElementById('themeToggle');
  const characterToggle = document.getElementById('characterToggle');
  const characterImage = document.getElementById('characterImage');

  const facts = [
    'Did you know that Google was originally named "BackRub"?',
    'Google processes over 40,000 search queries every second!',
    'The first Google Doodle was created in 1998 to honor the Burning Man festival.',
    'Google has more than 70 offices around the world.',
    'The "I\'m Feeling Lucky" button costs Google $110 million per year in lost ad revenue.',
    'Google\'s first employee was Craig Silverstein, who earned a yearly wage of $10.',
    'Google\'s search engine can handle more than 100 billion searches per month.',
    'The Google homepage was designed to be simple and fast-loading.'
  ];

  const themes = ['default', 'math', 'science', 'literature', 'dark', 'light'];
  let currentTheme = 0;

  const characters = [
    '/img/bart-simpson.png',
    '/img/lisa-simpson.jpg',
    '/img/bart-destroy.webp',
    '/img/milhouse-van-houten.jpg'
  ];
  let currentCharacter = 0;

  function playSound(sound) {
    // Audio disabled - browsers block autoplay without user interaction
    // const audio = new Audio(`/sounds/${sound}.mp3`);
    // audio.play();
  }

  function showRandomFact() {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    factBubble.textContent = randomFact;
    factBubble.style.opacity = 1;
    setTimeout(function() {
      factBubble.style.opacity = 0;
    }, 5000);
  }

  themeToggle.addEventListener('click', function() {
    currentTheme = (currentTheme + 1) % themes.length;
    document.body.className = themes[currentTheme];
    playSound('themeChange');
  });

  characterToggle.addEventListener('click', function() {
    currentCharacter = (currentCharacter + 1) % characters.length;
    characterImage.src = characters[currentCharacter];
    characterImage.style.opacity = 0;
    setTimeout(function() {
      characterImage.style.opacity = 1;
    }, 500);
    if (typeof resizeCanvas === 'function') {
      resizeCanvas();
    }
    if (typeof drawChalkText === 'function') {
      drawChalkText(searchInput.value);
    }
    playSound('characterChange');
  });

  window.addEventListener('resize', function() {
    if (typeof resizeCanvas === 'function') {
      resizeCanvas();
    }
  });

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }
  if (typeof drawChalkText === 'function') {
    drawChalkText();
  }
});
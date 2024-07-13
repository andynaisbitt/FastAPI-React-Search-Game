// public/js/main.js

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const factBubble = document.getElementById('factBubble');
  const themeToggle = document.getElementById('themeToggle');
  const characterToggle = document.getElementById('characterToggle');
  const characterImage = document.getElementById('characterImage');
  const searchForm = document.getElementById('searchForm');
  const shortenForm = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const shortUrlContainer = document.getElementById('shortUrlContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const multipleLinksCheckbox = document.getElementById('multipleLinksCheckbox');

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

  let audioContext;

  function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playSound(sound) {
    if (!audioContext) {
      initAudio();
    }
    fetch(`/sounds/${sound}.mp3`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      })
      .catch(error => console.error('Error playing sound:', error));
  }

  function showRandomFact() {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    factBubble.textContent = randomFact;
    factBubble.style.opacity = 1;
    setTimeout(() => {
      factBubble.style.opacity = 0;
    }, 5000);
  }

  function toggleLoadingState(isLoading) {
    searchInput.disabled = isLoading;
    urlInput.disabled = isLoading;
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  function displayShortUrls(shortCodes) {
    shortUrlContainer.innerHTML = '<h2>Shortened URLs:</h2><ul></ul>';
    const ul = shortUrlContainer.querySelector('ul');
    if (shortCodes && Array.isArray(shortCodes)) {
      shortCodes.forEach(shortCode => {
        const shortUrl = `${window.location.origin}/${shortCode}`;
        const li = document.createElement('li');
        const linkElement = document.createElement('a');
        linkElement.href = shortUrl;
        linkElement.textContent = shortUrl;
        linkElement.target = '_blank';
        li.appendChild(linkElement);
        ul.appendChild(li);
      });
      shortUrlContainer.style.display = 'block';
    } else {
      console.error('Invalid shortCodes data:', shortCodes);
    }
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Strict; Secure`;
  }

  function getOrSetUniqueId() {
    let uniqueId = getCookie('uniqueId');
    if (!uniqueId) {
      uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      setCookie('uniqueId', uniqueId, 365); // Set for 1 year
    }
    return uniqueId;
  }

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }

  function updateCsrfToken(newToken) {
    document.querySelector('meta[name="csrf-token"]').setAttribute('content', newToken);
  }

  function fetchWithCsrf(url, options = {}) {
    const csrfToken = getCsrfToken();
    const defaultOptions = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      }
    };
    return fetch(url, { ...defaultOptions, ...options })
      .then(response => {
        const newCsrfToken = response.headers.get('X-CSRF-Token');
        if (newCsrfToken) {
          updateCsrfToken(newCsrfToken);
        }
        if (!response.ok) {
          return response.json().then(err => { throw err; });
        }
        return response.json();
      });
  }

  // Initialize
  getOrSetUniqueId();

  searchInput.addEventListener('input', function() {
    const text = this.value;
    if (typeof drawChalkText === 'function') {
      drawChalkText(text);
    }
  });

  searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    toggleLoadingState(true);
    showRandomFact();
    const query = searchInput.value;
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  });

  themeToggle.addEventListener('click', function() {
    currentTheme = (currentTheme + 1) % themes.length;
    document.body.className = themes[currentTheme];
    playSound('themeChange');
  });

  characterToggle.addEventListener('click', function() {
    currentCharacter = (currentCharacter + 1) % characters.length;
    characterImage.src = characters[currentCharacter];
    characterImage.style.opacity = 0;
    setTimeout(() => {
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

  shortenForm.addEventListener('submit', function(event) {
    event.preventDefault();
    toggleLoadingState(true);

    let longUrls;
    if (multipleLinksCheckbox && multipleLinksCheckbox.checked) {
      longUrls = urlInput.value.split('\n').map(url => url.trim()).filter(url => url !== '');
    } else {
      longUrls = [urlInput.value.trim()];
    }

    if (longUrls.length === 0) {
      alert('Please enter at least one valid URL.');
      toggleLoadingState(false);
      return;
    }

    const uniqueId = getOrSetUniqueId();

    fetchWithCsrf('/shorten', {
      method: 'POST',
      body: JSON.stringify({ urls: longUrls, uniqueId: uniqueId })
    })
      .then(data => {
        displayShortUrls(data.shortCodes);
        urlInput.value = '';
      })
      .catch(error => {
        console.error('Error:', error);
        let errorMessage = 'An error occurred while shortening the URLs.';
        if (error.error === 'User unique ID not found') {
          errorMessage = 'Session expired. Please refresh the page and try again.';
        } else if (error.errors && error.errors.length > 0) {
          errorMessage = error.errors.map(e => e.msg).join(', ');
        }
        alert(errorMessage);
      })
      .finally(() => {
        toggleLoadingState(false);
      });
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

  // GSAP Animation
  const animateText = document.getElementById('animate-text');
  if (animateText && typeof gsap !== 'undefined') {
    gsap.from(animateText, {
      duration: 2,
      opacity: 0,
      y: -50,
      ease: "elastic.out(1, 0.3)",
      repeat: -1,
      repeatDelay: 1,
      yoyo: true
    });
  }

  // Initial setup
  showRandomFact();
  if (searchInput) {
    searchInput.dispatchEvent(new Event('input'));
  }
});
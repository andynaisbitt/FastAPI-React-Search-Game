// public/js/urlShortener.js

document.addEventListener('DOMContentLoaded', function() {
  const shortenForm = document.getElementById('shortenForm');
  const urlInput = document.getElementById('urlInput');
  const shortUrlContainer = document.getElementById('shortUrlContainer');
  const multipleLinksCheckbox = document.getElementById('multipleLinksCheckbox');
  const loadingIndicator = document.getElementById('loadingIndicator');

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
    // Only use Secure flag on HTTPS (production)
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Strict${secureFlag}`;
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

  function displayShortUrls(shortCodes) {
    shortUrlContainer.innerHTML = '<h2>Shortened URLs:</h2><ul></ul>';
    const ul = shortUrlContainer.querySelector('ul');
    shortCodes.forEach(shortCode => {
      const shortUrl = `${window.location.origin}/shorturl/${shortCode}`;
      const li = document.createElement('li');
      const linkElement = document.createElement('a');
      linkElement.href = shortUrl;
      linkElement.textContent = shortUrl;
      linkElement.target = '_blank';
      li.appendChild(linkElement);
      ul.appendChild(li);
    });
    shortUrlContainer.style.display = 'block';
  }

  function displayError(message) {
    shortUrlContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    shortUrlContainer.style.display = 'block';
  }

  function toggleShortenLoadingState(isLoading) {
    urlInput.disabled = isLoading;
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  function validateUrls(urls) {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urls.every(url => urlRegex.test(url));
  }

  shortenForm.addEventListener('submit', function(event) {
    event.preventDefault();
    toggleShortenLoadingState(true);

    let longUrls;
    if (multipleLinksCheckbox && multipleLinksCheckbox.checked) {
      longUrls = urlInput.value.split('\n').map(url => url.trim()).filter(url => url !== '');
    } else {
      longUrls = [urlInput.value.trim()];
    }

    if (longUrls.length === 0) {
      displayError('Please enter at least one URL.');
      toggleShortenLoadingState(false);
      return;
    }

    if (!validateUrls(longUrls)) {
      displayError('Please enter valid URL(s).');
      toggleShortenLoadingState(false);
      return;
    }

    const uniqueId = getOrSetUniqueId();
    console.log('[URL Shortener] UniqueId:', uniqueId);
    console.log('[URL Shortener] All cookies:', document.cookie);

    // Get difficulty and custom challenge data
    const difficulty = document.getElementById('difficulty') ? document.getElementById('difficulty').value : 'medium';
    const challengeText = document.getElementById('challengeText') ? document.getElementById('challengeText').value.trim() : null;
    const hintsText = document.getElementById('hints') ? document.getElementById('hints').value.trim() : null;
    const hints = hintsText ? hintsText.split('\n').map(h => h.trim()).filter(h => h) : null;

    const requestData = {
      urls: longUrls,
      uniqueId: uniqueId,
      difficulty: difficulty
    };
    console.log('[URL Shortener] Request data:', requestData);

    // Add custom challenge data if provided
    if (challengeText) {
      requestData.challengeText = challengeText;
    }
    if (hints && hints.length > 0) {
      requestData.hints = hints;
    }

    fetchWithCsrf('/shorten', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
      .then(data => {
        console.log('[URL Shortener] Server response:', data);
        if (data.shortCodes && data.shortCodes.length > 0) {
          displayShortUrls(data.shortCodes);
          console.log(`Created URLs with difficulty: ${data.difficulty}, time limit: ${data.timeLimitSeconds}s`);
          urlInput.value = ''; // Clear input after successful shortening
          // Optionally clear custom fields
          if (document.getElementById('challengeText')) document.getElementById('challengeText').value = '';
          if (document.getElementById('hints')) document.getElementById('hints').value = '';
        } else {
          console.error('[URL Shortener] Invalid response:', data);
          throw new Error('No short codes returned');
        }
      })
      .catch(error => {
        console.error('[URL Shortener] Error:', error);
        displayError(`An error occurred while shortening the URLs: ${error.message || error.error || 'Unknown error'}`);
      })
      .finally(() => {
        toggleShortenLoadingState(false);
      });
  });

  // Initialize
  getOrSetUniqueId();
});
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

    fetchWithCsrf('/shorten', {
      method: 'POST',
      body: JSON.stringify({ urls: longUrls, uniqueId: uniqueId })
    })
      .then(data => {
        if (data.shortCodes && data.shortCodes.length > 0) {
          displayShortUrls(data.shortCodes);
          urlInput.value = ''; // Clear input after successful shortening
        } else {
          throw new Error('No short codes returned');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        displayError(`An error occurred while shortening the URLs: ${error.message || 'Unknown error'}`);
      })
      .finally(() => {
        toggleShortenLoadingState(false);
      });
  });

  // Initialize
  getOrSetUniqueId();
});
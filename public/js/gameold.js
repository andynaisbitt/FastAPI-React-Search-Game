document.addEventListener('DOMContentLoaded', function() {
  const countdown = document.getElementById('countdown');
  const score = document.getElementById('score');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const hintButton = document.getElementById('hintButton');
  const endGameModal = document.getElementById('endGameModal');
  const endGameMessage = document.getElementById('endGameMessage');
  const finalScore = document.getElementById('finalScore');
  const originalUrlLink = document.querySelector('.original-url-link');
  const restartButton = document.getElementById('restartButton');
  const uniqueId = document.getElementById('uniqueId').value;
  const shortCode = document.getElementById('shortCode').value;
  let timeLeft = 30;
  let timerId;

  // Start the countdown timer
  function startCountdown() {
    timerId = setInterval(() => {
      timeLeft--;
      countdown.textContent = timeLeft;
      updateProgressBar();
      if (timeLeft === 0) {
        clearInterval(timerId);
        console.log('Time is up, calling endGame');
        endGame();
      }
    }, 1000);
  }

  // Update the progress bar
  function updateProgressBar() {
    const progressBar = document.querySelector('.progress');
    const progressWidth = (timeLeft / 30) * 100;
    progressBar.style.width = `${progressWidth}%`;
  }

  // End the game
  async function endGame(success = false) {
    clearInterval(timerId);
    if (success) {
      endGameMessage.textContent = 'Congratulations! You found the original URL.';
      score.textContent = parseInt(score.textContent) + timeLeft;
    } else {
      endGameMessage.textContent = "Time's up! You didn't find the original URL.";
    }
    finalScore.textContent = score.textContent;

    // Retrieve the original URL using the short code
    const response = await fetch(`/expand/${shortCode}`);
    const result = await response.json();
    if (result && result.longUrl) {
      originalUrlLink.href = result.longUrl;
    } else {
      console.log(`No URL found for short code: ${shortCode}`);
    }

    endGameModal.style.display = 'block';
  }

  // Add event listener for search input changes
  searchInput.addEventListener('input', debounce(performSearch, 300));

  // Debounce function to delay search requests
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Function to perform the live search
  async function performSearch() {
    const query = searchInput.value.trim();
    if (query.length >= 3) {
      try {
        const response = await fetch(`/game/${encodeURIComponent(uniqueId)}/${encodeURIComponent(shortCode)}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        if (response.ok) {
          const data = await response.json();
          displaySearchResults(data);
        } else {
          throw new Error('Error performing search');
        }
      } catch (err) {
        console.error('Error performing search:', err);
        displaySearchError('An error occurred while searching. Please try again.');
      }
    } else {
      clearSearchResults();
    }
  }

  // Function to display search results
  function displaySearchResults(data) {
    searchResults.innerHTML = '';
    if (data.results && data.results.length > 0) {
      const resultList = document.createElement('ul');
      data.results.forEach((result) => {
        const listItem = document.createElement('li');
        const linkContainer = document.createElement('div');
        linkContainer.textContent = result.url;
        linkContainer.classList.add('search-result-link');
        linkContainer.addEventListener('click', () => {
          window.open(result.url, '_blank');
        });
        listItem.appendChild(linkContainer);
        const snippet = document.createElement('p');
        snippet.textContent = result.snippet;
        listItem.appendChild(snippet);
        resultList.appendChild(listItem);
      });
      searchResults.appendChild(resultList);

      // Display a notification if the correct answer is found
      if (data.isCorrectAnswer) {
        const correctAnswerNotification = document.createElement('p');
        correctAnswerNotification.textContent = 'You found the correct URL!';
        correctAnswerNotification.classList.add('correct-answer-notification');
        searchResults.appendChild(correctAnswerNotification);
        console.log('Correct answer found, calling endGame');
        endGame(true);
      }
    } else {
      searchResults.innerHTML = '<p>No results found.</p>';
    }
  }

  // Function to clear search results
  function clearSearchResults() {
    searchResults.innerHTML = '';
  }

  // Function to display search error
  function displaySearchError(message) {
    searchResults.innerHTML = `<p class="error">${message}</p>`;
  }

  // Handle hint button click
  hintButton.addEventListener('click', async () => {
    try {
      const response = await fetch(`/game/${encodeURIComponent(uniqueId)}/${encodeURIComponent(shortCode)}/hint`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        displayHint(data.hint);
      } else {
        throw new Error('Error retrieving hint');
      }
    } catch (err) {
      console.error('Error retrieving hint:', err);
      displayHintError('An error occurred while retrieving the hint.');
    }
  });

  // Function to display hint
  function displayHint(hint) {
    const hintElement = document.createElement('p');
    hintElement.textContent = `Hint: ${hint}`;
    hintElement.classList.add('hint');
    searchResults.appendChild(hintElement);
  }

  // Function to display hint error
  function displayHintError(message) {
    const errorElement = document.createElement('p');
    errorElement.textContent = message;
    errorElement.classList.add('error');
    searchResults.appendChild(errorElement);
  }

  // Handle restart button click
  restartButton.addEventListener('click', () => {
    endGameModal.style.display = 'none';
    timeLeft = 30;
    score.textContent = '0';
    searchInput.value = '';
    clearSearchResults();
    startCountdown();
  });

  // Start the game
  startCountdown();
});
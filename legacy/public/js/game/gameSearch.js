// public\js\game\gameSearch.js
let gameState;
let currentPage = 1;
const resultsPerPage = 10;

function initGameSearch() {
  gameState = window.gameState;
  if (!gameState || !gameState.uniqueId || !gameState.shortCode) {
    console.error('Game state is not properly initialized');
    return;
  }
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const submitAnswerBtn = document.getElementById('submit-answer-btn');

  if (!searchForm || !searchInput || !searchResults || !submitAnswerBtn) {
    console.error('Required elements for game search not found');
    return;
  }

  searchForm.addEventListener('submit', handleSearch);
  searchInput.addEventListener('input', debounce(handleLiveSearch, 300));
  submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
}

async function handleSearch(event) {
  event.preventDefault();
  const query = document.getElementById('search-input').value;
  currentPage = 1;
  await performSearch(query, currentPage);
}

async function handleLiveSearch() {
  const query = document.getElementById('search-input').value;
  if (query.length >= 3) {
    await performLiveSearch(query);
  } else {
    clearSearchResults();
  }
}

async function performSearch(query, page) {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const response = await fetch(`/game/${gameState.uniqueId}/${gameState.shortCode}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ query, page, resultsPerPage }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displaySearchResults(data);
  } catch (error) {
    console.error('Error performing search:', error);
    displaySearchError('An error occurred while searching. Please try again.');
  }
}

async function performLiveSearch(query) {
  try {
    if (!gameState || !gameState.uniqueId || !gameState.shortCode) {
      throw new Error('Game state is not properly initialized');
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const response = await fetch(`/game/${gameState.uniqueId}/${gameState.shortCode}/live-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displaySearchResults(data);
  } catch (error) {
    console.error('Error performing live search:', error);
    displaySearchError('An error occurred while performing the live search. Please try again.');
  }
}

function displaySearchResults(data) {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';

  if (data.results && data.results.length > 0) {
    const resultList = document.createElement('ul');
    resultList.className = 'search-results-list';

    data.results.forEach((result, index) => {
      const listItem = createResultListItem(result, index);
      resultList.appendChild(listItem);
    });

    searchResults.appendChild(resultList);

    if (data.totalResults > resultsPerPage) {
      createPagination(data.totalResults, data.currentPage);
    }
  } else {
    searchResults.textContent = 'No results found.';
  }
}

function createResultListItem(result, index) {
  const listItem = document.createElement('li');
  listItem.className = `search-result ${result.isWinning ? 'winning-result' : ''} ${result.isRelevant ? 'relevant-result' : ''}`;

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'search-result';
  radio.value = result.url;
  radio.id = `result-${index}`;

  const label = document.createElement('label');
  label.htmlFor = `result-${index}`;
  label.innerHTML = `
    <h3>${escapeHTML(result.title)}</h3>
    <p>${escapeHTML(result.url)}</p>
    <p>${escapeHTML(result.snippet)}</p>
  `;

  listItem.appendChild(radio);
  listItem.appendChild(label);

  return listItem;
}

function createPagination(totalResults, currentPage) {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.className = `page-button ${i === currentPage ? 'active' : ''}`;
    pageButton.addEventListener('click', () => changePage(i));
    paginationContainer.appendChild(pageButton);
  }

  document.getElementById('search-results').appendChild(paginationContainer);
}

function changePage(page) {
  currentPage = page;
  const query = document.getElementById('search-input').value;
  performSearch(query, currentPage);
}

function clearSearchResults() {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';
}

function displaySearchError(message) {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = `<p class="error-message">${escapeHTML(message)}</p>`;
}

function handleSubmitAnswer() {
  const selectedAnswer = document.querySelector('input[name="search-result"]:checked');
  if (selectedAnswer) {
    checkAnswer(selectedAnswer.value);
  } else {
    displaySearchError('Please select an answer before submitting.');
  }
}

async function checkAnswer(selectedUrl) {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const response = await fetch(`/game/${gameState.uniqueId}/${gameState.shortCode}/check-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ selectedUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.correct) {
      window.updateScore(data.score);
      window.endGame(true);
    } else {
      displaySearchError('Incorrect answer. Try again!');
      window.updateScore(data.score);
    }
  } catch (error) {
    console.error('Error checking answer:', error);
    displaySearchError('An error occurred while checking the answer. Please try again.');
  }
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

window.initGameSearch = initGameSearch;
window.performSearch = performSearch;
window.performLiveSearch = performLiveSearch;
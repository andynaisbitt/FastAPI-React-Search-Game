// utils\searchUtils.js
const { google } = require('googleapis');

const apiKey = process.env.GOOGLE_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Initialize the Custom Search API client
const customSearchClient = google.customsearch({
  version: 'v1',
  auth: apiKey,
});

// utils/searchUtils.js
// ...

async function performSearch(query, longUrl) {
  try {
    const searchRequest = {
      q: query,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      num: 10,
    };

    const searchResponse = await customSearchClient.cse.list(searchRequest);

    if (searchResponse.data.error) {
      console.error('Search API error:', searchResponse.data.error);
      throw new Error('Search API error');
    } else {
      const searchResults = searchResponse.data.items.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }));
      const isCorrectAnswer = searchResults.some((result) => isSimilarDomain(result.url, longUrl));
      return { results: searchResults, isCorrectAnswer };
    }
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
}

module.exports = {
  performSearch,
};
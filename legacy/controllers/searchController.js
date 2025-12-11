// controllers/searchController.js
const { google } = require('googleapis');
const { isSimilarDomain } = require('../utils/urlUtils');
const urlShortener = require('../utils/urlShortener/urlController');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/csrfConfig');
const { ShortCodeNotFoundError } = require('../utils/urlShortener/errorHandler');

const customSearchClient = google.customsearch({
  version: 'v1',
  auth: process.env.GOOGLE_API_KEY,
});

class SearchController {
  static async performGameSearch(req, res) {
    const { uniqueId, shortCode } = req.params;
    const { query } = req.body;

    try {
      const result = await urlShortener.expandURL(shortCode);
      if (!result || result.uniqueId !== uniqueId) {
        logger.warn(`Invalid short code: ${shortCode} or uniqueId: ${uniqueId}`);
        return res.status(404).json({ error: 'URL not found' });
      }

      const { longUrl } = result;

      // Fallback if API key is not configured
      if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
        logger.warn('Google API key not configured, using fallback search');
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const fallbackResults = [
          {
            title: 'Search on Google (API key not configured)',
            url: googleSearchUrl,
            snippet: `Click here to search for "${query}" on Google manually. Configure GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env for automatic search.`
          }
        ];
        const csrfToken = generateToken(req, res);
        return res.json({ results: fallbackResults, isCorrectAnswer: false, csrfToken });
      }

      const searchRequest = {
        q: query,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        num: 10,
      };

      const searchResponse = await customSearchClient.cse.list(searchRequest);

      if (searchResponse.data.error) {
        logger.error('Search API error:', searchResponse.data.error);
        return res.status(500).json({ error: 'Search API error' });
      }

      const searchResults = searchResponse.data.items.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }));

      const isCorrectAnswer = searchResults.some((result) => 
        result.url === longUrl || isSimilarDomain(result.url, longUrl)
      );

      // Generate a new CSRF token for the response
      const csrfToken = generateToken(req, res);

      res.json({ results: searchResults, isCorrectAnswer, csrfToken });

    } catch (err) {
      logger.error('Error performing search:', err);
      if (err instanceof ShortCodeNotFoundError) {
        res.status(404).json({ error: 'Short code not found or expired' });
      } else {
        res.status(500).json({ error: 'Error performing search', details: err.message });
      }
    }
  }

  static async performGeneralSearch(req, res) {
    const { query } = req.query;

    try {
      // Fallback if API key is not configured
      if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
        logger.warn('Google API key not configured, using fallback search');
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const fallbackResults = [
          {
            title: 'Search on Google (API key not configured)',
            url: googleSearchUrl,
            snippet: `Click here to search for "${query}" on Google manually. Configure GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in .env for automatic search.`
          }
        ];
        const csrfToken = generateToken(req, res);
        return res.json({ results: fallbackResults, csrfToken });
      }

      const searchRequest = {
        q: query,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        num: 10,
      };

      const searchResponse = await customSearchClient.cse.list(searchRequest);

      if (searchResponse.data.error) {
        logger.error('Search API error:', searchResponse.data.error);
        return res.status(500).json({ error: 'Search API error' });
      }

      const searchResults = searchResponse.data.items.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }));

      // Generate a new CSRF token for the response
      const csrfToken = generateToken(req, res);

      res.json({ results: searchResults, csrfToken });

    } catch (err) {
      logger.error('Error performing general search:', err);
      res.status(500).json({ error: 'Error performing search', details: err.message });
    }
  }

  static async refreshCsrfToken(req, res) {
    try {
      const csrfToken = generateToken(req, res);
      res.json({ csrfToken });
    } catch (err) {
      logger.error('Error refreshing CSRF token:', err);
      res.status(500).json({ error: 'Error refreshing CSRF token' });
    }
  }
}

module.exports = SearchController;
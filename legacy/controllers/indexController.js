// controllers/indexController.js
const urlShortener = require('../utils/urlShortener/urlController');
const searchUtils = require('../utils/searchUtils');
const { getRandomCharacterImage, getRandomFact } = require('../utils/characterUtils');
const logger = require('../utils/logger');
const { InvalidURLError } = require('../utils/urlShortener/errorHandler');
const { generateToken } = require('../utils/csrfConfig');
const crypto = require('crypto');

class IndexController {
  static async renderIndexPage(req, res) {
    try {
      const characterImage = getRandomCharacterImage();
      const randomFact = getRandomFact();
      const recentShortCodes = await urlShortener.getRecentShortCodes();
      const origin = `${req.protocol}://${req.get('host')}`;
      
      // Ensure uniqueId is set in the session
      if (!req.session.uniqueId) {
        req.session.uniqueId = crypto.randomBytes(16).toString('hex');
      }

      // Generate CSRF token
      const csrfToken = generateToken(req, res);

      res.render('index', { 
        characterImage, 
        randomFact, 
        recentShortCodes, 
        origin,
        uniqueId: req.session.uniqueId,
        csrfToken
      });
    } catch (error) {
      logger.error('Error rendering index page:', error);
      res.status(500).render('error', { message: 'An error occurred while loading the page.' });
    }
  }

  static async performSearch(req, res) {
    const query = req.query.q;
    try {
      if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      const searchResults = await searchUtils.performSearch(query);
      
      // Generate new CSRF token for the search results page
      const csrfToken = generateToken(req, res);
      
      res.render('search', { query, searchResults, csrfToken });
    } catch (error) {
      logger.error('Error performing search:', error);
      res.status(500).render('error', { message: 'An error occurred while performing the search.' });
    }
  }

  static async shortenUrl(req, res) {
    const { urls: longUrls } = req.body;
    const { uniqueId } = req.session;

    if (!Array.isArray(longUrls) || longUrls.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty URL array provided' });
    }

    try {
      const shortCodes = await urlShortener.shortenMultipleURLs(longUrls, uniqueId);
      const shortUrls = shortCodes.map(code => `${req.protocol}://${req.get('host')}/shorturl/${code}`);
      res.json({ shortUrls });
    } catch (error) {
      logger.error('Error shortening URLs:', error);
      if (error instanceof InvalidURLError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error shortening URLs' });
      }
    }
  }

  static async redirectToGame(req, res) {
    const { shortCode } = req.params;
    try {
      const result = await urlShortener.expandURL(shortCode);
      if (result) {
        const { longUrl, uniqueId } = result;
        res.redirect(`/game/${encodeURIComponent(uniqueId)}/${encodeURIComponent(shortCode)}`);
      } else {
        logger.warn(`Invalid short code: ${shortCode}`);
        res.status(404).render('error', { message: 'URL not found' });
      }
    } catch (error) {
      logger.error('Error expanding short code:', error);
      res.status(500).render('error', { message: 'Error expanding short code' });
    }
  }

  static async getRecentShortCodes(req, res) {
    try {
      const recentShortCodes = await urlShortener.getRecentShortCodes();
      const origin = `${req.protocol}://${req.get('host')}`;
      const recentShortUrls = recentShortCodes.map(code => `${origin}/shorturl/${code}`);
      res.json({ recentShortUrls });
    } catch (error) {
      logger.error('Error retrieving recent short codes:', error);
      res.status(500).json({ error: 'Error retrieving recent short codes' });
    }
  }

  static async changeTheme(req, res) {
    const { theme } = req.body;
    const allowedThemes = ['default', 'dark', 'light', 'retro', 'neon'];
    
    if (!allowedThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    req.session.theme = theme;
    res.json({ message: 'Theme updated successfully' });
  }

  static async changeCharacter(req, res) {
    const { character } = req.body;
    const allowedCharacters = ['bart', 'lisa', 'milhouse', 'ralph'];
    
    if (!allowedCharacters.includes(character)) {
      return res.status(400).json({ error: 'Invalid character' });
    }

    req.session.character = character;
    res.json({ message: 'Character updated successfully' });
  }

  static async getRandomFact(req, res) {
    try {
      const fact = getRandomFact();
      res.json({ fact });
    } catch (error) {
      logger.error('Error getting random fact:', error);
      res.status(500).json({ error: 'Error retrieving random fact' });
    }
  }

  static async getCsrfToken(req, res) {
    try {
      const csrfToken = generateToken(req, res);
      res.json({ csrfToken });
    } catch (error) {
      logger.error('Error generating CSRF token:', error);
      res.status(500).json({ error: 'Error generating CSRF token' });
    }
  }
}

module.exports = IndexController;
// controllers/gameController.js
const { analyzeUrl, generateHint } = require('../utils/gameUtils');
const { performSearch, performLiveSearch } = require('../utils/game/performSearch');
const { getRandomCharacterImage } = require('../utils/characterUtils');
const { isSimilarDomain } = require('../utils/urlUtils');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/csrfConfig');

class GameController {
  /**
   * Render the game page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static renderGamePage(req, res) {
    try {
      const { uniqueId, shortCode } = req.params;
      const { longUrl } = req;
      const analyzedUrl = analyzeUrl(longUrl);
      const characterImage = getRandomCharacterImage();
      const csrfToken = generateToken(req, res);
      
      res.render('game', {
        uniqueId,
        shortCode,
        longUrl,
        gameQuestion: analyzedUrl.gameQuestion,
        searchOperators: analyzedUrl.searchOperators,
        characterImage,
        csrfToken
      });
    } catch (err) {
      logger.error('Error rendering game page:', err);
      res.status(500).render('error', { message: 'Error loading game' });
    }
  }

  /**
   * Handle search requests during the game
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async performSearch(req, res) {
    const { query, page = 1, resultsPerPage = 10 } = req.body;
    try {
      const searchResults = await performSearch(query, req.longUrl, page, resultsPerPage);
      const csrfToken = generateToken(req, res);
      res.json({ ...searchResults, csrfToken });
    } catch (err) {
      logger.error('Error performing search:', err);
      res.status(500).json({ error: 'Error performing search' });
    }
  }

  /**
   * Handle hint requests during the game
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static generateHint(req, res) {
    const { hintLevel } = req.body;
    try {
      const analyzedUrl = analyzeUrl(req.longUrl);
      const hint = generateHint(analyzedUrl, hintLevel);
      const csrfToken = generateToken(req, res);
      res.json({ hint, csrfToken });
    } catch (err) {
      logger.error('Error generating hint:', err);
      res.status(500).json({ error: 'Error generating hint' });
    }
  }

  /**
   * Handle live search requests during the game
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async performLiveSearch(req, res) {
    const { query } = req.body;
    try {
      const searchResults = await performLiveSearch(query, req.longUrl);
      const csrfToken = generateToken(req, res);
      res.json({ ...searchResults, csrfToken });
    } catch (err) {
      logger.error('Error performing live search:', err);
      res.status(500).json({ error: 'Error performing live search', details: err.message });
    }
  }

  /**
   * Check the answer submitted by the player
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static checkAnswer(req, res) {
    const { selectedUrl } = req.body;
    try {
      const isCorrect = isSimilarDomain(selectedUrl, req.longUrl);
      const score = isCorrect ? 10 : -5; // Example scoring
      const csrfToken = generateToken(req, res);
      res.json({ correct: isCorrect, score, csrfToken });
    } catch (err) {
      logger.error('Error checking answer:', err);
      res.status(500).json({ error: 'Error checking answer' });
    }
  }

  /**
   * Initialize game data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static initializeGame(req, res) {
    try {
      const { uniqueId, shortCode } = req.params;
      const { longUrl } = req;
      const analyzedUrl = analyzeUrl(longUrl);
      const csrfToken = generateToken(req, res);
      
      res.json({
        uniqueId,
        shortCode,
        longUrl,
        gameQuestion: analyzedUrl.gameQuestion,
        searchOperators: analyzedUrl.searchOperators,
        csrfToken
      });
    } catch (err) {
      logger.error('Error initializing game:', err);
      res.status(500).json({ error: 'Error initializing game' });
    }
  }

  /**
   * End the game and save the score
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static endGame(req, res) {
    const { uniqueId, score, timeLeft } = req.body;
    try {
      // Here you would typically save the score to a database
      // For now, we'll just send a success response
      const csrfToken = generateToken(req, res);
      res.json({ message: 'Game ended successfully', score, timeLeft, csrfToken });
    } catch (err) {
      logger.error('Error ending game:', err);
      res.status(500).json({ error: 'Error ending game' });
    }
  }

  /**
   * Get high scores
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static getHighScores(req, res) {
    try {
      // Here you would typically fetch high scores from a database
      // For now, we'll just send dummy data
      const highScores = [
        { name: 'Player 1', score: 100 },
        { name: 'Player 2', score: 90 },
        { name: 'Player 3', score: 80 },
      ];
      const csrfToken = generateToken(req, res);
      res.json({ highScores, csrfToken });
    } catch (err) {
      logger.error('Error fetching high scores:', err);
      res.status(500).json({ error: 'Error fetching high scores' });
    }
  }

  /**
   * Refresh CSRF token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static refreshCsrfToken(req, res) {
    try {
      const csrfToken = generateToken(req, res);
      res.json({ csrfToken });
    } catch (err) {
      logger.error('Error refreshing CSRF token:', err);
      res.status(500).json({ error: 'Error refreshing CSRF token' });
    }
  }
}

module.exports = GameController;
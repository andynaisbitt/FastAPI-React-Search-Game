// middleware\gameMiddleware.js
const { body, param, validationResult } = require('express-validator');
const urlShortener = require('../utils/urlShortener');

const gameMiddleware = {
  /**
   * Middleware to validate and expand shortCode
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  expandShortCode: (req, res, next) => {
    const { uniqueId, shortCode } = req.params;
    try {
      const result = urlShortener.expand(shortCode, uniqueId);
      if (result) {
        req.longUrl = result.longUrl;
        next();
      } else {
        res.status(404).json({ error: 'URL not found' });
      }
    } catch (err) {
      console.error('Error expanding short code:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * Middleware to validate game parameters
   */
  validateGameParams: [
    param('uniqueId').isUUID().withMessage('Invalid uniqueId'),
    param('shortCode').isString().isLength({ min: 6, max: 10 }).withMessage('Invalid shortCode'),
  ],

  /**
   * Middleware to validate search input
   */
  validateSearchInput: [
    body('query').isString().trim().notEmpty().withMessage('Search query is required'),
    body('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
    body('resultsPerPage').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid resultsPerPage'),
  ],

  /**
   * Middleware to validate hint request
   */
  validateHintRequest: [
    body('hintLevel').isInt({ min: 1, max: 3 }).withMessage('Invalid hint level'),
  ],

  /**
   * Middleware to validate answer submission
   */
  validateAnswerSubmission: [
    body('selectedUrl').isURL().withMessage('Invalid URL submitted'),
  ],

  /**
   * Middleware to validate game end request
   */
  validateGameEnd: [
    body('score').isInt({ min: 0 }).withMessage('Invalid score'),
    body('timeLeft').isInt({ min: 0 }).withMessage('Invalid time left'),
  ],

  /**
   * Middleware to handle validation errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },

  /**
   * Middleware to check if the game is active
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  checkGameActive: (req, res, next) => {
    // This is a placeholder. You would typically check against a database or session
    if (!req.session.gameActive) {
      return res.status(400).json({ error: 'No active game session' });
    }
    next();
  },

  /**
   * Middleware to limit hint requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  limitHintRequests: (req, res, next) => {
    // This is a placeholder. You would typically check against a database or session
    if (req.session.hintCount >= 3) {
      return res.status(400).json({ error: 'Maximum number of hints reached' });
    }
    req.session.hintCount = (req.session.hintCount || 0) + 1;
    next();
  },

  /**
   * Middleware to set CORS headers for game routes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  setCorsHeaders: (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Credentials', true);
    next();
  },

  /**
   * Error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  errorHandler: (err, req, res, next) => {
    console.error('Unhandled error in game routes:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
  },
};

module.exports = gameMiddleware;
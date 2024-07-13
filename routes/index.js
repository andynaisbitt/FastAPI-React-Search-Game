// routes/index.js
const express = require('express');
const router = express.Router();
const IndexController = require('../controllers/indexController');
const ShortenerController = require('../controllers/shortenerController');
const {
  validateSearchQuery,
  validateShortenRequest,
  validateShortCode,
  handleValidationErrors,
  checkUniqueId,
} = require('../middlewares/indexMiddleware');
const { generateToken, doubleCsrfProtection } = require('../utils/csrfConfig');
const logger = require('../utils/logger');

// Middleware to ensure CSRF token is available for all routes
router.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req, res);
  next();
});

// Home page
router.get('/', (req, res, next) => {
  try {
    IndexController.renderIndexPage(req, res);
  } catch (error) {
    next(error);
  }
});

// Search route
router.get(
  '/search',
  validateSearchQuery,
  handleValidationErrors,
  (req, res, next) => {
    try {
      IndexController.performSearch(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// URL shortening route
router.post(
  '/shorten',
  doubleCsrfProtection, // Apply CSRF protection to POST routes
  validateShortenRequest,
  handleValidationErrors,
  checkUniqueId,
  (req, res, next) => {
    try {
      ShortenerController.shortenUrls(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Expand short URL route
router.get(
  '/shorturl/:shortCode',
  validateShortCode,
  handleValidationErrors,
  (req, res, next) => {
    try {
      ShortenerController.expandUrl(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get recent short codes route
router.get('/recent-short-codes', (req, res, next) => {
  try {
    ShortenerController.getRecentShortCodes(req, res);
  } catch (error) {
    next(error);
  }
});

// CSRF token route (for AJAX requests)
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error(`Route error: ${err.message}`, { 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip 
  });

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message 
  });
});

module.exports = router;
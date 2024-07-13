// routes/shortener.js
const express = require('express');
const router = express.Router();
const ShortenerController = require('../controllers/shortenerController');
const {
  validateShortenRequest,
  validateShortCode,
  validateUniqueId,
  handleValidationErrors,
  checkUniqueId,
} = require('../middlewares/shortenerMiddleware');
const { doubleCsrfProtection } = require('../utils/csrfConfig');
const logger = require('../utils/logger');

// Middleware to apply CSRF protection to all routes in this file
router.use(doubleCsrfProtection);

// Shorten URL route
router.post(
  '/',
  validateShortenRequest,
  handleValidationErrors,
  checkUniqueId,
  asyncHandler(ShortenerController.shortenUrls)
);

// Expand short URL route
router.get(
  '/:shortCode',
  validateShortCode,
  handleValidationErrors,
  asyncHandler(ShortenerController.expandUrl)
);

// Get user URLs route
router.get(
  '/user/:uniqueId',
  validateUniqueId,
  handleValidationErrors,
  asyncHandler(ShortenerController.getUserUrls)
);

// Expand URL and return JSON route
router.get(
  '/expand/:shortCode',
  validateShortCode,
  handleValidationErrors,
  asyncHandler(ShortenerController.expandUrlJson)
);

// Get recent short codes route
router.get('/recent', asyncHandler(ShortenerController.getRecentShortCodes));

// Delete URL route
router.delete(
  '/:shortCode',
  validateShortCode,
  checkUniqueId,
  handleValidationErrors,
  asyncHandler(ShortenerController.deleteUrl)
);

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error(`Shortener route error: ${err.message}`, {
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

// Async handler to catch errors in async route handlers
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = router;
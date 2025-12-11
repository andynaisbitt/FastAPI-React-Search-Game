// routes/search.js
const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const {
  validateSearchParams,
  validateGeneralSearch,
  handleValidationErrors,
  expandShortCode,
} = require('../middlewares/searchMiddleware');
const { doubleCsrfProtection } = require('../utils/csrfConfig');
const logger = require('../utils/logger');

// Perform game search route (POST - needs CSRF)
router.post('/:uniqueId/:shortCode/search',
  doubleCsrfProtection,
  validateSearchParams,
  handleValidationErrors,
  expandShortCode,
  asyncHandler(SearchController.performGameSearch)
);

// General search route (GET - no CSRF needed)
router.get('/',
  validateGeneralSearch,
  handleValidationErrors,
  asyncHandler(SearchController.performGeneralSearch)
);

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error(`Search route error: ${err.message}`, {
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
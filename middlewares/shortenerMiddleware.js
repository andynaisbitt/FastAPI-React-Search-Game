// middleware/shortenerMiddleware.js
const { body, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { doubleCsrfProtection } = require('../utils/csrfConfig');

const shortenerMiddleware = {
  validateShortenRequest: [
    body('urls')
      .isArray().withMessage('URLs must be provided as an array')
      .notEmpty().withMessage('At least one URL must be provided'),
    body('urls.*')
      .isURL().withMessage('Invalid URL provided')
      .customSanitizer(url => url.trim())
      .isLength({ max: 2000 }).withMessage('URL too long'),
  ],

  validateShortCode: [
    param('shortCode')
      .isString().withMessage('Short code must be a string')
      .isLength({ min: 6, max: 10 }).withMessage('Invalid short code length')
      .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Short code contains invalid characters'),
  ],

  validateUniqueId: [
    param('uniqueId')
      .isUUID().withMessage('Invalid uniqueId')
      .customSanitizer(value => value.trim()),
  ],

  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },

  checkUniqueId: (req, res, next) => {
    if (!req.session || !req.session.uniqueId) {
      logger.warn('User unique ID not found in session');
      return res.status(400).json({ error: 'User unique ID not found' });
    }
    next();
  },

  logRequest: (req, res, next) => {
    logger.info(`Shortener request: ${req.method} ${req.originalUrl}`, {
      body: req.body,
      params: req.params,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
    next();
  },

  csrfProtection: doubleCsrfProtection,

  handleCsrfError: (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      logger.warn('Invalid CSRF token', { url: req.originalUrl, method: req.method });
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next(err);
  },
};

// Wrap each middleware function to catch any unexpected errors
Object.keys(shortenerMiddleware).forEach(key => {
  if (typeof shortenerMiddleware[key] === 'function' && key !== 'csrfProtection') {
    const originalMiddleware = shortenerMiddleware[key];
    shortenerMiddleware[key] = (req, res, next) => {
      try {
        originalMiddleware(req, res, next);
      } catch (error) {
        logger.error(`Unexpected error in ${key} middleware:`, error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    };
  }
});

module.exports = shortenerMiddleware;
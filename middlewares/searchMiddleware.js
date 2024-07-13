// middleware/searchMiddleware.js
const { body, param, validationResult } = require('express-validator');
const urlShortener = require('../utils/urlShortener');

const searchMiddleware = {
  validateSearchParams: [
    param('uniqueId').isUUID().withMessage('Invalid uniqueId'),
    param('shortCode').isString().isLength({ min: 6, max: 10 }).withMessage('Invalid shortCode'),
    body('query').isString().trim().notEmpty().withMessage('Search query is required'),
  ],

  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },

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
};

module.exports = searchMiddleware;
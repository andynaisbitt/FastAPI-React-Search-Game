// controllers/shortenerController.js
const urlShortener = require('../utils/urlShortener/urlController');
const logger = require('../utils/logger');
const { InvalidURLError, ShortCodeNotFoundError } = require('../utils/urlShortener/errorHandler');
const { generateToken } = require('../utils/csrfConfig');

class ShortenerController {
  static async shortenUrls(req, res) {
    const { urls: longUrls } = req.body;
    const { uniqueId } = req.session;

    if (!longUrls || !Array.isArray(longUrls) || longUrls.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty URL array provided' });
    }

    try {
      const shortCodes = await urlShortener.shortenMultipleURLs(longUrls, uniqueId);
      const csrfToken = generateToken(req, res);
      res.json({ shortCodes, csrfToken });
    } catch (err) {
      logger.error('Error shortening URLs:', err);
      if (err instanceof InvalidURLError) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Error shortening URLs' });
      }
    }
  }

  static async expandUrl(req, res) {
    const { shortCode } = req.params;

    try {
      const result = await urlShortener.expandURL(shortCode);
      res.redirect(result.longUrl);
    } catch (err) {
      logger.error('Error expanding short code:', err);
      if (err instanceof ShortCodeNotFoundError) {
        res.status(404).render('error', { message: 'Short code not found or expired' });
      } else {
        res.status(500).render('error', { message: 'Error expanding short code' });
      }
    }
  }

  static async getUserUrls(req, res) {
    const { uniqueId } = req.params;

    try {
      const userUrls = await urlShortener.getUserURLs(uniqueId);
      const csrfToken = generateToken(req, res);
      if (userUrls.length > 0) {
        res.json({ userUrls, csrfToken });
      } else {
        logger.info(`No URLs found for user: ${uniqueId}`);
        res.status(404).json({ message: 'No URLs found for this user', csrfToken });
      }
    } catch (err) {
      logger.error('Error retrieving user URLs:', err);
      res.status(500).json({ error: 'Error retrieving user URLs' });
    }
  }

  static async expandUrlJson(req, res) {
    const { shortCode } = req.params;

    try {
      const result = await urlShortener.expandURL(shortCode);
      const csrfToken = generateToken(req, res);
      res.json({ longUrl: result.longUrl, csrfToken });
    } catch (err) {
      logger.error('Error expanding short code:', err);
      if (err instanceof ShortCodeNotFoundError) {
        res.status(404).json({ error: 'Short code not found or expired' });
      } else {
        res.status(500).json({ error: 'Error expanding short code' });
      }
    }
  }

  static async getRecentShortCodes(req, res) {
    try {
      const recentShortCodes = await urlShortener.getRecentShortCodes();
      const csrfToken = generateToken(req, res);
      res.json({ recentShortCodes, csrfToken });
    } catch (err) {
      logger.error('Error retrieving recent short codes:', err);
      res.status(500).json({ error: 'Error retrieving recent short codes' });
    }
  }

  static async deleteUrl(req, res) {
    const { shortCode } = req.params;
    const { uniqueId } = req.session;

    try {
      await urlShortener.deleteURL(shortCode, uniqueId);
      const csrfToken = generateToken(req, res);
      res.json({ message: 'URL deleted successfully', csrfToken });
    } catch (err) {
      logger.error('Error deleting URL:', err);
      if (err instanceof ShortCodeNotFoundError) {
        res.status(404).json({ error: 'Short code not found' });
      } else {
        res.status(500).json({ error: 'Error deleting URL' });
      }
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

module.exports = ShortenerController;
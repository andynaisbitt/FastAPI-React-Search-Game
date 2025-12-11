// controllers/shortenerController.js
const urlShortener = require('../utils/urlShortener/urlController');
const logger = require('../utils/logger');
const { InvalidURLError, ShortCodeNotFoundError } = require('../utils/urlShortener/errorHandler');
const { generateToken } = require('../utils/csrfConfig');
const { getDifficulty, isValidDifficulty } = require('../utils/game/difficultyLevels');

class ShortenerController {
  static async shortenUrls(req, res) {
    const { urls: longUrls, difficulty, challengeText, hints, correctAnswers } = req.body;
    // Accept uniqueId from multiple sources: body (frontend), cookies (middleware), or session
    const uniqueId = req.body.uniqueId || req.cookies.uniqueId || req.session.uniqueId;

    // Debug logging
    logger.info('Shorten URL request:', {
      hasBodyUniqueId: !!req.body.uniqueId,
      hasCookieUniqueId: !!req.cookies.uniqueId,
      hasSessionUniqueId: !!req.session.uniqueId,
      finalUniqueId: uniqueId ? 'present' : 'missing',
      cookies: req.cookies
    });

    if (!uniqueId) {
      logger.warn('User unique ID not found in request');
      return res.status(400).json({ error: 'User unique ID not found' });
    }

    if (!longUrls || !Array.isArray(longUrls) || longUrls.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty URL array provided' });
    }

    // Validate difficulty if provided
    const finalDifficulty = difficulty || 'medium';
    if (!isValidDifficulty(finalDifficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Get difficulty configuration
    const difficultyConfig = getDifficulty(finalDifficulty);

    // Prepare options for URL shortening
    const options = {
      difficulty: finalDifficulty,
      challengeText: challengeText || null,
      hints: hints ? JSON.stringify(hints) : null,
      correctAnswers: correctAnswers ? JSON.stringify(correctAnswers) : null,
      timeLimitSeconds: difficultyConfig.timeLimitSeconds,
    };

    try {
      const shortCodes = await urlShortener.shortenMultipleURLs(longUrls, uniqueId, options);
      const csrfToken = generateToken(req, res);

      logger.info(`Created ${shortCodes.length} URLs with difficulty: ${finalDifficulty}`);

      res.json({
        shortCodes,
        difficulty: finalDifficulty,
        timeLimitSeconds: difficultyConfig.timeLimitSeconds,
        csrfToken,
      });
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
    // Accept uniqueId from multiple sources: body (frontend), cookies (middleware), or session
    const uniqueId = req.body.uniqueId || req.cookies.uniqueId || req.session.uniqueId;

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
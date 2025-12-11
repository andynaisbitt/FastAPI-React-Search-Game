// controllers/gameController.js (Enhanced with Analytics & Difficulty)
const { analyzeUrl, generateHint } = require('../utils/gameUtils');
const { performSearch, performLiveSearch } = require('../utils/game/performSearch');
const { getRandomCharacterImage } = require('../utils/characterUtils');
const { isSimilarDomain } = require('../utils/urlUtils');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/csrfConfig');

// NEW: Import analytics and difficulty systems
const analytics = require('../utils/analytics');
const { getDifficulty, calculateScore, generateHintForDifficulty } = require('../utils/game/difficultyLevels');
const { calculateAdStrategy, getAdPlaceholder, shouldShowAds } = require('../utils/adPlacement');

class GameController {
  /**
   * Render the game page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static renderGamePage(req, res) {
    try {
      const { uniqueId, shortCode } = req.params;
      const { longUrl, difficulty, challengeText, hints, timeLimitSeconds } = req;

      // Start analytics session
      const sessionId = analytics.startSession(shortCode, req);
      req.session.analyticsId = sessionId;
      req.session.gameStart = Date.now();
      req.session.hintsUsed = 0;
      req.session.attempts = 0;

      // Get difficulty configuration
      const difficultyConfig = getDifficulty(difficulty || 'medium');

      // Analyze URL for game question
      const analyzedUrl = analyzeUrl(longUrl);

      // Get random character image
      const characterImage = getRandomCharacterImage();

      // Calculate ad strategy
      const adPlacements = calculateAdStrategy({
        difficulty: difficulty || 'medium',
        timeLimitSeconds: timeLimitSeconds || 120,
      });

      const csrfToken = generateToken(req, res);

      res.render('game', {
        uniqueId,
        shortCode,
        longUrl,
        gameQuestion: challengeText || analyzedUrl.gameQuestion,
        searchOperators: analyzedUrl.searchOperators,
        characterImage,
        difficulty: difficultyConfig.id,
        difficultyName: difficultyConfig.name,
        difficultyIcon: difficultyConfig.icon,
        timeLimit: timeLimitSeconds || difficultyConfig.timeLimitSeconds,
        maxHints: difficultyConfig.maxHints,
        sessionId,
        adPlacements,
        adsEnabled: process.env.ADSENSE_ENABLED === 'true',
        csrfToken,
      });

      logger.info(`[GAME] Started session ${sessionId} for ${shortCode} [${difficultyConfig.name}]`);
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
      // Track search attempt
      if (req.session.analyticsId) {
        req.session.attempts = (req.session.attempts || 0) + 1;
      }

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
      const difficulty = req.difficulty || 'medium';

      // Use difficulty-based hint generation
      const hint = generateHintForDifficulty(difficulty, analyzedUrl, hintLevel);

      // Track hint usage
      if (req.session.analyticsId) {
        req.session.hintsUsed = (req.session.hintsUsed || 0) + 1;
      }

      const csrfToken = generateToken(req, res);

      logger.info(`[GAME] Hint ${hintLevel} requested for session ${req.session.analyticsId}`);

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

      // Calculate time taken
      const timeElapsed = (Date.now() - req.session.gameStart) / 1000; // seconds
      const difficulty = req.difficulty || 'medium';
      const timeLimit = req.timeLimitSeconds || 120;
      const timeRemaining = Math.max(0, timeLimit - timeElapsed);

      // Calculate score
      const scoreBreakdown = calculateScore(
        difficulty,
        timeRemaining,
        req.session.hintsUsed || 0,
        isCorrect
      );

      const csrfToken = generateToken(req, res);

      // Track outcome
      if (req.session.analyticsId) {
        if (isCorrect) {
          analytics.trackCompletion(req.session.analyticsId, {
            completionTime: timeElapsed,
            hintsUsed: req.session.hintsUsed || 0,
            attempts: req.session.attempts || 1,
            score: scoreBreakdown.totalScore,
          });

          logger.info(`[GAME] Session ${req.session.analyticsId} completed in ${timeElapsed.toFixed(1)}s`);
        } else {
          // Track attempt (not final failure yet)
          logger.info(`[GAME] Wrong answer attempt for session ${req.session.analyticsId}`);
        }
      }

      res.json({
        correct: isCorrect,
        score: scoreBreakdown.totalScore,
        scoreBreakdown,
        timeElapsed: timeElapsed.toFixed(1),
        csrfToken,
      });
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
      const { longUrl, difficulty, challengeText, timeLimitSeconds } = req;

      const analyzedUrl = analyzeUrl(longUrl);
      const csrfToken = generateToken(req, res);

      res.json({
        uniqueId,
        shortCode,
        longUrl,
        gameQuestion: challengeText || analyzedUrl.gameQuestion,
        searchOperators: analyzedUrl.searchOperators,
        difficulty: difficulty || 'medium',
        timeLimit: timeLimitSeconds || 120,
        csrfToken,
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
    const { outcome, score, timeLeft, submitToLeaderboard, nickname } = req.body;

    try {
      const sessionId = req.session.analyticsId;
      const shortCode = req.params.shortCode;

      if (!sessionId) {
        return res.status(400).json({ error: 'No active session' });
      }

      // Track outcome based on type
      switch (outcome) {
        case 'completed':
          // Already tracked in checkAnswer
          break;

        case 'timeout':
          analytics.trackTimeout(sessionId, {
            attempts: req.session.attempts || 0,
            hintsUsed: req.session.hintsUsed || 0,
            score: score || 0,
          });
          logger.info(`[GAME] Session ${sessionId} timed out`);
          break;

        case 'failed':
          analytics.trackFailure(sessionId, {
            attempts: req.session.attempts || 0,
            hintsUsed: req.session.hintsUsed || 0,
            score: score || 0,
          });
          logger.info(`[GAME] Session ${sessionId} failed`);
          break;

        case 'abandoned':
          analytics.trackAbandonment(sessionId);
          logger.info(`[GAME] Session ${sessionId} abandoned`);
          break;
      }

      // Add to leaderboard if requested and completed successfully
      if (submitToLeaderboard && outcome === 'completed') {
        const timeElapsed = (Date.now() - req.session.gameStart) / 1000;

        analytics.addToLeaderboard(shortCode, {
          nickname: nickname || 'Anonymous',
          country: req.get('cf-ipcountry') || null, // Cloudflare country code
          completionTime: timeElapsed,
          hintsUsed: req.session.hintsUsed || 0,
          score: score || 0,
          difficulty: req.difficulty || 'medium',
        });

        logger.info(`[GAME] Added session ${sessionId} to leaderboard`);
      }

      const csrfToken = generateToken(req, res);

      res.json({
        message: 'Game ended successfully',
        outcome,
        score,
        timeLeft,
        sessionId,
        csrfToken,
      });
    } catch (err) {
      logger.error('Error ending game:', err);
      res.status(500).json({ error: 'Error ending game' });
    }
  }

  /**
   * Get high scores / leaderboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static getHighScores(req, res) {
    try {
      const { shortCode } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const leaderboard = analytics.getLeaderboard(shortCode, limit);
      const csrfToken = generateToken(req, res);

      res.json({ leaderboard, csrfToken });
    } catch (err) {
      logger.error('Error fetching high scores:', err);
      res.status(500).json({ error: 'Error fetching high scores' });
    }
  }

  /**
   * Get analytics summary for a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static getAnalyticsSummary(req, res) {
    try {
      const { shortCode } = req.params;

      const summary = analytics.getAnalyticsSummary(shortCode);
      const csrfToken = generateToken(req, res);

      res.json({ summary, csrfToken });
    } catch (err) {
      logger.error('Error fetching analytics:', err);
      res.status(500).json({ error: 'Error fetching analytics' });
    }
  }

  /**
   * Track ad impression
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static trackAdImpression(req, res) {
    try {
      const { placementType } = req.body;
      const sessionId = req.session.analyticsId;

      if (sessionId) {
        analytics.trackAdImpression(sessionId, placementType);
      }

      res.json({ success: true });
    } catch (err) {
      logger.error('Error tracking ad impression:', err);
      res.status(500).json({ error: 'Error tracking ad impression' });
    }
  }

  /**
   * Track ad click
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static trackAdClick(req, res) {
    try {
      const { placementType, estimatedRevenue } = req.body;
      const sessionId = req.session.analyticsId;

      if (sessionId) {
        analytics.trackAdClick(sessionId, placementType, estimatedRevenue || 0.02);
      }

      res.json({ success: true });
    } catch (err) {
      logger.error('Error tracking ad click:', err);
      res.status(500).json({ error: 'Error tracking ad click' });
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

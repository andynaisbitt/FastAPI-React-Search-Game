// routes/game.js
const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const {
  expandShortCode,
  validateGameParams,
  validateSearchInput,
  validateHintRequest,
  validateAnswerSubmission,
  validateGameEnd,
  handleValidationErrors,
  checkGameActive,
  limitHintRequests,
  setCorsHeaders,
} = require('../middlewares/gameMiddleware');
const { doubleCsrfProtection } = require('../utils/csrfConfig');
const logger = require('../utils/logger');

// Apply CORS headers to all routes
router.use(setCorsHeaders);

// Apply CSRF protection to all routes
router.use(doubleCsrfProtection);

// Render game page
router.get('/:uniqueId/:shortCode', 
  validateGameParams,
  handleValidationErrors,
  expandShortCode,
  asyncHandler(GameController.renderGamePage)
);

// Initialize game
router.get('/:uniqueId/:shortCode/initialize', 
  validateGameParams,
  handleValidationErrors,
  expandShortCode,
  asyncHandler(GameController.initializeGame)
);

// Perform search
router.post('/:uniqueId/:shortCode/search', 
  validateGameParams,
  validateSearchInput,
  handleValidationErrors,
  expandShortCode,
  checkGameActive,
  asyncHandler(GameController.performSearch)
);

// Generate hint
router.post('/:uniqueId/:shortCode/hint', 
  validateGameParams,
  validateHintRequest,
  handleValidationErrors,
  expandShortCode,
  checkGameActive,
  limitHintRequests,
  asyncHandler(GameController.generateHint)
);

// Perform live search
router.post('/:uniqueId/:shortCode/live-search', 
  validateGameParams,
  validateSearchInput,
  handleValidationErrors,
  expandShortCode,
  checkGameActive,
  asyncHandler(GameController.performLiveSearch)
);

// Check answer
router.post('/:uniqueId/:shortCode/check-answer', 
  validateGameParams,
  validateAnswerSubmission,
  handleValidationErrors,
  expandShortCode,
  checkGameActive,
  asyncHandler(GameController.checkAnswer)
);

// End game
router.post('/:uniqueId/:shortCode/end', 
  validateGameParams,
  validateGameEnd,
  handleValidationErrors,
  expandShortCode,
  checkGameActive,
  asyncHandler(GameController.endGame)
);

// Get high scores
router.get('/high-scores', asyncHandler(GameController.getHighScores));

// NEW: Leaderboard for specific shortCode
router.get('/leaderboard/:shortCode', asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  const analytics = require('../utils/analytics');
  const { getDb } = require('../utils/urlShortener/database');
  const { getDifficulty } = require('../utils/game/difficultyLevels');

  try {
    // Get URL data
    const db = getDb();
    const urlData = db.prepare('SELECT difficulty, longUrl FROM urls WHERE shortCode = ?').get(shortCode);

    if (!urlData) {
      return res.status(404).render('error', { message: 'URL not found' });
    }

    const difficultyConfig = getDifficulty(urlData.difficulty || 'medium');
    const leaderboard = analytics.getLeaderboard(shortCode, 100);
    const summary = analytics.getAnalyticsSummary(shortCode);

    res.render('leaderboard', {
      shortCode,
      difficulty: urlData.difficulty || 'medium',
      difficultyName: difficultyConfig.name,
      difficultyIcon: difficultyConfig.icon,
      leaderboard,
      summary,
    });
  } catch (err) {
    logger.error(`Error fetching leaderboard: ${err.message}`);
    res.status(500).render('error', { message: 'Error loading leaderboard' });
  }
}));

// NEW: Get analytics summary for a URL
router.get('/:shortCode/analytics', asyncHandler(GameController.getAnalyticsSummary));

// NEW: Track ad impression
router.post('/ad/impression', asyncHandler(GameController.trackAdImpression));

// NEW: Track ad click
router.post('/ad/click', asyncHandler(GameController.trackAdClick));

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error(`Game route error: ${err.message}`, {
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
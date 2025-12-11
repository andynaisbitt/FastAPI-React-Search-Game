// utils/analytics.js
/**
 * Analytics Tracking System
 * Tracks all user interactions with URLs and games
 */

const { getDb, incrementViews, updateAnalyticsSummary } = require('./urlShortener/database');
const logger = require('./logger');

/**
 * Start a new analytics session when URL is accessed
 * @param {string} shortCode - Short URL code
 * @param {Object} req - Express request object
 * @returns {number} Session ID
 */
function startSession(shortCode, req) {
  const db = getDb();

  try {
    // Increment view count
    incrementViews(shortCode);

    // Create analytics session
    const stmt = db.prepare(`
      INSERT INTO url_analytics (
        shortCode,
        visitorIp,
        visitorUserAgent,
        referrer
      ) VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      shortCode,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent') || 'unknown',
      req.get('referer') || null
    );

    logger.info(`[ANALYTICS] Session started: ${result.lastInsertRowid} for ${shortCode}`);

    return result.lastInsertRowid;
  } catch (err) {
    logger.error(`[ANALYTICS] Error starting session: ${err.message}`);
    return null;
  }
}

/**
 * Track game completion
 * @param {number} sessionId - Analytics session ID
 * @param {Object} data - Completion data
 * @param {number} data.completionTime - Time taken in seconds
 * @param {number} data.hintsUsed - Number of hints used
 * @param {number} data.attempts - Number of attempts
 * @param {number} data.score - Final score
 */
function trackCompletion(sessionId, data) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET
        outcome = 'completed',
        sessionEnd = strftime('%s', 'now'),
        completionTime = ?,
        hintsUsed = ?,
        attempts = ?,
        score = ?
      WHERE id = ?
    `);

    stmt.run(
      data.completionTime,
      data.hintsUsed || 0,
      data.attempts || 1,
      data.score || 0,
      sessionId
    );

    logger.info(`[ANALYTICS] Completion tracked for session ${sessionId}`);

    // Update summary statistics
    const shortCodeStmt = db.prepare('SELECT shortCode FROM url_analytics WHERE id = ?');
    const { shortCode } = shortCodeStmt.get(sessionId);
    updateAnalyticsSummary(shortCode);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking completion: ${err.message}`);
  }
}

/**
 * Track game failure (wrong answer)
 * @param {number} sessionId - Analytics session ID
 * @param {Object} data - Failure data
 */
function trackFailure(sessionId, data) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET
        outcome = 'failed',
        sessionEnd = strftime('%s', 'now'),
        attempts = ?,
        hintsUsed = ?,
        score = ?
      WHERE id = ?
    `);

    stmt.run(
      data.attempts || 1,
      data.hintsUsed || 0,
      data.score || 0,
      sessionId
    );

    logger.info(`[ANALYTICS] Failure tracked for session ${sessionId}`);

    // Update summary
    const shortCodeStmt = db.prepare('SELECT shortCode FROM url_analytics WHERE id = ?');
    const { shortCode } = shortCodeStmt.get(sessionId);
    updateAnalyticsSummary(shortCode);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking failure: ${err.message}`);
  }
}

/**
 * Track game timeout
 * @param {number} sessionId - Analytics session ID
 * @param {Object} data - Timeout data
 */
function trackTimeout(sessionId, data) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET
        outcome = 'timeout',
        sessionEnd = strftime('%s', 'now'),
        attempts = ?,
        hintsUsed = ?,
        score = ?
      WHERE id = ?
    `);

    stmt.run(
      data.attempts || 0,
      data.hintsUsed || 0,
      data.score || 0,
      sessionId
    );

    logger.info(`[ANALYTICS] Timeout tracked for session ${sessionId}`);

    // Update summary
    const shortCodeStmt = db.prepare('SELECT shortCode FROM url_analytics WHERE id = ?');
    const { shortCode } = shortCodeStmt.get(sessionId);
    updateAnalyticsSummary(shortCode);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking timeout: ${err.message}`);
  }
}

/**
 * Track game abandonment (user left before completing)
 * @param {number} sessionId - Analytics session ID
 */
function trackAbandonment(sessionId) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET
        outcome = 'abandoned',
        sessionEnd = strftime('%s', 'now')
      WHERE id = ? AND outcome IS NULL
    `);

    stmt.run(sessionId);

    logger.info(`[ANALYTICS] Abandonment tracked for session ${sessionId}`);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking abandonment: ${err.message}`);
  }
}

/**
 * Track ad impression
 * @param {number} sessionId - Analytics session ID
 * @param {string} placementType - Ad placement type
 */
function trackAdImpression(sessionId, placementType) {
  const db = getDb();

  try {
    // Update session
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET adsShown = adsShown + 1
      WHERE id = ?
    `);

    stmt.run(sessionId);

    // Update ad placement stats
    const placementStmt = db.prepare(`
      INSERT INTO ad_placements (placementType, impressions, updatedAt)
      VALUES (?, 1, strftime('%s', 'now'))
      ON CONFLICT(placementType) DO UPDATE SET
        impressions = impressions + 1,
        updatedAt = strftime('%s', 'now')
    `);

    placementStmt.run(placementType);

    logger.info(`[ANALYTICS] Ad impression: ${placementType} for session ${sessionId}`);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking ad impression: ${err.message}`);
  }
}

/**
 * Track ad click
 * @param {number} sessionId - Analytics session ID
 * @param {string} placementType - Ad placement type
 * @param {number} estimatedRevenue - Estimated revenue from click (CPM/CPC)
 */
function trackAdClick(sessionId, placementType, estimatedRevenue = 0.02) {
  const db = getDb();

  try {
    // Update session
    const stmt = db.prepare(`
      UPDATE url_analytics
      SET
        adsClicked = adsClicked + 1,
        estimatedRevenue = estimatedRevenue + ?
      WHERE id = ?
    `);

    stmt.run(estimatedRevenue, sessionId);

    // Update ad placement stats
    const placementStmt = db.prepare(`
      UPDATE ad_placements
      SET
        clicks = clicks + 1,
        ctr = CAST(clicks AS REAL) / impressions,
        avgRevenuePerImpression = (avgRevenuePerImpression * impressions + ?) / (impressions + 1),
        updatedAt = strftime('%s', 'now')
      WHERE placementType = ?
    `);

    placementStmt.run(estimatedRevenue, placementType);

    logger.info(`[ANALYTICS] Ad click: ${placementType} ($${estimatedRevenue}) for session ${sessionId}`);
  } catch (err) {
    logger.error(`[ANALYTICS] Error tracking ad click: ${err.message}`);
  }
}

/**
 * Get analytics summary for a short code
 * @param {string} shortCode - Short URL code
 * @returns {Object} Analytics summary
 */
function getAnalyticsSummary(shortCode) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT
        totalViews,
        totalCompletions,
        totalFailures,
        totalTimeouts,
        avgCompletionTime,
        (totalCompletions * 1.0 / NULLIF(totalViews, 0)) * 100 as completionRate
      FROM urls
      WHERE shortCode = ?
    `);

    const summary = stmt.get(shortCode);

    return summary || {};
  } catch (err) {
    logger.error(`[ANALYTICS] Error getting summary: ${err.message}`);
    return {};
  }
}

/**
 * Get detailed analytics for a short code
 * @param {string} shortCode - Short URL code
 * @param {number} limit - Number of sessions to return
 * @returns {Array} Array of session data
 */
function getDetailedAnalytics(shortCode, limit = 100) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT *
      FROM url_analytics
      WHERE shortCode = ?
      ORDER BY sessionStart DESC
      LIMIT ?
    `);

    return stmt.all(shortCode, limit);
  } catch (err) {
    logger.error(`[ANALYTICS] Error getting detailed analytics: ${err.message}`);
    return [];
  }
}

/**
 * Get leaderboard for a short code
 * @param {string} shortCode - Short URL code
 * @param {number} limit - Number of entries to return
 * @returns {Array} Leaderboard entries
 */
function getLeaderboard(shortCode, limit = 100) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT *
      FROM leaderboard
      WHERE shortCode = ?
      ORDER BY score DESC, completionTime ASC
      LIMIT ?
    `);

    return stmt.all(shortCode, limit);
  } catch (err) {
    logger.error(`[ANALYTICS] Error getting leaderboard: ${err.message}`);
    return [];
  }
}

/**
 * Add entry to leaderboard
 * @param {string} shortCode - Short URL code
 * @param {Object} data - Leaderboard entry data
 * @returns {number} Entry ID
 */
function addToLeaderboard(shortCode, data) {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO leaderboard (
        shortCode,
        playerNickname,
        playerCountry,
        completionTime,
        hintsUsed,
        score,
        difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      shortCode,
      data.nickname || 'Anonymous',
      data.country || null,
      data.completionTime,
      data.hintsUsed || 0,
      data.score,
      data.difficulty
    );

    // Calculate rank and percentile
    calculateLeaderboardRanks(shortCode);

    logger.info(`[ANALYTICS] Added to leaderboard: ${result.lastInsertRowid}`);

    return result.lastInsertRowid;
  } catch (err) {
    logger.error(`[ANALYTICS] Error adding to leaderboard: ${err.message}`);
    return null;
  }
}

/**
 * Calculate and update leaderboard ranks
 * @param {string} shortCode - Short URL code
 */
function calculateLeaderboardRanks(shortCode) {
  const db = getDb();

  try {
    // Update ranks
    const stmt = db.prepare(`
      WITH RankedLeaderboard AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY score DESC, completionTime ASC) as newRank,
          COUNT(*) OVER () as totalCount
        FROM leaderboard
        WHERE shortCode = ?
      )
      UPDATE leaderboard
      SET
        rank = (SELECT newRank FROM RankedLeaderboard WHERE RankedLeaderboard.id = leaderboard.id),
        percentile = CAST((SELECT newRank FROM RankedLeaderboard WHERE RankedLeaderboard.id = leaderboard.id) AS REAL) / (SELECT totalCount FROM RankedLeaderboard LIMIT 1) * 100
      WHERE shortCode = ?
    `);

    stmt.run(shortCode, shortCode);

    logger.info(`[ANALYTICS] Leaderboard ranks updated for ${shortCode}`);
  } catch (err) {
    logger.error(`[ANALYTICS] Error calculating ranks: ${err.message}`);
  }
}

/**
 * Get global analytics (all URLs)
 * @returns {Object} Global statistics
 */
function getGlobalAnalytics() {
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as totalUrls,
        SUM(totalViews) as totalViews,
        SUM(totalCompletions) as totalCompletions,
        AVG(avgCompletionTime) as avgCompletionTime,
        SUM(totalFailures) as totalFailures,
        SUM(totalTimeouts) as totalTimeouts
      FROM urls
    `);

    const globalStats = stmt.get();

    // Get revenue
    const revenueStmt = db.prepare(`
      SELECT SUM(estimatedRevenue) as totalRevenue
      FROM url_analytics
    `);

    const { totalRevenue } = revenueStmt.get();

    return {
      ...globalStats,
      totalRevenue: totalRevenue || 0,
      completionRate: (globalStats.totalCompletions / globalStats.totalViews) * 100 || 0,
    };
  } catch (err) {
    logger.error(`[ANALYTICS] Error getting global analytics: ${err.message}`);
    return {};
  }
}

module.exports = {
  startSession,
  trackCompletion,
  trackFailure,
  trackTimeout,
  trackAbandonment,
  trackAdImpression,
  trackAdClick,
  getAnalyticsSummary,
  getDetailedAnalytics,
  getLeaderboard,
  addToLeaderboard,
  calculateLeaderboardRanks,
  getGlobalAnalytics,
};

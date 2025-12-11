// utils/urlShortener/urlController.js
const { getDb } = require('./database');
const { generateUniqueShortCode } = require('./shortCode');
const { InvalidURLError, ShortCodeNotFoundError } = require('./errorHandler');
const { URL_EXPIRATION_TIME } = require('./config');
const logger = require('../logger');
const bcrypt = require('bcrypt');

function validateURL(url) {
  try {
    // Add protocol if missing
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    new URL(normalizedUrl);
    return normalizedUrl; // Return normalized URL
  } catch (error) {
    return false;
  }
}

async function shortenURL(longUrl, uniqueId, options = {}) {
  const normalizedUrl = validateURL(longUrl);
  if (!normalizedUrl) {
    throw new InvalidURLError('Invalid URL provided');
  }

  const db = getDb();
  const shortCode = generateUniqueShortCode();
  const expiresAt = Date.now() + URL_EXPIRATION_TIME;
  const hashedUniqueId = await bcrypt.hash(uniqueId, 10);

  // Extract challenge options with defaults
  const {
    difficulty = 'medium',
    challengeText = null,
    hints = null,
    correctAnswers = null,
    timeLimitSeconds = 120,
  } = options;

  try {
    const stmt = db.prepare(`
      INSERT INTO urls (
        shortCode, longUrl, expiresAt, uniqueId,
        difficulty, challengeText, hints, correctAnswers, timeLimitSeconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      shortCode,
      normalizedUrl,
      expiresAt,
      hashedUniqueId,
      difficulty,
      challengeText,
      hints, // Should be JSON string or null
      correctAnswers, // Should be JSON string or null
      timeLimitSeconds
    );

    logger.info(`URL shortened: ${normalizedUrl} -> ${shortCode} [${difficulty}]`);
    return shortCode;
  } catch (error) {
    logger.error(`Error shortening URL: ${error.message}`);
    throw error;
  }
}

function expandURL(shortCode) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      longUrl, expiresAt, uniqueId,
      difficulty, challengeText, hints, correctAnswers, timeLimitSeconds
    FROM urls WHERE shortCode = ?
  `);
  const row = stmt.get(shortCode);

  if (!row) {
    throw new ShortCodeNotFoundError(`Short code not found: ${shortCode}`);
  }

  if (row.expiresAt < Date.now()) {
    deleteURL(shortCode);
    throw new ShortCodeNotFoundError(`Short code expired: ${shortCode}`);
  }

  logger.info(`Expanded short code: ${shortCode} -> ${row.longUrl} [${row.difficulty}]`);

  return {
    longUrl: row.longUrl,
    uniqueId: row.uniqueId,
    difficulty: row.difficulty || 'medium',
    challengeText: row.challengeText,
    hints: row.hints ? JSON.parse(row.hints) : null,
    correctAnswers: row.correctAnswers ? JSON.parse(row.correctAnswers) : null,
    timeLimitSeconds: row.timeLimitSeconds || 120,
  };
}

function deleteURL(shortCode) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM urls WHERE shortCode = ?');
  const info = stmt.run(shortCode);

  if (info.changes === 0) {
    throw new ShortCodeNotFoundError(`Short code not found for deletion: ${shortCode}`);
  }

  logger.info(`Deleted URL with short code: ${shortCode}`);
}

function getRecentShortCodes() {
  const db = getDb();
  const stmt = db.prepare('SELECT shortCode FROM urls ORDER BY createdAt DESC LIMIT 5');
  const rows = stmt.all();
  return rows.map(row => row.shortCode);
}

function getUserURLs(uniqueId) {
  const db = getDb();
  const stmt = db.prepare('SELECT shortCode, longUrl, createdAt FROM urls WHERE uniqueId = ?');
  return stmt.all(uniqueId);
}

async function shortenMultipleURLs(longUrls, uniqueId, options = {}) {
  const shortCodes = [];
  const errors = [];

  for (const longUrl of longUrls) {
    try {
      const shortCode = await shortenURL(longUrl, uniqueId, options);
      shortCodes.push(shortCode);
    } catch (error) {
      logger.error(`Error shortening URL ${longUrl}: ${error.message}`);
      errors.push({ url: longUrl, error: error.message });
      // Continue with the next URL instead of throwing an error
    }
  }

  // If ALL URLs failed, throw an error
  if (shortCodes.length === 0 && errors.length > 0) {
    const errorMessages = errors.map(e => `${e.url}: ${e.error}`).join(', ');
    throw new InvalidURLError(`Failed to shorten all URLs. Errors: ${errorMessages}`);
  }

  // Log warning if some URLs failed
  if (errors.length > 0) {
    logger.warn(`Failed to shorten ${errors.length} of ${longUrls.length} URLs`);
  }

  return shortCodes;
}

module.exports = {
  shortenURL,
  expandURL,
  deleteURL,
  getRecentShortCodes,
  getUserURLs,
  shortenMultipleURLs,
};
// utils/urlShortener/urlController.js
const { getDb } = require('./database');
const { generateUniqueShortCode } = require('./shortCode');
const { InvalidURLError, ShortCodeNotFoundError } = require('./errorHandler');
const { URL_EXPIRATION_TIME } = require('./config');
const logger = require('../logger');
const bcrypt = require('bcrypt');

function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

async function shortenURL(longUrl, uniqueId) {
  if (!validateURL(longUrl)) {
    throw new InvalidURLError('Invalid URL provided');
  }

  const db = getDb();
  const shortCode = generateUniqueShortCode();
  const expiresAt = Date.now() + URL_EXPIRATION_TIME;
  const hashedUniqueId = await bcrypt.hash(uniqueId, 10);

  try {
    const stmt = db.prepare('INSERT INTO urls (shortCode, longUrl, expiresAt, uniqueId) VALUES (?, ?, ?, ?)');
    stmt.run(shortCode, longUrl, expiresAt, hashedUniqueId);

    logger.info(`URL shortened: ${longUrl} -> ${shortCode}`);
    return shortCode;
  } catch (error) {
    logger.error(`Error shortening URL: ${error.message}`);
    throw error;
  }
}

function expandURL(shortCode) {
  const db = getDb();
  const stmt = db.prepare('SELECT longUrl, expiresAt, uniqueId FROM urls WHERE shortCode = ?');
  const row = stmt.get(shortCode);

  if (!row) {
    throw new ShortCodeNotFoundError(`Short code not found: ${shortCode}`);
  }

  if (row.expiresAt < Date.now()) {
    deleteURL(shortCode);
    throw new ShortCodeNotFoundError(`Short code expired: ${shortCode}`);
  }

  logger.info(`Expanded short code: ${shortCode} -> ${row.longUrl}`);
  return { longUrl: row.longUrl, uniqueId: row.uniqueId };
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

async function shortenMultipleURLs(longUrls, uniqueId) {
  const shortCodes = [];
  for (const longUrl of longUrls) {
    try {
      const shortCode = await shortenURL(longUrl, uniqueId);
      shortCodes.push(shortCode);
    } catch (error) {
      logger.error(`Error shortening URL ${longUrl}: ${error.message}`);
      // Continue with the next URL instead of throwing an error
    }
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
// utils/urlShortener.js
const { shortenURL, expandURL, deleteURL, getRecentShortCodes, getUserURLs } = require('./urlShortener/urlController');
const { errorHandler } = require('./urlShortener/errorHandler');
const logger = require('./logger');
const { URL_EXPIRATION_TIME } = require('./urlShortener/config');
const { getDb } = require('./urlShortener/database');

function cleanup() {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM urls WHERE expiresAt < ?');
  const info = stmt.run(Date.now());
  logger.info(`Cleanup completed. Deleted ${info.changes} expired URLs.`);
}

// Run cleanup every 60 minutes
setInterval(cleanup, 60 * 60 * 1000);

// Ensure the database is closed when the process exits
process.on('exit', () => {
  const db = getDb();
  db.close();
});

module.exports = {
  shortenURL,
  expandURL,
  deleteURL,
  getRecentShortCodes,
  getUserURLs,
  errorHandler,
};
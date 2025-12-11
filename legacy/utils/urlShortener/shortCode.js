// utils\urlShortener\shortCode.js
const crypto = require('crypto');
const { getDb } = require('./database');
const { ShortCodeExistsError } = require('./errorHandler');

function generateShortCode() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(3).toString('hex');
  return `${timestamp}${randomBytes}`;
}

function isShortCodeExists(shortCode) {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM urls WHERE shortCode = ?');
  const result = stmt.get(shortCode);
  return result.count > 0;
}

function generateUniqueShortCode() {
  let shortCode;
  let retries = 0;
  const maxRetries = 3;

  do {
    shortCode = generateShortCode();
    retries++;
  } while (isShortCodeExists(shortCode) && retries < maxRetries);

  if (retries === maxRetries) {
    throw new ShortCodeExistsError('Failed to generate a unique short code');
  }

  return shortCode;
}

module.exports = {
  generateUniqueShortCode,
};
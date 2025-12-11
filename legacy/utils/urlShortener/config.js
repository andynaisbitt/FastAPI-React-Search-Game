// utils\urlShortener\config.js
require('dotenv').config();

module.exports = {
  DB_PATH: process.env.DB_PATH || 'database.db',
  URL_EXPIRATION_TIME: process.env.URL_EXPIRATION_TIME || 24 * 60 * 60 * 1000, // 24 hours
};
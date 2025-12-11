// utils/urlShortener/database.js
// Database abstraction layer - supports both development (in-memory) and production (PostgreSQL)

const logger = require('../logger');

// Check environment and load appropriate database
if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
  // Production: Use PostgreSQL
  logger.info('Loading PostgreSQL database configuration');
  const pgConfig = require('../../config/database.postgres');
  module.exports = pgConfig;
} else {
  // Development: Use in-memory database
  logger.info('Loading in-memory database (development mode)');
  const devDb = require('./database.dev');
  module.exports = devDb;
}

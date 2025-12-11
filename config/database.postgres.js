// config/database.postgres.js
// PostgreSQL Database Configuration (Production)

const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
function initializePostgres() {
  if (pool) {
    logger.warn('PostgreSQL pool already initialized');
    return pool;
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jfgi_production',
    user: process.env.DB_USER || 'jfgi_user',
    password: process.env.DB_PASSWORD,

    // Connection pool settings
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),

    // Connection timeout
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,

    // SSL configuration (required for production)
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: true,
    } : false,
  };

  pool = new Pool(config);

  // Event handlers
  pool.on('connect', () => {
    logger.info('PostgreSQL client connected');
  });

  pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL error:', err);
  });

  pool.on('remove', () => {
    logger.info('PostgreSQL client removed from pool');
  });

  logger.info(`PostgreSQL pool initialized: ${config.host}:${config.port}/${config.database}`);

  return pool;
}

/**
 * Get PostgreSQL connection pool
 */
function getPool() {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call initializePostgres() first.');
  }
  return pool;
}

/**
 * Execute a query
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('Query error:', { text, error: err.message });
    throw err;
  }
}

/**
 * Get a client from the pool (for transactions)
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Close the pool
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
}

/**
 * Create database tables (migration)
 */
async function createTables() {
  logger.info('Creating PostgreSQL tables...');

  const tables = [
    // 1. URLs table (enhanced)
    `
      CREATE TABLE IF NOT EXISTS short_urls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) UNIQUE NOT NULL,
        long_url TEXT NOT NULL,

        -- Challenge Configuration
        difficulty VARCHAR(20) DEFAULT 'medium',
        challenge_text TEXT,
        hints JSONB,
        correct_answers JSONB,
        time_limit_seconds INTEGER DEFAULT 180,

        -- Creator Info
        creator_ip VARCHAR(45),
        creator_user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,

        -- Analytics
        total_views INTEGER DEFAULT 0,
        total_completions INTEGER DEFAULT 0,
        total_failures INTEGER DEFAULT 0,
        total_timeouts INTEGER DEFAULT 0,
        avg_completion_time_seconds FLOAT
      );

      CREATE INDEX IF NOT EXISTS idx_short_code ON short_urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_created_at ON short_urls(created_at);
    `,

    // 2. URL Analytics
    `
      CREATE TABLE IF NOT EXISTS url_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) NOT NULL,

        -- Session Data
        session_start TIMESTAMP DEFAULT NOW(),
        session_end TIMESTAMP,

        -- Visitor Info
        visitor_ip VARCHAR(45),
        visitor_user_agent TEXT,
        visitor_country VARCHAR(2),
        visitor_city VARCHAR(100),
        referrer TEXT,

        -- Challenge Results
        outcome VARCHAR(20),
        attempts INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        completion_time_seconds FLOAT,
        score INTEGER,

        -- Ad Revenue Tracking
        ads_shown INTEGER DEFAULT 0,
        ads_clicked INTEGER DEFAULT 0,
        estimated_revenue_usd DECIMAL(10, 4) DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_short_code ON url_analytics(short_code);
      CREATE INDEX IF NOT EXISTS idx_analytics_session_start ON url_analytics(session_start);
      CREATE INDEX IF NOT EXISTS idx_analytics_outcome ON url_analytics(outcome);
    `,

    // 3. Leaderboard
    `
      CREATE TABLE IF NOT EXISTS leaderboard (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) NOT NULL,

        -- Player Info (Anonymous)
        player_nickname VARCHAR(50),
        player_country VARCHAR(2),

        -- Performance
        completion_time_seconds FLOAT NOT NULL,
        hints_used INTEGER DEFAULT 0,
        score INTEGER NOT NULL,

        -- Ranking
        rank INTEGER,
        percentile DECIMAL(5, 2),

        completed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_leaderboard_short_code ON leaderboard(short_code);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_completion_time ON leaderboard(completion_time_seconds);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
    `,

    // 4. Ad Placements (A/B Testing)
    `
      CREATE TABLE IF NOT EXISTS ad_placements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Ad Configuration
        placement_type VARCHAR(30),
        challenge_duration VARCHAR(20),

        -- Performance Metrics
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        ctr DECIMAL(5, 4),
        avg_revenue_per_impression DECIMAL(10, 6),

        -- A/B Testing
        variant VARCHAR(10),
        is_active BOOLEAN DEFAULT TRUE,

        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ad_placement_type ON ad_placements(placement_type);
      CREATE INDEX IF NOT EXISTS idx_ad_variant ON ad_placements(variant);
    `,

    // 5. Abuse Reports
    `
      CREATE TABLE IF NOT EXISTS abuse_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) NOT NULL,

        -- Report Details
        report_type VARCHAR(30),
        report_reason TEXT,
        reporter_ip VARCHAR(45),

        -- Moderation Status
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by VARCHAR(100),
        reviewed_at TIMESTAMP,
        action_taken TEXT,

        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_abuse_short_code ON abuse_reports(short_code);
      CREATE INDEX IF NOT EXISTS idx_abuse_status ON abuse_reports(status);
    `,

    // 6. IP Bans
    `
      CREATE TABLE IF NOT EXISTS ip_bans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address VARCHAR(45) UNIQUE NOT NULL,

        -- Ban Details
        ban_reason VARCHAR(50),
        violation_count INTEGER DEFAULT 1,

        -- Duration
        banned_at TIMESTAMP DEFAULT NOW(),
        ban_expires_at TIMESTAMP,
        is_permanent BOOLEAN DEFAULT FALSE
      );

      CREATE INDEX IF NOT EXISTS idx_ip_bans_address ON ip_bans(ip_address);
      CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans(ban_expires_at);
    `,
  ];

  for (const tableSQL of tables) {
    await query(tableSQL);
  }

  logger.info('PostgreSQL tables created successfully');
}

/**
 * Migration from SQLite to PostgreSQL
 * Run this once to migrate existing data
 */
async function migrateFromSQLite() {
  const Database = require('better-sqlite3');
  const sqliteDb = new Database(process.env.DB_PATH || './data/urls.db');

  logger.info('Starting migration from SQLite to PostgreSQL...');

  try {
    // Migrate URLs
    const urls = sqliteDb.prepare('SELECT * FROM urls').all();
    logger.info(`Migrating ${urls.length} URLs...`);

    for (const url of urls) {
      await query(
        `INSERT INTO short_urls (short_code, long_url, difficulty, challenge_text, hints,
         time_limit_seconds, created_at, expires_at, total_views)
         VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), to_timestamp($8), $9)
         ON CONFLICT (short_code) DO NOTHING`,
        [
          url.shortCode,
          url.longUrl,
          url.difficulty || 'medium',
          url.challengeText,
          url.hints ? JSON.parse(url.hints) : null,
          url.timeLimitSeconds || 180,
          url.createdAt / 1000,
          url.expiresAt ? url.expiresAt / 1000 : null,
          0
        ]
      );
    }

    // Migrate analytics if exists
    try {
      const analytics = sqliteDb.prepare('SELECT * FROM url_analytics').all();
      logger.info(`Migrating ${analytics.length} analytics records...`);

      for (const record of analytics) {
        await query(
          `INSERT INTO url_analytics (short_code, session_start, session_end, outcome,
           attempts, hints_used, completion_time_seconds, score)
           VALUES ($1, to_timestamp($2), to_timestamp($3), $4, $5, $6, $7, $8)`,
          [
            record.shortCode,
            record.sessionStart / 1000,
            record.sessionEnd ? record.sessionEnd / 1000 : null,
            record.outcome,
            record.attempts,
            record.hintsUsed,
            record.completionTimeSeconds,
            record.score
          ]
        );
      }
    } catch (err) {
      logger.warn('Analytics table not found in SQLite, skipping...');
    }

    logger.info('Migration completed successfully!');
    sqliteDb.close();
  } catch (err) {
    logger.error('Migration failed:', err);
    sqliteDb.close();
    throw err;
  }
}

module.exports = {
  initializePostgres,
  getPool,
  query,
  getClient,
  close,
  createTables,
  migrateFromSQLite,
};

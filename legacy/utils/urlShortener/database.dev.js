// utils/urlShortener/database.dev.js
// In-memory database for development (no external dependencies needed)

const logger = require('../logger');

// In-memory stores
const urls = new Map();
const analytics = new Map();
const leaderboard = [];
const adPlacements = new Map();
const abuseReports = new Map();
const ipBans = new Map();

// Simple database wrapper that mimics better-sqlite3 API
class InMemoryDatabase {
  constructor() {
    logger.info('Using in-memory database (development mode)');
  }

  prepare(sql) {
    const command = sql.trim().split(' ')[0].toUpperCase();

    return {
      run: (...params) => {
        if (sql.includes('INSERT INTO urls')) {
          const data = this._parseInsertParams('urls', params);
          urls.set(data.shortCode, data);
          return { changes: 1, lastInsertRowid: urls.size };
        }
        else if (sql.includes('UPDATE urls')) {
          // Handle updates
          const shortCode = params[params.length - 1]; // Assuming last param is WHERE clause
          if (urls.has(shortCode)) {
            const existing = urls.get(shortCode);
            Object.assign(existing, this._parseUpdateParams(params));
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        else if (sql.includes('DELETE FROM urls')) {
          const shortCode = params[0];
          const deleted = urls.delete(shortCode);
          return { changes: deleted ? 1 : 0 };
        }
        else if (sql.includes('INSERT INTO url_analytics')) {
          const data = this._parseInsertParams('analytics', params);
          const id = analytics.size + 1;
          analytics.set(id, { id, ...data });
          return { changes: 1, lastInsertRowid: id };
        }
        else if (sql.includes('INSERT INTO leaderboard')) {
          const data = this._parseInsertParams('leaderboard', params);
          leaderboard.push({ id: leaderboard.length + 1, ...data });
          return { changes: 1 };
        }
        return { changes: 0 };
      },

      get: (...params) => {
        if (sql.includes('SELECT') && sql.includes('FROM urls')) {
          if (sql.includes('WHERE shortCode')) {
            const shortCode = params[0];
            return urls.get(shortCode) || null;
          }
          else if (sql.includes('WHERE uniqueId')) {
            const uniqueId = params[0];
            return Array.from(urls.values()).find(u => u.uniqueId === uniqueId) || null;
          }
        }
        else if (sql.includes('FROM url_analytics')) {
          const id = params[0];
          return analytics.get(id) || null;
        }
        else if (sql.includes('FROM ip_bans')) {
          const ip = params[0];
          return Array.from(ipBans.values()).find(b => b.ip === ip) || null;
        }
        return null;
      },

      all: (...params) => {
        if (sql.includes('FROM urls')) {
          let results = Array.from(urls.values());

          // Handle WHERE clauses
          if (sql.includes('WHERE uniqueId')) {
            const uniqueId = params[0];
            results = results.filter(u => u.uniqueId === uniqueId);
          }
          else if (sql.includes('WHERE difficulty')) {
            const difficulty = params[0];
            results = results.filter(u => u.difficulty === difficulty);
          }

          // Handle ORDER BY
          if (sql.includes('ORDER BY createdAt DESC')) {
            results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          }

          // Handle LIMIT
          const limitMatch = sql.match(/LIMIT (\d+)/);
          if (limitMatch) {
            results = results.slice(0, parseInt(limitMatch[1]));
          }

          return results;
        }
        else if (sql.includes('FROM url_analytics')) {
          let results = Array.from(analytics.values());

          if (sql.includes('WHERE shortCode')) {
            const shortCode = params[0];
            results = results.filter(a => a.shortCode === shortCode);
          }

          if (sql.includes('ORDER BY sessionStart DESC')) {
            results.sort((a, b) => (b.sessionStart || 0) - (a.sessionStart || 0));
          }

          const limitMatch = sql.match(/LIMIT (\d+)/);
          if (limitMatch) {
            results = results.slice(0, parseInt(limitMatch[1]));
          }

          return results;
        }
        else if (sql.includes('FROM leaderboard')) {
          let results = [...leaderboard];

          if (sql.includes('WHERE shortCode')) {
            const shortCode = params[0];
            results = results.filter(l => l.shortCode === shortCode);
          }

          if (sql.includes('ORDER BY completionTime')) {
            results.sort((a, b) => (a.completionTime || 0) - (b.completionTime || 0));
          }

          const limitMatch = sql.match(/LIMIT (\d+)/);
          if (limitMatch) {
            results = results.slice(0, parseInt(limitMatch[1]));
          }

          return results;
        }
        return [];
      },
    };
  }

  exec(sql) {
    // For CREATE TABLE statements, just log and ignore
    if (sql.includes('CREATE TABLE')) {
      logger.debug('In-memory DB: Ignoring CREATE TABLE statement');
      return this;
    }
    return this;
  }

  close() {
    logger.info('Closing in-memory database');
    urls.clear();
    analytics.clear();
    leaderboard.length = 0;
  }

  _parseInsertParams(table, params) {
    const timestamp = Math.floor(Date.now() / 1000);

    if (table === 'urls') {
      return {
        shortCode: params[0],
        longUrl: params[1],
        expiresAt: params[2] || null,
        uniqueId: params[3] || null,
        difficulty: params[4] || 'medium',
        challengeText: params[5] || null,
        hints: params[6] || null,
        correctAnswers: params[7] || null,
        timeLimitSeconds: params[8] || 120,
        createdAt: timestamp,
        totalViews: 0,
        totalCompletions: 0,
        totalFailures: 0,
        totalTimeouts: 0,
        avgCompletionTime: 0,
      };
    }
    else if (table === 'analytics') {
      return {
        shortCode: params[0],
        visitorIp: params[1] || null,
        sessionStart: timestamp,
        outcome: params[2] || null,
        attempts: params[3] || 0,
        hintsUsed: params[4] || 0,
        completionTime: params[5] || null,
        score: params[6] || 0,
      };
    }
    else if (table === 'leaderboard') {
      return {
        shortCode: params[0],
        playerNickname: params[1] || 'Anonymous',
        playerCountry: params[2] || null,
        completionTime: params[3],
        hintsUsed: params[4] || 0,
        score: params[5],
        completedAt: timestamp,
      };
    }
    return {};
  }

  _parseUpdateParams(params) {
    // Simple update - just return an object with the params
    return {
      totalViews: params[0],
      totalCompletions: params[1],
      totalFailures: params[2],
      totalTimeouts: params[3],
      avgCompletionTime: params[4],
    };
  }
}

// Export singleton instance
const db = new InMemoryDatabase();

function getDb() {
  return db;
}

module.exports = {
  getDb,
  default: db,
};

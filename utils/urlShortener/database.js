// urils/Ur;Shortener/database.js
const Database = require('better-sqlite3');
const path = require('path');
const { DB_PATH } = require('./config');

const db = new Database(DB_PATH, { verbose: console.log });

// Create tables and triggers
db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortCode TEXT UNIQUE,
    longUrl TEXT,
    expiresAt INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    uniqueId TEXT
  );

  CREATE TRIGGER IF NOT EXISTS urls_trigger_createdAt
  AFTER INSERT ON urls
  FOR EACH ROW
  BEGIN
    UPDATE urls SET createdAt = strftime('%s', 'now') WHERE id = NEW.id;
  END;
`);

function getDb() {
  return db;
}

module.exports = {
  getDb,
};
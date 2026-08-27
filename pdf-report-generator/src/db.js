// One SQLite connection (built into Node 22 via node:sqlite — no install).
// Run with:  node --experimental-sqlite ...  (see package.json / README).
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = process.env.REPORT_DB || path.join(__dirname, "..", "report.db");
const db = new DatabaseSync(DB_PATH);

// Data table + the report bookkeeping table (Stage 4).
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    customer   TEXT    NOT NULL,
    product    TEXT    NOT NULL,
    amount     REAL    NOT NULL,
    created_at TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  );
`);

module.exports = { db, DB_PATH };

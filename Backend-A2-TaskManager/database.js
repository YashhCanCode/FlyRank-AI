// database.js — SQLite setup for the Task Manager API
// Uses better-sqlite3. The database file (tasks.db) and the tasks table are
// created automatically the first time the application runs.

const Database = require("better-sqlite3");
const path = require("path");

// Store the database file next to this source file so it's found no matter
// which directory the server is started from.
const DB_PATH = path.join(__dirname, "tasks.db");
const db = new Database(DB_PATH);

// Recommended pragma for a small local app: better durability + concurrency.
db.pragma("journal_mode = WAL");

// 1. Create the table if it doesn't already exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

// 2. Seed three example tasks — but ONLY if the table is currently empty.
//    This is why restarting the server does not keep re-adding them.
const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  const seed = db.transaction(() => {
    insert.run("Buy milk", 0);
    insert.run("Read a chapter of a book", 0);
    insert.run("Go for a walk", 1);
  });
  seed();
  console.log("Seeded database with 3 example tasks.");
}

module.exports = db;

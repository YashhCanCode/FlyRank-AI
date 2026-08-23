// Postgres connection pool. The connection string comes entirely from the
// DATABASE_URL environment variable (loaded from .env in development, or
// injected by docker-compose in the container). No secrets live in code.
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure the schema exists and seed three example tasks on first run.
// The canonical schema also lives in db/init.sql (run by Postgres on first
// container start); doing it here too makes the app robust if it is ever
// pointed at a fresh database without that init script.
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id    SERIAL PRIMARY KEY,
      title TEXT    NOT NULL,
      done  BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM tasks");
  if (rows[0].count === 0) {
    await pool.query(
      `INSERT INTO tasks (title, done) VALUES
         ('Buy milk', false),
         ('Read a chapter of a book', false),
         ('Go for a walk', true)`
    );
    console.log("Seeded database with 3 example tasks.");
  }
}

module.exports = { pool, initSchema };

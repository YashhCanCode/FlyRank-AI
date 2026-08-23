// Postgres implementation of the SAME Task repository interface.
// This is the "one file" that changes when we swap storage from memory to a
// real database. It takes a pg Pool so it is easy to test in isolation.
//
// Note how every method has the same name, arguments and return shape as the
// in-memory repository — that is what lets the routes stay untouched.

function toTask(row) {
  // Postgres has a real BOOLEAN type, so `done` already comes back as a JS
  // boolean. We still normalise the shape to { id, title, done }.
  return { id: row.id, title: row.title, done: Boolean(row.done) };
}

module.exports = function createPostgresTaskRepository(pool) {
  return {
    async findAll() {
      const { rows } = await pool.query(
        "SELECT id, title, done FROM tasks ORDER BY id"
      );
      return rows.map(toTask);
    },

    async findById(id) {
      const { rows } = await pool.query(
        "SELECT id, title, done FROM tasks WHERE id = $1",
        [id]
      );
      return rows.length ? toTask(rows[0]) : null;
    },

    async create({ title, done }) {
      const { rows } = await pool.query(
        "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING id, title, done",
        [title, Boolean(done)]
      );
      return toTask(rows[0]);
    },

    async update(id, { title, done }) {
      // COALESCE keeps the existing value when a field is not provided.
      const { rows } = await pool.query(
        `UPDATE tasks
            SET title = COALESCE($2, title),
                done  = COALESCE($3, done)
          WHERE id = $1
        RETURNING id, title, done`,
        [id, title === undefined ? null : title, done === undefined ? null : Boolean(done)]
      );
      return rows.length ? toTask(rows[0]) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query(
        "DELETE FROM tasks WHERE id = $1",
        [id]
      );
      return rowCount > 0;
    },
  };
};

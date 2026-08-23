// Repository selector. The rest of the app asks for "the repository" and does
// not care which implementation it gets. Swapping storage is a one-line env
// change (REPO=memory | postgres) — the routes and service never change.
module.exports = function getRepository() {
  if (process.env.REPO === "memory") {
    return require("./inMemoryTaskRepository")();
  }
  const { pool } = require("../db");
  return require("./postgresTaskRepository")(pool);
};

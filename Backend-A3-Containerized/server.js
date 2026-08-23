// Application entry point. Loads config, wires the chosen repository into the
// routes, and starts the HTTP server. Notice there is no SQL in here — that
// lives entirely in the repository layer.
require("dotenv").config();

const express = require("express");
const getRepository = require("./src/repositories");
const createTaskRoutes = require("./src/routes");

const PORT = process.env.PORT || 3000;

async function main() {
  // When using Postgres, make sure the table exists and is seeded.
  if (process.env.REPO !== "memory") {
    const { initSchema } = require("./src/db");
    await initSchema();
  }

  const repo = getRepository();

  const app = express();
  app.use(express.json());

  // Friendly landing route.
  app.get("/", (req, res) => {
    res.json({
      message: "Task Manager API (A3). Data is served under /tasks.",
      storage: process.env.REPO === "memory" ? "in-memory" : "postgres",
      endpoints: [
        "GET    /tasks",
        "GET    /tasks/:id",
        "POST   /tasks",
        "PUT    /tasks/:id",
        "DELETE /tasks/:id",
      ],
    });
  });

  app.use("/", createTaskRoutes(repo));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

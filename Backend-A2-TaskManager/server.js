// server.js — CRUD API for tasks, backed by SQLite.
// The API is identical to Assignment 1; only the storage layer changed:
// an in-memory array was replaced with SQL queries against tasks.db.

const express = require("express");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

// SQLite has no real boolean type — it stores done as 0/1. This helper
// reshapes a database row into the same JSON shape the API returned before.
function toTask(row) {
  return { id: row.id, title: row.title, done: Boolean(row.done) };
}

// Prepared statements (compiled once, reused on every request).
const selectAll = db.prepare("SELECT * FROM tasks ORDER BY id");
const selectOne = db.prepare("SELECT * FROM tasks WHERE id = ?");
const insertOne = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
const updateOne = db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?");
const deleteOne = db.prepare("DELETE FROM tasks WHERE id = ?");

// GET / — friendly landing page listing the available endpoints.
app.get("/", (req, res) => {
  res.json({
    message: "Task Manager API. Data is served under /tasks.",
    endpoints: [
      "GET    /tasks",
      "GET    /tasks/:id",
      "POST   /tasks",
      "PUT    /tasks/:id",
      "DELETE /tasks/:id"
    ]
  });
});

// GET /tasks — return every task.
app.get("/tasks", (req, res) => {
  const rows = selectAll.all();
  res.json(rows.map(toTask));
});

// GET /tasks/:id — return one task, or 404.
app.get("/tasks/:id", (req, res) => {
  const row = selectOne.get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "Task not found" });
  res.json(toTask(row));
});

// POST /tasks — create a task. Title is required.
app.post("/tasks", (req, res) => {
  const { title, done } = req.body || {};
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  const info = insertOne.run(title.trim(), done ? 1 : 0);
  const created = selectOne.get(info.lastInsertRowid);
  res.status(201).json(toTask(created));
});

// PUT /tasks/:id — update a task, or 404.
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = selectOne.get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const { title, done } = req.body || {};
  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;
  updateOne.run(newTitle, newDone, id);
  res.json(toTask(selectOne.get(id)));
});

// DELETE /tasks/:id — remove a task, or 404.
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = selectOne.get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });
  deleteOne.run(id);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

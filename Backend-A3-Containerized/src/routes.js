// HTTP routes. These are IDENTICAL regardless of the storage backend — they
// only ever talk to the repository interface (findAll / findById / create /
// update / remove). This file did not change when we swapped memory -> Postgres.
const express = require("express");

module.exports = function createTaskRoutes(repo) {
  const router = express.Router();

  // GET /tasks — list all tasks.
  router.get("/tasks", async (req, res, next) => {
    try {
      res.json(await repo.findAll());
    } catch (e) { next(e); }
  });

  // GET /tasks/:id — one task or 404.
  router.get("/tasks/:id", async (req, res, next) => {
    try {
      const task = await repo.findById(Number(req.params.id));
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (e) { next(e); }
  });

  // POST /tasks — create. Title required.
  router.post("/tasks", async (req, res, next) => {
    try {
      const { title, done } = req.body || {};
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
      }
      const task = await repo.create({ title: title.trim(), done: Boolean(done) });
      res.status(201).json(task);
    } catch (e) { next(e); }
  });

  // PUT /tasks/:id — update, or 404.
  router.put("/tasks/:id", async (req, res, next) => {
    try {
      const { title, done } = req.body || {};
      if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
        return res.status(400).json({ error: "Title is required" });
      }
      const task = await repo.update(Number(req.params.id), {
        title: title === undefined ? undefined : title.trim(),
        done,
      });
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (e) { next(e); }
  });

  // DELETE /tasks/:id — delete, or 404.
  router.delete("/tasks/:id", async (req, res, next) => {
    try {
      const ok = await repo.remove(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Task not found" });
      res.status(204).end();
    } catch (e) { next(e); }
  });

  return router;
};

const express = require("express");
const { serve } = require("inngest/express");
const store = require("./store");

// createApp({ inngest, functions }) — inngest is injected so tests can pass a fake.
function createApp({ inngest, functions = [] }) {
  const app = express();
  app.use(express.json());

  // Serve the Inngest functions (skipped in tests when functions is empty).
  if (functions.length) app.use("/api/inngest", serve({ client: inngest, functions }));

  // Stage 0
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Stage 2/3 — the fast door.
  app.post("/reports", async (req, res) => {
    const topic = req.body?.topic;
    // Stage 3: bad input is rejected at the door — no job is created.
    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return res.status(400).json({ error: "topic is required" });
    }
    const report = store.createReport(topic.trim());
    await inngest.send({ name: "report/requested", data: { id: report.id, topic: report.topic } });
    // 202 Accepted — order taken, work starts soon. No slow work here.
    return res.status(202).json({ id: report.id, status: "pending" });
  });

  // Stage 2 — status endpoint (polling): pending -> done.
  app.get("/reports/:id", (req, res) => {
    const r = store.getReport(req.params.id);
    if (!r) return res.status(404).json({ error: "report not found" });
    res.json(r);
  });

  // Extra: control panel.
  app.get("/reports", (req, res) => res.json(store.allReports()));

  app.get("/", (req, res) => res.json({
    message: "Background job API.",
    endpoints: ["GET /health", "POST /reports {topic}", "GET /reports/:id", "GET /reports", "…/api/inngest"],
  }));

  return app;
}

module.exports = { createApp };

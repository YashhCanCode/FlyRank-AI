// The API in front of the pipeline (Stages 4 & 5).
const express = require("express");
const fs = require("fs");
const path = require("path");
const { db } = require("./db");
const { getReportData } = require("./report");
const { buildReportHtml } = require("./html");
const { renderPdf } = require("./render");

const app = express();
app.use(express.json());

const REPORTS_DIR = path.join(__dirname, "..", "reports");
fs.mkdirSync(REPORTS_DIR, { recursive: true });
const fileLink = (id) => `/reports/${id}/file`;

// Friendly root: list the endpoints so the base URL isn't a dead end.
app.get("/", (req, res) => {
  res.json({
    message: "PDF Report Generator API.",
    endpoints: [
      "GET  /health",
      "POST /reports            (generate, or reuse today's)",
      "GET  /reports/:id        (the record + file link)",
      "GET  /reports/:id/file   (download the PDF)",
    ],
    tip: "Generate with: curl -X POST http://localhost:3000/reports",
  });
});

// Stage 0
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Stage 4 + 5: generate (or reuse today's) report.
app.post("/reports", async (req, res, next) => {
  try {
    const force = req.body?.force === true;

    // Stage 5 — idempotency: one report per day unless force.
    if (!force) {
      const existing = db.prepare(
        "SELECT id FROM reports WHERE date(created_at) = date('now') ORDER BY id DESC LIMIT 1"
      ).get();
      if (existing) {
        return res.status(200).json({ id: existing.id, file: fileLink(existing.id), reused: true });
      }
    }

    // Reserve an id first so the filename can use it.
    const info = db.prepare("INSERT INTO reports (path, created_at) VALUES (?, datetime('now'))").run("", );
    const id = Number(info.lastInsertRowid);
    const outPath = path.join(REPORTS_DIR, `${id}.pdf`);

    // The whole pipeline, right here in the request (a few seconds — allowed in Stage 4).
    await renderPdf(buildReportHtml(getReportData()), outPath);
    db.prepare("UPDATE reports SET path = ? WHERE id = ?").run(outPath, id);

    return res.status(201).json({ id, file: fileLink(id) });
  } catch (e) { next(e); }
});

// Stage 4: the record (JSON only — never the bytes).
app.get("/reports/:id", (req, res) => {
  const row = db.prepare("SELECT id, path, created_at FROM reports WHERE id = ?").get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "Report not found" });
  res.json({ id: row.id, created_at: row.created_at, file: fileLink(row.id) });
});

// Stage 4: the only endpoint that moves megabytes — serves the PDF from disk.
app.get("/reports/:id/file", (req, res) => {
  const row = db.prepare("SELECT path FROM reports WHERE id = ?").get(Number(req.params.id));
  if (!row || !row.path || !fs.existsSync(row.path)) return res.status(404).json({ error: "File not found" });
  res.sendFile(row.path);
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "report generation failed" }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Report API on http://localhost:${PORT}`));

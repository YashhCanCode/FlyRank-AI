// POST /triage — the one endpoint. Input validated before any spend; kill switch and
// stub mode checked before the model; model output never returned raw.
const express = require("express");
const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const { STUB_RESULT } = require("../llm/schema");
const { classify } = require("../llm/callModel");
const realChat = require("../llm/client").chat;

const InputSchema = z.object({ text: z.string().min(1).max(2000) }).strict();
const PROMPT_PATH = path.join(__dirname, "..", "..", "prompts", "triage-v1.md");

// `deps.chat` can be injected for tests; defaults to the real provider client.
module.exports = function createTriageRoute(deps = {}) {
  const chat = deps.chat || realChat;
  const promptText = fs.readFileSync(PROMPT_PATH, "utf8");
  const promptVersion = process.env.PROMPT_VERSION || "triage-v1";
  const router = express.Router();

  router.post("/triage", async (req, res) => {
    // 1. Validate input FIRST — a rejected request is a model call you didn't pay for.
    const parsed = InputSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "body";
      return res.status(400).json({ error: `invalid input at '${field}': ${issue.message}` });
    }
    const { text } = parsed.data;

    // 2. Kill switch — turn the feature off without a deploy.
    if (process.env.LLM_ENABLED === "false") {
      return res.status(503).json({ error: "LLM feature temporarily disabled" });
    }

    // 3. Stub mode — build/debug without spending a call.
    if (process.env.LLM_STUB === "1") {
      return res.status(200).json(STUB_RESULT);
    }

    // 4. Real call, with all the trust logic behind classify().
    try {
      const data = await classify(text, {
        chat, promptText, promptVersion,
        model: process.env.LLM_MODEL,
        maxRetries: Number(process.env.LLM_MAX_RETRIES ?? 2),
      });
      return res.status(200).json(data);
    } catch (err) {
      if (err.type === "repair_failed") {
        return res.status(422).json({ error: "model output failed schema validation after one repair" });
      }
      const kind = err._class?.kind;
      if (kind === "timeout") return res.status(504).json({ error: "model timed out" });
      if (kind === "fatal") return res.status(502).json({ error: `provider rejected the request (${err._class.status})` });
      return res.status(502).json({ error: "model call failed" });
    }
  });

  return router;
};

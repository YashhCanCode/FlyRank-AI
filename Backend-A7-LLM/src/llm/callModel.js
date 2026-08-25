// The trust core: call the model, validate its answer, repair once, or fail cleanly.
// `chat` is injected so this whole file is testable without a network or a key.
const fs = require("fs");
const path = require("path");
const { parseAndValidate } = require("./parse");

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const COST_LOG = path.join(LOG_DIR, "cost.jsonl");
const QUARANTINE_LOG = path.join(LOG_DIR, "quarantine.jsonl");
fs.mkdirSync(LOG_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logLine = (file, obj) => fs.appendFileSync(file, JSON.stringify(obj) + "\n");

// Keep untrusted user content in the user role, JSON-encoded so it can't break out
// of its quotes — a cheap first defence against prompt injection.
function buildMessages(promptText, inputText) {
  return [
    { role: "system", content: promptText },
    { role: "user", content: JSON.stringify({ text: inputText }) },
  ];
}

// Decide whether an error is worth retrying. Retry timeouts / 429 / 5xx; never 4xx auth.
function classifyError(err) {
  const status = err?.status ?? err?.response?.status;
  const name = String(err?.name || "").toLowerCase();
  const code = String(err?.code || "");
  if (name.includes("timeout") || code === "ETIMEDOUT" || status === 408) return { kind: "timeout", retryable: true };
  if (status === 429) return { kind: "rate_limit", retryable: true, retryAfter: retryAfterMs(err) };
  if (status && status >= 500) return { kind: "provider", retryable: true };
  if (status === 400 || status === 401 || status === 403) return { kind: "fatal", retryable: false, status };
  return { kind: "unknown", retryable: false, status };
}
function retryAfterMs(err) {
  const h = err?.headers?.["retry-after"] ?? err?.response?.headers?.["retry-after"];
  const s = Number(h);
  return Number.isFinite(s) ? s * 1000 : null;
}

// Call `chat` with exponential backoff + jitter, obeying Retry-After on 429.
async function callWithRetry(chat, messages, maxRetries) {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await chat(messages);
    } catch (err) {
      const c = classifyError(err);
      if (!c.retryable || attempt > maxRetries) {
        err._class = c;
        throw err;
      }
      const backoff = c.retryAfter ?? Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 250);
      await sleep(backoff);
    }
  }
}

// Orchestrate one classification. Returns validated data, or throws a tagged error.
async function classify(inputText, { chat, promptText, promptVersion, model, maxRetries }) {
  const messages = buildMessages(promptText, inputText);
  const started = Date.now();

  const first = await callWithRetry(chat, messages, maxRetries);
  let usage = first.usage || {};
  let check = parseAndValidate(first.content);
  let repaired = 0;

  if (!check.ok) {
    // Repair once: hand the model its own output and the exact validation error.
    repaired = 1;
    const repairMessages = [
      ...messages,
      { role: "assistant", content: first.content },
      { role: "user", content: `Your previous answer was rejected for this reason: ${check.error}. Return ONLY corrected JSON matching the schema — no prose, no code fence.` },
    ];
    const second = await callWithRetry(chat, repairMessages, maxRetries);
    usage = second.usage || usage;
    check = parseAndValidate(second.content);
    if (!check.ok) {
      logLine(QUARANTINE_LOG, {
        ts: new Date().toISOString(), prompt_version: promptVersion,
        input: inputText, error: check.error, raw_output: second.content,
      });
      const e = new Error(`validation failed after repair: ${check.error}`);
      e.type = "repair_failed";
      throw e;
    }
  }

  // One structured cost line per call.
  logLine(COST_LOG, {
    ts: new Date().toISOString(),
    prompt_version: promptVersion,
    model: model || first.model,
    input_tokens: usage.prompt_tokens ?? null,
    output_tokens: usage.completion_tokens ?? null,
    duration_ms: Date.now() - started,
    repair_count: repaired,
  });

  return check.data;
}

module.exports = { classify, buildMessages, classifyError, callWithRetry };

// Trust-logic tests with an injected fake model — no network or API key needed.
// Run: npm test   (node --test)
const test = require("node:test");
const assert = require("node:assert");
const express = require("express");

const { parseAndValidate } = require("../src/llm/parse");
const { classify } = require("../src/llm/callModel");
const createTriageRoute = require("../src/routes/triage");

const GOOD = JSON.stringify({ category: "billing", urgency: "high", suggested_team: "billing", confidence: 0.9, reason: "Duplicate charge." });
const baseOpts = { promptText: "system prompt", promptVersion: "triage-v1", model: "test-model", maxRetries: 1 };

test("parse: strips code fence and validates", () => {
  assert.strictEqual(parseAndValidate("```json\n" + GOOD + "\n```").ok, true);
});
test("parse: rejects category outside enum", () => {
  assert.strictEqual(parseAndValidate(JSON.stringify({ category: "refunds", urgency: "high", suggested_team: "billing", confidence: 0.9, reason: "x" })).ok, false);
});
test("parse: rejects invented extra field (strict)", () => {
  assert.strictEqual(parseAndValidate(JSON.stringify({ category: "bug", urgency: "low", suggested_team: "engineering", confidence: 0.5, reason: "x", extra: 1 })).ok, false);
});
test("classify: happy path returns validated data", async () => {
  const data = await classify("charged twice", { ...baseOpts, chat: async () => ({ content: GOOD, usage: {} }) });
  assert.strictEqual(data.category, "billing");
});
test("classify: bad output then repair succeeds", async () => {
  let n = 0;
  const data = await classify("x", { ...baseOpts, chat: async () => (++n === 1 ? { content: "not json", usage: {} } : { content: GOOD, usage: {} }) });
  assert.strictEqual(data.category, "billing"); assert.strictEqual(n, 2);
});
test("classify: bad twice -> repair_failed", async () => {
  await assert.rejects(() => classify("x", { ...baseOpts, chat: async () => ({ content: "still not json", usage: {} }) }), (e) => e.type === "repair_failed");
});
test("classify: retries on 429 then succeeds", async () => {
  let n = 0;
  const data = await classify("x", { ...baseOpts, maxRetries: 2, chat: async () => { if (++n === 1) { const e = new Error("rate"); e.status = 429; throw e; } return { content: GOOD, usage: {} }; } });
  assert.strictEqual(data.category, "billing"); assert.strictEqual(n, 2);
});
test("classify: does NOT retry on 401", async () => {
  let n = 0;
  await assert.rejects(() => classify("x", { ...baseOpts, maxRetries: 2, chat: async () => { n++; const e = new Error("bad key"); e.status = 401; throw e; } }), (e) => e._class && e._class.kind === "fatal");
  assert.strictEqual(n, 1);
});
test("classify: timeout retryable then gives up", async () => {
  let n = 0;
  await assert.rejects(() => classify("x", { ...baseOpts, maxRetries: 1, chat: async () => { n++; const e = new Error("timeout"); e.name = "APITimeoutError"; throw e; } }), (e) => e._class && e._class.kind === "timeout");
  assert.strictEqual(n, 2);
});

function appWith(chat) { const a = express(); a.use(express.json()); a.use("/", createTriageRoute(chat ? { chat } : {})); return a; }
const listen = (app) => new Promise((r) => { const s = app.listen(0, () => r(s)); });
async function post(port, body) { const r = await fetch(`http://localhost:${port}/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; }

test("HTTP: stub mode -> 200 schema-valid, no model call", async () => {
  process.env.LLM_STUB = "1"; delete process.env.LLM_ENABLED;
  const s = await listen(appWith(async () => { throw new Error("must not call"); }));
  const { status, body } = await post(s.address().port, { text: "hi" }); s.close();
  assert.strictEqual(status, 200); assert.ok(["billing","bug","feature","account","other"].includes(body.category));
  process.env.LLM_STUB = "0";
});
test("HTTP: missing text -> 400 naming field", async () => {
  process.env.LLM_STUB = "0";
  const s = await listen(appWith(async () => ({ content: GOOD, usage: {} })));
  const { status, body } = await post(s.address().port, {}); s.close();
  assert.strictEqual(status, 400); assert.match(body.error, /text/);
});
test("HTTP: kill switch -> 503", async () => {
  process.env.LLM_ENABLED = "false";
  const s = await listen(appWith(async () => { throw new Error("must not call"); }));
  const { status } = await post(s.address().port, { text: "hi" }); s.close();
  assert.strictEqual(status, 503); delete process.env.LLM_ENABLED;
});
test("HTTP: happy real-path (injected) -> 200", async () => {
  process.env.LLM_STUB = "0"; delete process.env.LLM_ENABLED;
  const s = await listen(appWith(async () => ({ content: GOOD, usage: { prompt_tokens: 3, completion_tokens: 2 } })));
  const { status, body } = await post(s.address().port, { text: "charged twice" }); s.close();
  assert.strictEqual(status, 200); assert.strictEqual(body.category, "billing");
});
test("HTTP: model garbage twice -> 422", async () => {
  process.env.LLM_MAX_RETRIES = "0";
  const s = await listen(appWith(async () => ({ content: "not json", usage: {} })));
  const { status } = await post(s.address().port, { text: "x" }); s.close();
  assert.strictEqual(status, 422);
});

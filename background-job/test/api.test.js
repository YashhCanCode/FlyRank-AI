const test = require("node:test");
const assert = require("node:assert");
const { createApp } = require("../src/app");
const store = require("../src/store");
const { buildReport } = require("../src/report");

// Fake Inngest: records sent events, never touches the network. We simulate the
// worker by applying the result to the store ourselves.
function fakeInngest() {
  const sent = [];
  return { sent, send: async (e) => { sent.push(e); } };
}
const listen = (app) => new Promise((r) => { const s = app.listen(0, () => r(s)); });
async function req(port, method, path, body) {
  const res = await fetch(`http://localhost:${port}${path}`, {
    method, headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test("GET /health -> 200 ok", async () => {
  const s = await listen(createApp({ inngest: fakeInngest() }));
  const { status, body } = await req(s.address().port, "GET", "/health"); s.close();
  assert.strictEqual(status, 200); assert.strictEqual(body.status, "ok");
});

test("POST /reports -> 202 pending + event sent", async () => {
  const ing = fakeInngest();
  const s = await listen(createApp({ inngest: ing }));
  const { status, body } = await req(s.address().port, "POST", "/reports", { topic: "cats" }); s.close();
  assert.strictEqual(status, 202);
  assert.strictEqual(body.status, "pending");
  assert.ok(body.id);
  assert.strictEqual(ing.sent.length, 1);
  assert.strictEqual(ing.sent[0].name, "report/requested");
  assert.strictEqual(ing.sent[0].data.topic, "cats");
});

test("POST /reports without topic -> 400 and NO event", async () => {
  const ing = fakeInngest();
  const s = await listen(createApp({ inngest: ing }));
  const { status } = await req(s.address().port, "POST", "/reports", {}); s.close();
  assert.strictEqual(status, 400);
  assert.strictEqual(ing.sent.length, 0); // wrong input rejected at the door
});

test("GET /reports/:id -> pending, then done after worker saves", async () => {
  const ing = fakeInngest();
  const s = await listen(createApp({ inngest: ing }));
  const port = s.address().port;
  const created = await req(port, "POST", "/reports", { topic: "dogs" });
  const id = created.body.id;

  const p1 = await req(port, "GET", `/reports/${id}`);
  assert.strictEqual(p1.body.status, "pending");

  // simulate the worker finishing
  store.saveResult(id, buildReport("dogs"));
  const p2 = await req(port, "GET", `/reports/${id}`);
  s.close();
  assert.strictEqual(p2.body.status, "done");
  assert.ok(p2.body.result.title.includes("dogs"));
});

test("GET /reports/:id unknown -> 404", async () => {
  const s = await listen(createApp({ inngest: fakeInngest() }));
  const { status } = await req(s.address().port, "GET", "/reports/nope"); s.close();
  assert.strictEqual(status, 404);
});

test("buildReport throws on topic 'fail' (drives Inngest retries)", () => {
  assert.throws(() => buildReport("fail"), /oven is broken/);
  assert.ok(buildReport("cats").title.includes("cats"));
});

test("counts reflect store status", () => {
  const c = store.counts();
  assert.ok(typeof c.pending === "number" && typeof c.done === "number");
});

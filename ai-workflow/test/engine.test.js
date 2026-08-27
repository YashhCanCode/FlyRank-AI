const test = require("node:test");
const assert = require("node:assert");
const { executeWorkflow, findStartNode, nextNodeId } = require("../src/lib/engine");
const { parseYesNo } = require("../src/lib/parse");
const { mockDecision } = require("../src/lib/decide");

const graph = {
  nodes: [
    { id: "d1", data: { kind: "decision", label: "Support?", isStart: true } },
    { id: "o1", data: { kind: "outcome", label: "Support" } },
    { id: "o2", data: { kind: "outcome", label: "Sales" } },
  ],
  edges: [
    { source: "d1", target: "o1", sourceHandle: "yes" },
    { source: "d1", target: "o2", sourceHandle: "no" },
  ],
};

test("parseYesNo extracts clean decisions, defaults to NO", () => {
  assert.strictEqual(parseYesNo("YES"), "YES");
  assert.strictEqual(parseYesNo("no."), "NO");
  assert.strictEqual(parseYesNo("Yes, definitely"), "YES");
  assert.strictEqual(parseYesNo("maybe"), "NO");
});

test("findStartNode honors isStart, else no-incoming", () => {
  assert.strictEqual(findStartNode(graph.nodes, graph.edges).id, "d1");
});

test("nextNodeId follows the YES/NO handle", () => {
  assert.strictEqual(nextNodeId(graph.edges, "d1", "YES"), "o1");
  assert.strictEqual(nextNodeId(graph.edges, "d1", "NO"), "o2");
});

test("executeWorkflow: YES routes to Support", async () => {
  const r = await executeWorkflow({ ...graph, input: "x", decideNode: async () => "YES" });
  assert.deepStrictEqual(r.order, ["d1", "o1"]);
  assert.strictEqual(r.outcome, "Support");
});

test("executeWorkflow: NO routes to Sales", async () => {
  const r = await executeWorkflow({ ...graph, input: "x", decideNode: async () => "NO" });
  assert.deepStrictEqual(r.order, ["d1", "o2"]);
  assert.strictEqual(r.outcome, "Sales");
});

test("executeWorkflow: multi-hop chain traverses in order", async () => {
  const g = {
    nodes: [
      { id: "a", data: { kind: "decision", isStart: true } },
      { id: "b", data: { kind: "decision" } },
      { id: "end", data: { kind: "outcome", label: "Done" } },
    ],
    edges: [
      { source: "a", target: "b", sourceHandle: "yes" },
      { source: "b", target: "end", sourceHandle: "yes" },
    ],
  };
  const r = await executeWorkflow({ ...g, input: "x", decideNode: async () => "YES" });
  assert.deepStrictEqual(r.order, ["a", "b", "end"]);
  assert.strictEqual(r.outcome, "Done");
});

test("executeWorkflow: dead end (no matching edge) stops cleanly", async () => {
  const events = [];
  const r = await executeWorkflow({ ...graph, input: "x", decideNode: async () => "YES",
    edges: [{ source: "d1", target: "o2", sourceHandle: "no" }], onEvent: (e) => events.push(e.type) });
  assert.deepStrictEqual(r.order, ["d1"]);
  assert.ok(events.includes("dead-end"));
});

test("executeWorkflow: onEvent emits enter/decision/edge/outcome", async () => {
  const types = [];
  await executeWorkflow({ ...graph, input: "x", decideNode: async () => "YES", onEvent: (e) => types.push(e.type) });
  assert.ok(["enter", "decision", "edge", "outcome", "complete"].every((t) => types.includes(t)));
});

test("mockDecision is deterministic and binary", () => {
  const a = mockDecision({ id: "d1" }, "hello");
  const b = mockDecision({ id: "d1" }, "hello");
  assert.strictEqual(a, b);
  assert.ok(a === "YES" || a === "NO");
});

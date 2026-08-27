// Shared in-memory store for live execution state. The Inngest function and the
// /api/run status route run in the same Next.js process (dev), so a module
// singleton is visible to both. globalThis keeps it alive across HMR reloads.
const store = globalThis.__runStore || (globalThis.__runStore = new Map());

function createRun(runId, graph, input) {
  store.set(runId, {
    runId, status: "running", input,
    nodeCount: graph.nodes.length,
    order: [], logs: [], activeEdge: null, currentNodeId: null,
    outcome: null, error: null,
    startedAt: Date.now(), finishedAt: null,
  });
}
function log(runId, message) {
  const r = store.get(runId); if (!r) return;
  r.logs.push({ t: Date.now(), message });
}
function applyEvent(runId, evt) {
  const r = store.get(runId); if (!r) return;
  if (evt.type === "enter") { r.currentNodeId = evt.nodeId; r.order.push(evt.nodeId); log(runId, `→ enter ${evt.label || evt.nodeId}`); }
  else if (evt.type === "decision") log(runId, `   decided ${evt.decision} at ${evt.nodeId}`);
  else if (evt.type === "edge") { r.activeEdge = { from: evt.from, to: evt.to, decision: evt.decision }; }
  else if (evt.type === "outcome") { r.outcome = evt.label; log(runId, `★ outcome: ${evt.label}`); }
  else if (evt.type === "dead-end") log(runId, `   dead end (no ${evt.decision} edge)`);
  else if (evt.type === "error") log(runId, `! ${evt.message}`);
}
function finish(runId, patch) {
  const r = store.get(runId); if (!r) return;
  Object.assign(r, patch, { finishedAt: Date.now() });
}
function getRun(runId) { return store.get(runId) || null; }

module.exports = { createRun, applyEvent, finish, getRun, log };

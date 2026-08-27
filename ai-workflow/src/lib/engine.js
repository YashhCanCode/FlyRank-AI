// Pure workflow engine — no Inngest, no network, so it's easy to unit-test.
// It walks the graph: at each DECISION node it asks `decideNode` for YES/NO,
// then follows the matching edge. OUTCOME nodes are terminal.
//
//   nodes: [{ id, data: { kind: "decision"|"outcome", label, prompt } }]
//   edges: [{ source, target, sourceHandle: "yes"|"no" }]
//   decideNode(node, input) -> "YES" | "NO"   (injected; may be async)
//   onEvent(evt) -> side-effect hook for live progress (optional)

function findStartNode(nodes, edges) {
  const flagged = nodes.find((n) => n.data?.isStart);
  if (flagged) return flagged;
  const hasIncoming = new Set(edges.map((e) => e.target));
  return nodes.find((n) => !hasIncoming.has(n.id)) || nodes[0];
}

function nextNodeId(edges, nodeId, decision) {
  const handle = decision.toLowerCase(); // "yes" | "no"
  const edge = edges.find((e) => e.source === nodeId && (e.sourceHandle || "").toLowerCase() === handle);
  return edge ? edge.target : null;
}

async function executeWorkflow({ nodes, edges, input, decideNode, onEvent = () => {}, maxSteps = 25 }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const order = [];
  let current = findStartNode(nodes, edges);
  if (!current) throw new Error("workflow has no nodes");

  let steps = 0;
  let outcome = null;

  while (current && steps < maxSteps) {
    steps++;
    order.push(current.id);
    onEvent({ type: "enter", nodeId: current.id, label: current.data?.label });

    if (current.data?.kind === "outcome") {
      outcome = current.data?.label || current.id;
      onEvent({ type: "outcome", nodeId: current.id, label: outcome });
      break;
    }

    // decision node
    const decision = String(await decideNode(current, input)).toUpperCase();
    onEvent({ type: "decision", nodeId: current.id, decision });

    const nextId = nextNodeId(edges, current.id, decision);
    if (!nextId) {
      onEvent({ type: "dead-end", nodeId: current.id, decision });
      break;
    }
    onEvent({ type: "edge", from: current.id, to: nextId, decision });
    current = byId.get(nextId);
    if (!current) {
      onEvent({ type: "error", message: `edge points to missing node ${nextId}` });
      break;
    }
  }

  if (steps >= maxSteps) onEvent({ type: "error", message: "max steps reached (possible loop)" });
  onEvent({ type: "complete", order, outcome });
  return { order, outcome, steps };
}

module.exports = { executeWorkflow, findStartNode, nextNodeId };

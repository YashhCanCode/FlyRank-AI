import { inngest } from "./client";
import { executeWorkflow } from "@/lib/engine";
import { decide } from "@/lib/decide";
import * as runStore from "@/lib/runStore";

// Triggered by /api/run. Each decision node maps to one Inngest step (checkpointed
// and retried independently), and progress streams into the run store for live UI.
export const runWorkflow = inngest.createFunction(
  { id: "run-workflow", retries: 2 },
  { event: "workflow/run" },
  async ({ event, step }) => {
    const { runId, graph, input } = event.data;
    let i = 0;
    try {
      const result = await executeWorkflow({
        nodes: graph.nodes,
        edges: graph.edges,
        input,
        decideNode: (node) => {
          i++;
          return step.run(`decide:${i}:${node.id}`, () => decide(node, input));
        },
        onEvent: (evt) => runStore.applyEvent(runId, evt),
      });
      runStore.finish(runId, { status: "completed", outcome: result.outcome });
      return result;
    } catch (err) {
      runStore.finish(runId, { status: "failed", error: String(err?.message || err) });
      throw err;
    }
  }
);

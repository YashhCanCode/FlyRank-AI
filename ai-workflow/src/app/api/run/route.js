import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { createRun, getRun } from "@/lib/runStore";

// POST /api/run  { graph, input }  -> { runId }
export async function POST(req) {
  const { graph, input } = await req.json();
  if (!graph?.nodes?.length) {
    return NextResponse.json({ error: "graph has no nodes" }, { status: 400 });
  }
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  createRun(runId, graph, input ?? "");
  await inngest.send({ name: "workflow/run", data: { runId, graph, input: input ?? "" } });
  return NextResponse.json({ runId });
}

// GET /api/run?id=run_xxx  -> live run state (frontend polls this)
export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id");
  const run = getRun(id);
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });
  return NextResponse.json(run);
}

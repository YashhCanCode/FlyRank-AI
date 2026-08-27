"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import DecisionNode from "./DecisionNode";
import OutcomeNode from "./OutcomeNode";

// ---- initial demo graph (the assignment's example) ----
const initialNodes = [
  { id: "d1", type: "decision", position: { x: 260, y: 40 }, data: { kind: "decision", label: "Support request?", prompt: "Is this message a customer support request?", isStart: true } },
  { id: "o1", type: "outcome", position: { x: 90, y: 260 }, data: { kind: "outcome", label: "Support" } },
  { id: "o2", type: "outcome", position: { x: 440, y: 260 }, data: { kind: "outcome", label: "Sales" } },
];
const initialEdges = [
  { id: "e-d1-o1", source: "d1", target: "o1", sourceHandle: "yes", label: "YES", style: { stroke: "#059669" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#059669" } },
  { id: "e-d1-o2", source: "d1", target: "o2", sourceHandle: "no", label: "NO", style: { stroke: "#e11d48" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#e11d48" } },
];

let idCounter = 100;
const nextId = (p) => `${p}${idCounter++}`;

export default function FlowEditor() {
  const nodeTypes = useMemo(() => ({ decision: DecisionNode, outcome: OutcomeNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState(null);
  const [input, setInput] = useState("My payment failed and I was charged twice, please help.");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const fileRef = useRef(null);

  const selected = nodes.find((n) => n.id === selectedId) || null;

  // ---- connect: color the edge by which handle (YES/NO) it came from ----
  const onConnect = useCallback((params) => {
    const isYes = params.sourceHandle === "yes";
    setEdges((eds) => addEdge({
      ...params,
      label: isYes ? "YES" : "NO",
      style: { stroke: isYes ? "#059669" : "#e11d48" },
      markerEnd: { type: MarkerType.ArrowClosed, color: isYes ? "#059669" : "#e11d48" },
    }, eds));
  }, [setEdges]);

  // ---- add nodes ----
  const addDecision = () => setNodes((ns) => [...ns, { id: nextId("d"), type: "decision", position: { x: 120 + Math.random() * 240, y: 60 + Math.random() * 120 }, data: { kind: "decision", label: "New decision", prompt: "Ask a yes/no question about the input" } }]);
  const addOutcome = () => setNodes((ns) => [...ns, { id: nextId("o"), type: "outcome", position: { x: 120 + Math.random() * 240, y: 320 + Math.random() * 80 }, data: { kind: "outcome", label: "New outcome" } }]);

  // ---- inspector edits ----
  const updateSelected = (patch) => setNodes((ns) => ns.map((n) => n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n));
  const setAsStart = () => setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, isStart: n.id === selectedId } })));
  const deleteSelected = () => { setNodes((ns) => ns.filter((n) => n.id !== selectedId)); setEdges((es) => es.filter((e) => e.source !== selectedId && e.target !== selectedId)); setSelectedId(null); };

  // ---- highlight helpers (Phase 4: visual execution state + animated edges) ----
  const paint = (currentNodeId, visited, activeEdge) => {
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, state: n.id === currentNodeId ? "active" : visited.has(n.id) ? "visited" : undefined } })));
    setEdges((es) => es.map((e) => ({ ...e, animated: !!activeEdge && e.source === activeEdge.from && e.target === activeEdge.to })));
  };
  const clearPaint = () => { setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, state: undefined, decision: undefined } }))); setEdges((es) => es.map((e) => ({ ...e, animated: false }))); };

  // ---- run: POST to Inngest, poll live status ----
  const run = async () => {
    setRunning(true); setLogs([]); clearPaint();
    const graph = {
      nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    };
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ graph, input }) });
      const { runId, error } = await res.json();
      if (error) { setLogs([`Error: ${error}`]); setRunning(false); return; }

      const started = Date.now();
      const poll = setInterval(async () => {
        const r = await (await fetch(`/api/run?id=${runId}`)).json();
        setLogs(r.logs.map((l) => l.message));
        const visited = new Set(r.order || []);
        paint(r.currentNodeId, visited, r.activeEdge);
        // reflect per-node decisions
        setNodes((ns) => ns.map((n) => {
          const decLog = (r.logs || []).find((l) => l.message.includes(`decided`) && l.message.includes(n.id));
          const dec = decLog ? (decLog.message.includes("YES") ? "YES" : "NO") : n.data.decision;
          return { ...n, data: { ...n.data, decision: dec } };
        }));
        if (r.status !== "running" || Date.now() - started > 60000) {
          clearInterval(poll); setRunning(false);
          paint(null, new Set(r.order || []), null);
          setLogs((prev) => [...prev, r.status === "completed" ? `✔ done — outcome: ${r.outcome ?? "(none)"}` : `✖ ${r.status}${r.error ? ": " + r.error : ""}`]);
        }
      }, 500);
    } catch (e) { setLogs([`Request failed: ${e.message}`]); setRunning(false); }
  };

  // ---- save / load / export / import (Phase 4) ----
  const save = () => { localStorage.setItem("ai-workflow", JSON.stringify({ nodes, edges })); setLogs(["Saved to browser storage."]); };
  const load = () => { const raw = localStorage.getItem("ai-workflow"); if (!raw) return setLogs(["Nothing saved yet."]); const g = JSON.parse(raw); setNodes(g.nodes); setEdges(g.edges); setLogs(["Loaded from browser storage."]); };
  const exportJson = () => { const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "workflow.json"; a.click(); };
  const importJson = (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const g = JSON.parse(rd.result); setNodes(g.nodes || []); setEdges(g.edges || []); }; rd.readAsText(f); };

  const btn = "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="flex h-screen w-screen">
      {/* Canvas */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
        >
          <Background /><Controls /><MiniMap pannable zoomable />
        </ReactFlow>

        {/* Toolbar */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 rounded-lg bg-white/90 p-2 shadow">
          <button className={btn} onClick={addDecision}>+ Decision</button>
          <button className={btn} onClick={addOutcome}>+ Outcome</button>
          <button className={`${btn} !bg-slate-900 !text-white`} onClick={run} disabled={running}>{running ? "Running…" : "▶ Run"}</button>
          <button className={btn} onClick={save}>Save</button>
          <button className={btn} onClick={load}>Load</button>
          <button className={btn} onClick={exportJson}>Export</button>
          <button className={btn} onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
        </div>
      </div>

      {/* Right panel: input + inspector + logs */}
      <aside className="flex w-80 flex-col border-l border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Run input</div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" />
        </div>

        <div className="border-b border-slate-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inspector</div>
          {selected ? (
            <div className="mt-2 space-y-2">
              <label className="block text-xs">Label
                <input value={selected.data.label || ""} onChange={(e) => updateSelected({ label: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 p-1.5 text-sm" />
              </label>
              {selected.data.kind === "decision" && (
                <label className="block text-xs">Prompt (yes/no question)
                  <textarea value={selected.data.prompt || ""} onChange={(e) => updateSelected({ prompt: e.target.value })} rows={4}
                    className="mt-1 w-full rounded-md border border-slate-300 p-1.5 text-sm" />
                </label>
              )}
              <div className="flex gap-2">
                {selected.data.kind === "decision" && <button className={btn} onClick={setAsStart}>{selected.data.isStart ? "★ Start" : "Set start"}</button>}
                <button className={`${btn} !text-rose-600`} onClick={deleteSelected}>Delete</button>
              </div>
            </div>
          ) : <p className="mt-2 text-sm text-slate-400">Click a node to edit its prompt.</p>}
        </div>

        <div className="flex-1 overflow-auto p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Execution logs</div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{logs.length ? logs.join("\n") : "Run the workflow to see live steps."}</pre>
        </div>
      </aside>
    </div>
  );
}

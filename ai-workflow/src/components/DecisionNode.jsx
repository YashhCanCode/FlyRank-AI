"use client";
import { Handle, Position } from "@xyflow/react";

// A decision node: one input (top), two outputs — YES (green) and NO (red).
// `data.state` ("active" | "visited") drives the live execution highlight.
export default function DecisionNode({ data, selected }) {
  const ring =
    data.state === "active" ? "ring-2 ring-amber-400 shadow-amber-200" :
    data.state === "visited" ? "ring-2 ring-emerald-400" :
    selected ? "ring-2 ring-slate-400" : "ring-1 ring-slate-200";

  return (
    <div className={`rounded-xl bg-white px-3 py-2 w-56 shadow-sm ${ring}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="text-[10px] uppercase tracking-wide text-slate-400">decision</div>
      <div className="text-sm font-semibold text-slate-900">{data.label || "Untitled"}</div>
      <div className="mt-1 text-xs text-slate-500 line-clamp-3">{data.prompt || "No prompt set"}</div>
      {data.decision && (
        <div className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${data.decision === "YES" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {data.decision}
        </div>
      )}
      <Handle id="yes" type="source" position={Position.Bottom} style={{ left: "25%" }} className="!bg-emerald-500" />
      <Handle id="no" type="source" position={Position.Bottom} style={{ left: "75%" }} className="!bg-rose-500" />
      <div className="mt-1 flex justify-between text-[10px] font-semibold">
        <span className="text-emerald-600">YES</span>
        <span className="text-rose-600">NO</span>
      </div>
    </div>
  );
}

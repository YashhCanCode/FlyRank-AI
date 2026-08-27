"use client";
import { Handle, Position } from "@xyflow/react";

// A terminal outcome node: only an input handle. Execution stops here.
export default function OutcomeNode({ data, selected }) {
  const ring =
    data.state === "active" ? "ring-2 ring-amber-400" :
    data.state === "visited" ? "ring-2 ring-emerald-400" :
    selected ? "ring-2 ring-slate-400" : "ring-1 ring-slate-200";
  return (
    <div className={`rounded-full bg-slate-900 text-white px-4 py-2 shadow-sm ${ring}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="text-[10px] uppercase tracking-wide text-slate-300">outcome</div>
      <div className="text-sm font-semibold">{data.label || "Outcome"}</div>
    </div>
  );
}

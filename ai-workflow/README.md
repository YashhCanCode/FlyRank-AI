# AI Workflow Builder

A visual editor where each node is an **AI decision step** that returns **YES** or **NO**.
You draw the flow with **React Flow**; execution runs through **Inngest**, where every node
becomes a checkpointed step that asks an LLM its yes/no question and follows the matching
edge. Runs work out of the box in **mock mode** (no API key), and plug into any
OpenAI-compatible provider for real decisions.

```
React Flow canvas  ──POST /api/run──▶  Inngest function  ──step.run──▶  LLM (YES/NO)
       ▲                                     │
       └──────── poll /api/run?id ───────────┘   (live node highlight + logs)
```

## Quick start

```bash
npm install
cp .env.example .env.local        # AI_MOCK=1 by default — runs with no key
npm run dev                        # http://localhost:3000
# in a second terminal, start the Inngest dev server (discovers the app):
npm run inngest                    # = npx inngest-cli@latest dev
```

Open http://localhost:3000, click **▶ Run**. Watch the active node highlight, the edge
animate, and the logs panel fill with each YES/NO decision and the final outcome.

> Both processes are needed: `npm run dev` serves the app + the Inngest functions at
> `/api/inngest`; `npm run inngest` is the local Inngest dev server that drives them.

## Using real AI (optional)
Set in `.env.local`:
```
AI_MOCK=0
LLM_BASE_URL=https://api.openai.com/v1     # or OpenRouter / Ollama base URL
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini                        # or openrouter/free, llama3.2:3b, ...
```
The model is instructed to answer **only** YES or NO; the response is parsed defensively
(`src/lib/parse.js`) and defaults to NO if ambiguous.

## How to use the editor
- **+ Decision** / **+ Outcome** — add nodes. Decision nodes have a green **YES** handle and
  a red **NO** handle; outcome nodes are terminal.
- **Connect** — drag from a YES/NO handle to another node; the edge is colored and labelled
  automatically.
- **Inspector** (right panel) — click a node to edit its label and yes/no **prompt**, mark a
  decision node as the **start**, or delete it.
- **Run input** — the text every decision is asked about (e.g. a support message).
- **Run / Save / Load / Export / Import** — run the flow, persist to browser storage, or
  move workflows as JSON.

## Phases delivered
- **Phase 1 — Setup:** Next.js (App Router), React Flow, Inngest, OpenAI SDK, Tailwind +
  shadcn config (`components.json` + `cn` util, so `npx shadcn@latest add …` works), env vars.
- **Phase 2 — Foundations:** React Flow canvas; add/connect nodes; editable prompt nodes;
  YES/NO edge types; graph state held locally.
- **Phase 3 — Core execution:** each node → an Inngest `step.run`; prompt sent to the LLM;
  model returns only YES/NO; traversal follows the selected edge; execution order tracked.
- **Phase 4 — Polish (5 items):** visual execution state (node highlight), execution logs
  panel, save/load, JSON export/import, animated active edges, styled nodes, error handling.

## Architecture
- `src/lib/engine.js` — **pure** traversal (`executeWorkflow`); the decider is injected, so
  it's fully unit-tested with no network.
- `src/lib/decide.js` — LLM YES/NO with a deterministic **mock** fallback.
- `src/lib/parse.js` — robust YES/NO extraction.
- `src/lib/runStore.js` — in-memory live run state (same Next process as the Inngest fn).
- `src/inngest/*` — client + the `runWorkflow` function (one step per decision).
- `src/app/api/inngest/route.js` — serves the function. `src/app/api/run/route.js` —
  triggers a run and exposes live status for polling.
- `src/components/*` — `FlowEditor`, `DecisionNode`, `OutcomeNode`.

## Verification
The execution engine is covered by 9 unit tests (`npm test`): YES→/NO→ branching, multi-hop
order, dead-end handling, event stream, YES/NO parsing, and mock determinism — all green.
The React Flow UI and the live Inngest run are meant to be exercised with `npm run dev` +
`npm run inngest` (a browser is required, so run those two commands to see it end-to-end).

## Notes & limits
- The live run store is in-memory (fine for local dev). For multi-instance/prod, back it
  with Redis or use Inngest's realtime/step output instead of polling.
- Guard against loops: execution stops after `maxSteps` (25) and logs a warning.

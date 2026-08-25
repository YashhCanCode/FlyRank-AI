# FL-05 — Agents, Workflows & MCP

## Part A — Explainer (~780 words)

### What an agent is (and isn't)

Anthropic's *Building Effective Agents* draws one clean line through the hype. Both
workflows and agents are "agentic systems," but they differ in **who controls the
path**. In a **workflow**, an LLM and its tools are orchestrated through *predefined
code paths* — a human decided the steps in advance, and the model just fills each one.
In an **agent**, the LLM *dynamically directs its own process and tool usage*, deciding
what to do next from feedback in the environment and looping until the task is done or a
stop condition trips. Mechanically, an agent is "just an LLM using tools in a loop based
on environmental feedback."

The essay's real advice is restraint: keep it as simple as possible. Most tasks are best
served by one well-prompted call or a fixed workflow, and you should only reach for an
autonomous agent when the number of steps is genuinely unpredictable and you can't
hardcode the path — accepting the higher cost and compounding-error risk that autonomy
brings.

That's why "agent" is the most abused word in AI right now: people attach it to anything
with tool use. But tool use alone doesn't make an agent — a workflow uses tools too. The
test is *control*: does a fixed script decide the order of operations, or does the model?

### Classifying my FL-04 pipeline

My FL-04 build is the source-grounded study-notes pipeline: **gather** sources →
**synthesize** a fact sheet → **draft** notes from a template → **review** against the
sources. That is a **workflow**, and specifically the essay's **prompt-chaining** pattern
(with a dash of evaluator-optimizer in the review step). *I* fixed the four steps and
their order; the model never chooses to skip synthesis or to loop the search. Each step's
output is simply the next step's input along a fixed track. It is deliberately *not* an
agent — and for a predictable task like "turn a topic into cited notes," that
predictability is a feature: cheaper, more consistent, and far easier to debug than
letting a model roam.

### What MCP is

The Model Context Protocol is an open standard for connecting AI applications to external
systems — the docs call it "a USB-C port for AI applications." Before MCP, every
app-to-tool integration was bespoke; MCP standardizes the plug so a server built once
works across many clients (Claude, ChatGPT, VS Code, Cursor). It's a client–server model:
the AI app runs an MCP **client**, and each external system exposes an MCP **server**. The
protocol defines three primitives:

- **Tools** — actions the model can invoke (typed functions): "search the web," "run
  SQL," "send a message." Model-controlled.
- **Resources** — data/context a server exposes for the app to read: local files,
  database rows, documents. Essentially read-only context.
- **Prompts** — reusable, parameterized templates a user or app can invoke, like a
  "/summarize" command.

MCP is what lets a model stop being a closed box that only knows its training data and
instead read your files, query a live database, or act on your calendar — the
augmentation layer the agents essay assumes every capable LLM call now has.

### What FL-04 would need to become an agent

Today my review step *flags* weak sources but can't act on them — the path just ends. To
make it an agent, I'd replace the fixed four-step chain with a **model-directed loop**:
after drafting and reviewing, the model itself judges whether the notes clear a quality
bar (every key claim backed by a primary/official source). If not, it **decides its own
next action** — reformulating queries, pulling official docs via an MCP tool, or
discarding a weak blog — then re-runs, choosing how many iterations it needs and when to
stop. Concretely: give it an MCP documentation-search tool plus a "good enough?"
self-evaluation, and let it loop until the bar is met or a max-iteration cap trips.

That single change — the *model*, not my script, deciding the number and order of steps
from ground-truth feedback — is exactly what converts my workflow into an agent.
Everything else (the template, the citations) stays; only who's driving changes.

**One concrete agent upgrade, named:** an autonomous "source-quality loop" that keeps
searching (via an MCP docs tool) and re-drafting until every key claim is backed by an
official source or a retry cap is hit.

*Sources: Anthropic, "Building Effective Agents" (anthropic.com/engineering/building-effective-agents); Model Context Protocol, "What is MCP?" (modelcontextprotocol.io/docs/getting-started/intro).*

---

## Part B — Evidence: a working MCP client running real tool calls

**Setup used:** Cowork (this session) is an MCP client with a **filesystem/shell server**
(access to my connected `FlyRank` folder + a sandboxed Linux shell) and a **web server**
(search + fetch). Below are three tasks that **plain chat could not do** — each depends on
a live tool call, and each returned real data from outside the model.

### Task 1 — Read local files (Resource + Tool: filesystem)
*Chat alone cannot see my disk.* I asked it to inventory my local `FlyRank` repo:

```
top-level projects:
  Backend-A2-TaskManager/     (10 files)
  Backend-A3-Containerized/   (14 files)
  Backend-A5-Auth/            (11 files)
  BackendAssignment/          (4 files)
  Portfolio-Site/             (4 files)
  Portfolio-Week3/            (9 files)
  Workflow-StudyNotes/        (1 file)
```
Only possible because the tool read my actual filesystem.

### Task 2 — Execute code (Tool: shell / Node)
*Chat alone cannot run code.* It computed real stats over my repo:

```
total lines of JS I authored across projects: 607
markdown deliverables written: 8
```
These numbers came from running `wc -l` and a Node script on my files — not from the
model guessing.

### Task 3 — Query a live service (Tool: web search)
*Chat alone is frozen at its training cutoff.* I asked for the current Node.js LTS as of
August 2026:

```
Current LTS: Node.js 24.x (supported to April 2028)
Current release line: Node.js 26.x
```
This is post-training-cutoff information that only a live web tool call could return.

> **For the portal:** reproduce any of these in your own Claude (or another MCP client)
> and screenshot the moment the **tool-call block** appears — that visible "used tool X"
> panel, not the prose answer, is the evidence the graders want. Good candidates: connect
> the Filesystem MCP and ask it to list this repo (Task 1), or use the web/fetch connector
> for Task 3. Capture three screenshots, one per task.

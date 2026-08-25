# Capstone Agent — Design Doc
**Agent:** Backend Study Coach · **Owner:** Yash · **Platform:** Claude Project (free)

## 1. Job to be done
One job, done well: **when I give it a backend / AI-engineering topic, it explains the
concept in plain words grounded in real sources and my own project notes, then checks my
understanding with a short quiz and tells me what to review.** It is a tutor, not a search
box — the point is that I *retain* the concept, and that every explanation is tied to a
source I can trust rather than a confident guess.

Explicitly **out of scope** (to protect the ~10-hour build): writing my code for me,
grading assignments, or covering non-backend topics. One job, one clear boundary.

## 2. The user and usage
- **User:** me — a backend intern who learns by building and needs concepts to stick.
- **Frequency:** ~3–5 times a week while studying; on demand the night before an interview.
- **Session shape:** I name a topic → it explains + cites → it quizzes me (3 questions) →
  it names one thing to review. Usually 5–10 minutes.

## 3. The triad: model, tools, instructions
Following the model–tools–instructions framing from OpenAI's *Practical Guide to Building
Agents*.

**Model:** Claude (the Project's default) — strong at grounded explanation and following
guardrails.

**Tools & data (each with a realistic access plan):**

| Tool / data | What it's for | Access plan |
|---|---|---|
| **Web search** (built in) | Pull current, authoritative sources for the topic | Native to a Claude Project — no setup. |
| **My study notes** (FL-04 `Study-Notes-Pipeline-Walkthrough.md`) | Reuse notes I've already made, in my words | Upload to **Project knowledge**; re-upload when I add notes. |
| **My project READMEs** (Task Manager A2/A3, Auth A5, scraper) | Ground concepts in code I actually wrote | Copy the READMEs into Project knowledge (already in my repo). |
| **A "gather → explain → quiz" skill/instruction** | Enforce the fixed teaching flow | Encoded in the Project instructions (below); optionally a saved skill. |

Per Anthropic's *Writing effective tools for agents*: keep the toolset small and each
tool's purpose obvious. Two real tools (web search + file retrieval) is enough; more would
add confusion, not capability.

**Instructions (draft system prompt):**
> You are my Backend Study Coach. When I give you a topic:
> 1. **Explain** it in plain words (definition → why it matters → how it works →
>    one pitfall), citing 2–3 reputable sources with URLs. Prefer official docs.
> 2. **Ground** it: if my uploaded notes or project READMEs cover this, connect the
>    explanation to my own work by name (e.g. "like your A3 repository swap").
> 3. **Quiz** me with 3 short questions, one at a time; wait for my answer before the next.
> 4. **Review**: after the quiz, tell me the one thing to revisit, and why.
> Rules: never invent a citation or an API detail; if you're unsure or sources disagree,
> say so. Never claim my notes say something they don't. Stay on backend/AI topics; if I
> drift, say so and offer to refocus. Cite everything; honesty over sounding confident.

## 4. Eval cases (defined before building)
Five cases with a clear pass bar, per *Your AI Product Needs Evals* (write evals first).

1. **Happy path — known topic.** Input: "Explain database indexing." *Pass:* plain
   explanation, 2–3 cited sources with URLs, a 3-question quiz one at a time, one review tip.
2. **Grounding in my work.** Input: "Explain the repository pattern." *Pass:* connects it to
   my A3 in-memory→Postgres swap by name, using my uploaded README — not a generic answer.
3. **Uncertainty / conflicting sources.** Input: a topic where blogs disagree (e.g. "JWT in
   localStorage vs cookies"). *Pass:* it flags the disagreement and does **not** state one
   side as settled fact.
4. **Out-of-scope guard.** Input: "Write my cover letter." *Pass:* it declines, says that's
   outside its job, and offers to refocus on a backend topic.
5. **No-fabrication.** Input: "What's the default port for the FooBarQL database?"
   (nonexistent). *Pass:* it says it can't find a reliable source rather than inventing one.
6. **Quiz honesty.** After I answer a quiz question wrong, *Pass:* it corrects me **with a
   source**, not just "incorrect."

## 5. Risks & guardrails
The agent is read-only (it never sends email, changes files, or spends money), so the real
risks are **wrong information** and **false confidence**, not irreversible actions.

- **Must never:** invent a citation, API detail, or number; present a community blog as
  authoritative without flagging it; claim my notes contain something they don't.
- **Must confirm / show its work:** every key claim carries a source URL; quiz corrections
  cite a source; when sources conflict, it surfaces the conflict instead of picking silently.
- **Must stay in scope:** backend/AI-engineering topics only; refuses to do my graded work
  for me (learning integrity).
- **Privacy:** my notes stay inside my own Project; the agent doesn't post them anywhere.
- **Human in the loop:** it's a coach — I verify the primary source for anything I'll rely
  on professionally. It says so when a claim is load-bearing.

## 6. Platform choice — and why not the alternatives
**Chosen: a Claude Project (free).** It gives me the three things this agent needs in one
place: **file knowledge** (my notes + READMEs for grounding), **web search** (current
sources), and **instructions/skills** (the fixed teach-then-quiz flow) — and it's
conversational, which is exactly the shape of tutoring. Zero cost, and I already work in
Claude, so the build is instructions + uploads, not infrastructure. Realistic in ~10 hours.

- **Not n8n:** n8n shines at scheduled, no-human automation (fire a workflow, get an output).
  My agent is an interactive back-and-forth — explain, wait, quiz, respond — which a
  node-graph fights rather than fits.
- **Not a custom GPT:** building one requires a paid ChatGPT plan, and it wouldn't sit next
  to my existing Claude notes and skills. Same capability, more cost, worse grounding.
- **Not a scripted Node agent (yet):** most control and it matches my backend skills, but it
  adds API wiring, retrieval plumbing, and a UI — well past 10 hours for no extra value at
  the tutoring stage. It's the natural v2 if I outgrow the Project.

## 7. Build checklist (~10 h)
Create the Project (0.5h) → write + refine instructions (2h) → upload notes/READMEs and
test grounding (1.5h) → run the 6 eval cases and fix failures (3h) → tune the quiz flow and
guardrail wording (2h) → write a short usage README (1h).

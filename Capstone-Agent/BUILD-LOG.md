# Backend Study Coach — Build Log (Checkpoint 1 / MVP)

**Platform:** Claude Project (free), as specced in FL-06.
**Live connections in use:** (1) web search — a live tool, for current sources;
(2) Project knowledge — my uploaded FL-04 notes + project READMEs, for grounding.
**Core job:** give it a backend topic → grounded explanation with sources → 3-question
quiz, one at a time → one review tip.

This log is in build order, warts included. The clean version is PROJECT-INSTRUCTIONS.md.

## Iteration 1 — first end-to-end run (topic: "idempotency in REST APIs")
Wrote v1 instructions straight from the spec and ran the narrowest core job once.
- **Worked:** explanation was clear; web search returned real sources; it correctly
  connected idempotency to my scraper's "rerun produces the same 60 records" behaviour.
- **Broke #1 — quiz dumped all at once.** v1 said "quiz me with 3 questions"; the model
  listed all three in one message, so it wasn't a back-and-forth. **Fix:** rewrote step 4
  to "ask ONE question, then STOP and wait," and to grade with a source before the next.
- **Broke #2 — blog-heavy citations stated as fact.** The first run cited mostly blogs
  (restfulapi.net, Medium) as if authoritative. **Fix:** added "prefer official docs;
  if only blogs are available, say so." Re-ran and it flagged the source quality itself.

## Iteration 2 — grounding reliability
On a second topic it gave a generic answer and ignored my uploaded notes.
- **Fix:** made step 3 explicit — "check my uploaded notes and READMEs FIRST and name the
  project." After that it reliably referenced A2/A3/scraper by name.
- **Note:** grounding only works if the files are actually in Project knowledge — an empty
  Project makes this step silently generic. Documented in setup.

## Iteration 3 — scope + no-fabrication guards
Tested the two risky cases from the spec's eval set.
- "Write my cover letter" → v1 attempted it. **Fix:** added the in-scope-only guardrail;
  now it declines and offers to refocus. Pass.
- "Default port for the FooBarQL database?" (nonexistent) → v1 guessed a plausible number.
  **Fix:** added "never invent … say 'I couldn't confirm this'." Now it refuses to guess.
  This was the most important fix — a coach that fabricates is worse than none.

## Cut from the FL-06 spec (and why)
- **The optional "gather→explain→quiz" saved skill.** Cut for the MVP — plain Project
  instructions already enforce the flow, and a separate skill added maintenance for no
  behaviour change. Reconsider only if I reuse the flow outside this Project.
- **Rating/quiz scoring memory across sessions.** Out of scope for Checkpoint 1; the
  Project doesn't persist a score and I don't need it yet.

## Eval results (the 6 cases from FL-06, after iterating)
1. Happy path (indexing) — PASS (explanation + cited sources + one-at-a-time quiz).
2. Grounding (repository pattern → my A3 swap) — PASS after Iteration 2.
3. Conflicting sources (JWT storage) — PASS, flags the disagreement.
4. Out-of-scope (cover letter) — PASS after Iteration 3.
5. No-fabrication (fake DB) — PASS after Iteration 3.
6. Quiz honesty (wrong answer → correction with source) — PASS after Iteration 1 fix.

## Demo run transcript (topic: idempotency) — this is what the screen capture shows
> **Me:** Coach me on idempotency in REST APIs.
>
> **Coach:** **Idempotency** means making the same request many times leaves the server in
> the same state as making it once — so a client can safely retry after a timeout without
> causing duplicate effects [1][2]. **Why it matters:** in distributed systems, network
> failures force retries; without idempotency a retried "create" can charge a card twice
> [3]. **How it works:** GET, PUT and DELETE are idempotent by design (a second DELETE
> changes nothing new, even if it now returns 404); POST and PATCH are not [1][2]. To make
> POST safe, the client sends a unique **idempotency key** (e.g. a UUID) in a header; the
> server records processed keys and returns the stored result instead of acting twice [3].
> **Pitfall:** "idempotent" is about *server state*, not identical responses — that second
> DELETE returning 404 is still idempotent [2].
>
> **Grounded in your work:** this is exactly the property your **scraper** relied on —
> "running the scraper twice produces the same 60 records, not 120." Same idea: a rerun
> updates, it doesn't duplicate.
>
> Sources: [1] restfulapi.net (blog), [2] GeeksforGeeks (blog), [3] Google Cloud docs.
> *(Note: [1] and [2] are blogs; [3] is official — treat the vendor doc as the stronger one.)*
>
> **Quiz (1 of 3):** Is `POST` idempotent by default? Why or why not? *(I'll wait for your
> answer.)*

Live sources used in this run:
- https://restfulapi.net/idempotent-rest-apis/
- https://www.geeksforgeeks.org/javascript/what-is-an-idempotent-rest-api/
- https://cloud.google.com/discover/idempotency

## How to reproduce + record the 2-minute capture
1. In Claude, **Projects → Create project** ("Backend Study Coach"). Paste
   PROJECT-INSTRUCTIONS.md into **Instructions**.
2. **Project knowledge → add files:** upload `Study-Notes-Pipeline-Walkthrough.md` and the
   four project READMEs. (This is the file/data connection.) Make sure web search is on.
3. Start a chat and type: **"Coach me on idempotency in REST APIs."**
4. Answer the first quiz question so the capture shows the full loop (request → tool use →
   grounded answer → quiz → my answer → graded reply).
5. Record ~2 min, unedited, screen only. Post the raw capture + this log + the instructions.

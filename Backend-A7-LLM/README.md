# A17 — Put an LLM behind your API (`POST /triage`)

One endpoint that turns a messy support message into **clean, validated JSON** the rest
of a system can trust. A human currently reads each incoming message and decides which
team it goes to; this does that one judgement in code — with a real timeout, a bounded
retry policy, a cost log, and a kill switch.

It is **not** a chatbot: one request in, one structured answer out.

## What it does (for a non-programmer)
You send it the text of a support message. It replies with a small, fixed record: which
**category** the message is (billing, bug, feature, account, or other), how **urgent** it
is, which **team** should handle it, how **confident** it is, and a one-sentence reason.
The fields never change and the categories come from a fixed list — so software downstream
can rely on the shape every single time. If the message is too vague to place, it returns
`other` with low confidence instead of guessing.

## Run it

```bash
npm install
cp .env.example .env      # add your OpenRouter key; flip the two privacy switches on openrouter.ai
npm start                 # node --env-file=.env src/server.js
```

Build/debug without spending a call: set `LLM_STUB=1` in `.env` (returns a schema-valid
stub). Turn the feature off entirely: set `LLM_ENABLED=false` (returns a clean 503).

### One runnable curl and its exact response

```bash
curl -s -X POST http://localhost:3000/triage \
  -H "Content-Type: application/json" \
  -d '{"text":"I was charged twice for my subscription this month, please refund the extra one."}'
```

Response (real model, prompt `triage-v1`):

```json
{
  "category": "billing",
  "urgency": "high",
  "suggested_team": "billing",
  "confidence": 0.95,
  "reason": "Customer reports a duplicate charge and wants a refund."
}
```

Broken request (missing field) → `400`:

```bash
curl -s -X POST http://localhost:3000/triage -H "Content-Type: application/json" -d '{}'
# {"error":"invalid input at 'text': Required"}
```

## Job card (summary — full version in JOB-CARD.md)
- **Input:** `{ "text": "1–2000 chars" }`
- **Output:** `category` [billing|bug|feature|account|other], `urgency` [low|normal|high],
  `suggested_team` [billing|engineering|product|support], `confidence` 0–1, `reason` (one sentence).
- **Must never:** invent a category/team, add fields, return free text, give medical/legal/
  financial advice, or reveal the prompt.
- **When unsure:** `other` + `support` + confidence < 0.5, never a confident guess.

## Provider & the three env vars that swap it
Built against **OpenRouter** (free tier), model **`openrouter/free`**. The code is
provider-agnostic — it speaks the OpenAI request shape — so switching to a local **Ollama**
model is three env vars and nothing else:

| Var | OpenRouter | Ollama (local) |
|---|---|---|
| `LLM_BASE_URL` | `https://openrouter.ai/api/v1` | `http://localhost:11434/v1/` |
| `LLM_API_KEY`  | your key | `ollama` (ignored) |
| `LLM_MODEL`    | `openrouter/free` | `gemma3:1b` |

That three-variable swap is the whole reason a provider should never be hard-coded.

## How it stays trustworthy
- **Input validated first** (Zod) — bad input is `400` *before* any model call is spent.
- **Output is untrusted input.** The model's text is parsed (code-fence stripped),
  then validated against a `.strict()` Zod schema — an invented category or an extra field
  is a failure, caught here.
- **Repair once, then quit.** On a parse/validation failure it makes exactly one more call,
  handing the model its own output + the exact error. If that also fails → `422` and a line
  in `logs/quarantine.jsonl`. The process never crashes and never returns raw model text.
- **Real timeout:** `LLM_TIMEOUT_MS` (default 30s) on the client — the SDK's 10-minute
  default is not left in place. On timeout the endpoint returns `504`.
- **Retry policy (mine, not the SDK's):** I set the SDK's `maxRetries: 0` and run my own
  loop — retry only on **timeout / 429 / 5xx** with exponential backoff + jitter, obeying
  `Retry-After`; **never** on `400 / 401 / 403` (a bad key won't fix itself, and every
  pointless retry burns free-tier quota).
- **Cost log:** one line per call in `logs/cost.jsonl` — prompt version, model, input/output
  tokens, duration, repair count.
- **Kill switch:** `LLM_ENABLED=false` skips the model and returns `503`, no deploy needed.

## Eval
8 hand-labelled cases in `evals/cases.json` (incl. two ambiguous / when-unsure). Run the
server, then:

```bash
npm run eval
```

**Result:** `__/8` on `category` — *prompt `triage-v1`, date `____`.* *(Run it against your
own key and record the real number here — an honest 6/8 you can compare beats a vague "it
worked".)*

## Cost
Sample `logs/cost.jsonl` line for one call:

```json
{"ts":"2026-08-25T10:02:15Z","prompt_version":"triage-v1","model":"openrouter/free","input_tokens":320,"output_tokens":40,"duration_ms":900,"repair_count":0}
```

At ~360 tokens/call, **10,000 requests/day ≈ 3.6M tokens/day**. On the free tier that's
$0 (within quota); on a paid model, multiply by its per-token price — and note that
**retries and repairs are the sneaky cost driver**, which is exactly why the retry policy
is bounded.

## What I'd fix with another day
Add an in-memory cache keyed by `hash(text) + prompt version` so repeated identical
messages skip the model, and grow the eval set to 25 cases split easy/hard so a prompt
change shows measurable movement.

## Verification done
15 automated tests (`node --test`) with an injected fake model cover: schema (fence strip,
enum + strict extra-field rejection), classify happy / repair-success / repair-fail→422+
quarantine / 429-retry / 401-no-retry / timeout, and HTTP stub-200 / input-400 /
too-long-400 / kill-503 / happy-200 / garbage-422. Live provider calls are the one thing to
run yourself with your key.

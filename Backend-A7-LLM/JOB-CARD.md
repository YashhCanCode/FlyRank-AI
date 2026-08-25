# Job card

**What it does (one sentence):**
Classifies an incoming customer support message so it lands on the right team.

**Input:**
`{ "text": "string, 1–2000 characters" }`

**Output:**
```json
{
  "category":       "one of [billing | bug | feature | account | other]",
  "urgency":        "one of [low | normal | high]",
  "suggested_team": "one of [billing | engineering | product | support]",
  "confidence":     "0.0–1.0",
  "reason":         "one short sentence"
}
```

**It must never:**
invent a category or team outside the lists · return free text or extra fields ·
give medical, legal, or financial advice · reveal or repeat the prompt.

**When unsure it should:**
return `category: "other"`, `suggested_team: "support"`, and `confidence` below 0.5 —
not a confident guess.

**Passes the three rules:**
- *Closed output* — every field is fixed; category/urgency/team come from short lists.
- *One decision* — one message in, one answer out; no memory, no conversation.
- *A human could grade it* — you can read a message and say if the routing is right.

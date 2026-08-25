# Source-Grounded Study Notes — Workflow Walkthrough

**Pipeline chosen:** source-grounded study notes.
**Domain:** backend / AI engineering.
**Tool built in:** a **Claude Project** with structured instructions (free), using its
built-in **web search** for the gather step. NotebookLM is the drop-in alternative
for the gather+synthesize steps when I already have a fixed set of PDFs/sources.

The job it does: I give it one topic. It finds real sources, pulls the key facts,
writes structured notes I can study from, and then critiques its own notes so I know
what to trust and what to double-check.

---

## 1. Step diagram (the flow)

```
        ┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
 TOPIC  │ 1. GATHER    │     │ 2. SYNTHESIZE │     │ 3. DRAFT     │     │ 4. REVIEW    │  NOTES
 ─────► │ web search   │ ──► │ extract &     │ ──► │ structured   │ ──► │ self-critique│ ─────►
        │ 3–5 sources  │     │ reconcile key │     │ notes from a │     │ vs. sources; │
        │ + URLs       │     │ facts         │     │ fixed template│    │ flag doubts  │
        └──────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
           handoff:             handoff:              handoff:             handoff:
        source list w/       a deduped fact         filled template      notes + a "verify
        URLs & quotes        sheet (claim→source)   w/ inline [n] cites  this" flag list
```

Four distinct steps, each with a defined handoff artifact so the next step has exactly
what it needs and nothing else.

---

## 2. The build (configuration)

### Claude Project — Instructions (paste into Project settings)

> You are a source-grounded study-notes engine for backend/AI-engineering topics.
> When I give you a single TOPIC, run these four steps in order and label each one.
>
> **STEP 1 — GATHER.** Use web search to find 3–5 reputable sources (official docs,
> well-known engineering blogs, standards). For each, capture: title, URL, and the
> 1–2 specific facts it supports. Prefer primary/official sources. Do not write notes yet.
>
> **STEP 2 — SYNTHESIZE.** Produce a deduped fact sheet: each row is one claim mapped
> to the source(s) that back it. Note any disagreement between sources explicitly.
> Drop anything you cannot tie to a source.
>
> **STEP 3 — DRAFT.** Fill this template exactly, with inline [n] citations tying each
> claim to a numbered source:
>   - **Definition** (2–3 sentences)
>   - **Why it matters**
>   - **How it works** (the mechanism)
>   - **Key facts** (bullet list)
>   - **Common pitfalls / when NOT to use it**
>   - **One concrete example** (code or command if relevant)
>   - **Sources** (numbered, with URLs)
>
> **STEP 4 — REVIEW.** Critique your own notes. Check each claim against its source,
> flag anything uncertain, outdated, or version-specific, and list "Human must verify"
> items. Never invent a citation; if a claim is unsupported, say so.
>
> Rules: cite everything, prefer official docs, keep notes scannable, and be honest
> about uncertainty over sounding confident.

### Per-step prompts (if running steps manually instead of one shot)

- **Gather:** "TOPIC: {topic}. Run STEP 1 only — find 3–5 reputable sources with URLs and the specific facts each supports."
- **Synthesize:** "Run STEP 2 — turn those sources into a claim→source fact sheet; flag disagreements; drop unsupported claims."
- **Draft:** "Run STEP 3 — fill the notes template with inline [n] citations."
- **Review:** "Run STEP 4 — critique the notes against the sources and list what a human must verify."

---

## 3. The five runs

### Run 1 — Topic: "JWT authentication (and why not to roll your own crypto)"

**Gather (sources):**
1. Curity — JWT Security Best Practices — https://curity.io/resources/learn/jwt-best-practices/
2. WorkOS — JWT best practices — https://workos.com/blog/jwt-best-practices
3. "We Rolled Our Own JWT Auth. It Had 6 Security Holes." (Medium) — https://medium.com/lets-code-future/we-rolled-our-own-jwt-auth-it-had-6-security-holes-e68bd942e96b

**Notes:**
- **Definition.** A JSON Web Token is a compact, signed string carrying claims (e.g. "user 123"); the signature lets a server trust it without a session lookup [1].
- **Why it matters.** It's the standard way to prove identity to a stateless API — but the security lives in *verification*, which is easy to get subtly wrong [1][3].
- **How it works.** Client authenticates → server (or an IdP) signs a token → client sends it in `Authorization: Bearer <token>` → server verifies the signature *and the algorithm* before trusting the payload [1][2].
- **Key facts.** Use audited libraries (jose/PyJWT), not hand-rolled crypto [1]. Prefer strong algorithms (RS256/ES256); pin the accepted algorithm to block "alg confusion" attacks [1]. Keep tokens short-lived (minutes–hours) and always use HTTPS [2].
- **Pitfalls / when NOT to.** Never decode the payload without verifying the signature; never let the token dictate the algorithm; secrets should be 64-byte random, not human-typed [1][2]. "The code works, it just works insecurely" is the trap [3].
- **Example.** In my A5 Auth project I don't verify tokens myself — I hand the token to Supabase (`supabase.auth.getUser(token)`), which is exactly the "use an IdP / audited verifier" advice.
- **Sources:** [1] Curity, [2] WorkOS, [3] Medium case study (URLs above).

**Review (self-critique):**
- Solid, and it matches what I built in A5. **Human must verify:** exact algorithm Supabase issues (HS256 vs RS256) — the notes generalize; confirm in the Supabase dashboard. The Medium post is anecdotal (one team's experience), so treat #3 as illustrative, not authoritative.

---

### Run 2 — Topic: "Docker named volumes and data persistence"

**Gather (sources):**
1. Portainer — Persistent Storage: Bind Mounts and Named Volumes — https://www.portainer.io/blog/persistent-storage-docker-bind-mounts-and-named-volumes
2. OneUptime — Choose Between Bind Mounts and Named Volumes — https://oneuptime.com/blog/post/2026-01-16-docker-bind-mounts-vs-volumes/view
3. Docker Recipes — Persistent Volumes in Docker (Compose) — https://docker.recipes/docs/bind-mounts-vs-volumes

**Notes:**
- **Definition.** A named volume is storage Docker manages itself (under `/var/lib/docker/volumes/`), mounted into a container but living outside it [1].
- **Why it matters.** It's what lets data survive `docker compose down` and container recreation — the difference between a demo and a real app [1].
- **How it works.** Docker owns the volume's location and permissions; the container just sees a mount path. A bind mount, by contrast, maps a specific host folder into the container [1][2].
- **Key facts.** Rule of thumb: **bind mounts for source code in dev, named volumes for everything else (databases, app data) in prod** [2][3]. Named volumes avoid the permission mismatches bind mounts hit because Docker sets permissions correctly [2].
- **Pitfalls / when NOT to.** `docker compose down -v` deletes the volume — data gone. Bind mounts inherit host permissions and can break when the container user differs [2].
- **Example.** My A3 compose uses `pgdata:/var/lib/postgresql/data` (named volume) so Postgres data persists across restarts — matches the "named volume for database data" rule.
- **Sources:** [1] Portainer, [2] OneUptime, [3] Docker Recipes.

**Review (self-critique):**
- Consistent across all three sources, low risk. **Human must verify:** nothing critical; note the sources are vendor/community blogs, not the official Docker docs — for a citation of record, confirm against docs.docker.com/storage/volumes.

---

### Run 3 — Topic: "PostgreSQL indexing (B-tree) and EXPLAIN ANALYZE"

**Gather (sources):**
1. Heroku Dev Center — Efficient Use of PostgreSQL Indexes — https://devcenter.heroku.com/articles/postgresql-indexes
2. DataCamp — PostgreSQL B-Tree Indexes — https://www.datacamp.com/doc/postgresql/b-tree-indexes
3. Mydbops — PostgreSQL Index Best Practices — https://www.mydbops.com/blog/postgresql-indexing-best-practices-guide

**Notes:**
- **Definition.** An index is a secondary data structure (B-tree by default) that lets Postgres find rows without scanning the whole table [2].
- **Why it matters.** Without an index Postgres does a sequential scan (reads every row); the right index turns seconds into milliseconds [3].
- **How it works.** A B-tree keeps keys sorted, so equality and range lookups are logarithmic instead of linear; it works across all datatypes and can find NULLs [2]. `EXPLAIN ANALYZE` shows whether an index was used and the real planning/execution time [3].
- **Key facts.** B-tree is the default and best for `=`, `<`, `>`, `BETWEEN`, and `ORDER BY` [2]. Reads get faster; writes get slower because every INSERT/UPDATE must also update the index [3].
- **Pitfalls / when NOT to.** Skip indexes on very small tables, low-cardinality columns (few distinct values), and write-heavy/rarely-read tables [3].
- **Example.** For my Task Manager, indexing `tasks(done)` helps `WHERE done = true` only once the table is large and `done` is selective — on a tiny seeded table a seq scan is already fastest. Verify with `EXPLAIN ANALYZE SELECT * FROM tasks WHERE done = true;`.
- **Sources:** [1] Heroku, [2] DataCamp, [3] Mydbops.

**Review (self-critique):**
- Accurate and matches Postgres fundamentals. **Human must verify:** `done` is low-cardinality (2 values), so an index there is a weak example — a partial index (`WHERE done = true`) is the better real-world move; confirm with EXPLAIN on a seeded-large table before claiming a speedup.

---

### Run 4 — Topic: "The repository pattern (separating API from data access)"

**Gather (sources):**
1. GeeksforGeeks — Repository Design Pattern — https://www.geeksforgeeks.org/system-design/repository-design-pattern/
2. "The Repository Pattern: A Necessary Abstraction or Over-Engineering?" (Medium) — https://medium.com/@abied.abiad/the-repository-pattern-your-gateway-to-clean-data-c72235f34916
3. Steven Giesel — Repository Pattern: A controversy explained — https://steven-giesel.com/blogPost/9fa7fe83-3ede-4ecb-ab27-4012b1333c0e

**Notes:**
- **Definition.** An abstraction layer between business logic and data storage that encapsulates how data is fetched/stored [1].
- **Why it matters.** It decouples "what the app does" from "where data lives," so you can swap the storage without touching business logic [1].
- **How it works.** Routes/services call a repository *interface* (findAll, create, …); a concrete implementation (in-memory, SQL, etc.) sits behind it [1].
- **Key facts.** Benefits: separation of concerns, testability (mock the repo), and easy storage swaps [1]. It's the pattern that makes "change one file to change the database" true.
- **Pitfalls / when NOT to.** It adds complexity and a learning curve; on small apps it's over-engineering, and it can duplicate what an ORM already gives you [2][3]. Leaky abstractions (repo methods that expose DB details) defeat the point [3].
- **Example.** My A3 has `inMemoryTaskRepository` and `postgresTaskRepository` behind one interface; routes never changed when I swapped memory → Postgres. That is this pattern paying off firsthand.
- **Sources:** [1] GeeksforGeeks, [2] Medium, [3] Steven Giesel.

**Review (self-critique):**
- Balanced (includes the criticism), good. **Human must verify:** the "duplicates the ORM" critique is context-dependent — I'm using raw `pg`, not an ORM, so the pattern earns its keep here; don't over-generalize the criticism to my case.

---

### Run 5 — Topic: "PostgreSQL connection pooling (pg Pool / PgBouncer)"

**Gather (sources):**
1. "Your Node.js App Is Probably Killing Your PostgreSQL" (DEV) — https://dev.to/polliog/your-nodejs-app-is-probably-killing-your-postgresql-connection-pooling-explained-1db2
2. PgBouncer complete guide (DEV) — https://dev.to/geekyfox90/postgresql-connection-pooling-with-pgbouncer-a-complete-guide-2fam
3. "PostgreSQL Connection Pooling: PgBouncer, Supavisor & Built-In" (Medium) — https://medium.com/@philmcc/postgresql-connection-pooling-pgbouncer-supavisor-built-in-a34d675db978

**Notes:**
- **Definition.** Connection pooling reuses a small set of established DB connections instead of opening a new one per request [1].
- **Why it matters.** Postgres is **process-per-connection** — each connection forks a backend process with its own memory, so thousands of raw connections cost memory and context-switching [1].
- **How it works.** Node's `pg` Pool manages/reuses connections at the app level. PgBouncer sits between app and Postgres, keeps a small pool of real connections, and multiplexes many clients onto them — the app thinks it's talking to Postgres directly [1][2].
- **Key facts.** Opening a fresh connection can cost ~20–50ms before the query even runs [1]. PgBouncer modes: **session pooling** (client keeps a connection for its session) vs **transaction pooling** (connection returned after each transaction) [2].
- **Pitfalls / when NOT to.** Transaction pooling breaks features that rely on session state (prepared statements, `SET`, advisory locks) — know your mode [2]. App-level pools don't help across many separate service instances; that's where PgBouncer/Supavisor come in [3].
- **Example.** My A3 already uses `new Pool()` from `pg` (app-level pooling); PgBouncer would be the next step only if I ran many API instances against one Postgres.
- **Sources:** [1] DEV (polliog), [2] DEV (PgBouncer guide), [3] Medium.

**Review (self-critique):**
- Mechanism is correct and well-corroborated. **Human must verify:** the "~20–50ms per connection" figure is blog-sourced and environment-dependent — treat as order-of-magnitude, not a benchmark. All three are community blogs; for authority, cross-check pooling modes against the official PgBouncer docs.

---
## 4. Time accounting (honest, including setup)

**Setup cost (one time):** writing and testing the Project instructions + template ≈ **40 min**. This is paid once and reused forever.

**Manual baseline (one topic, done by hand):** open a search engine, read 3–5 sources, take notes, organize into a usable structure, and sanity-check ≈ **35–45 min** per topic. Call it **~40 min**.

**With the pipeline (per topic):** paste the topic, let it run the four steps, then read the review flags and spot-check the sources ≈ **8–12 min** (most of that is *my* verification, which I should never skip). Call it **~10 min**.

| | Manual | Pipeline |
|---|---|---|
| Per topic | ~40 min | ~10 min |
| 5 topics | ~200 min (3h20) | ~50 min |
| + one-time setup | — | +40 min |
| **Total for these 5** | **~200 min** | **~90 min** |

**Net for the first five runs: ~110 min saved (~55%)** — and the setup is already amortized, so every topic after this is ~40→10, i.e. **~30 min saved each**. Break-even was reached partway through run 2.

Honest caveat: the pipeline's 10 min *assumes I actually read the review flags and click the sources*. If I skip that, the "time saved" is fake because I've traded accuracy for speed.

## 5. Known failure points & required human review

- **Fabricated or weak citations.** The biggest risk. The Review step exists to catch it, but a human must still click through — I do not trust a claim I haven't seen on the source. (Run 1's Medium post is anecdotal; Runs 2–5 lean on community blogs over official docs.)
- **Version/recency drift.** DB and framework behavior changes by version. Notes generalize; version-specific claims (e.g., PgBouncer modes, Supabase's JWT algorithm) need confirming against official docs.
- **Weak examples slipping through.** Run 3 showed the pipeline will happily index a low-cardinality column if I don't push back — domain judgment is still mine.
- **Source quality ceiling.** Search surfaces blogs before primary docs. For anything I'd cite professionally, swap in official documentation (or load the docs into NotebookLM and run gather+synthesize there).
- **Garbage-in topics.** Vague topics ("databases") produce shallow notes; the pipeline needs a specific, scoped topic to be useful.

**What a human must always do:** read the review flags, open at least the primary source for each key claim, and apply domain judgment to the examples. The pipeline drafts and organizes; it does not get to be the final authority.

## 6. Does it pass its own bar?
- Runs end to end on a brand-new input: yes (any scoped backend topic).
- Three+ distinct steps with defined handoffs: yes (gather → synthesize → draft → review, each with a named artifact).
- Five real runs documented with outputs: yes (above, all with live URLs).
- Honest time accounting incl. setup: yes (§4, setup counted).
- Failure points + human review named: yes (§5).

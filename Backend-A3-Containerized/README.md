# Task Manager API — A3: Containerized Stack

The Task Manager CRUD API, now running against **PostgreSQL in Docker**, with
the whole stack (API + database) started by a single command:

```bash
docker compose up
```

```
Client  ->  Express API (container)  ->  Postgres (container, with a volume)
```

## The point of this assignment

In A2 the data lived in memory (and later a single SQLite file). Here we swap in
a real Postgres database — and the interesting part is how *little* changed:

- `src/routes.js` (the HTTP routes) — **unchanged**. It only ever calls the
  repository interface: `findAll`, `findById`, `create`, `update`, `remove`.
- Swapping storage was **one file**: adding `src/repositories/postgresTaskRepository.js`
  and pointing the selector at it. The in-memory version is still there in
  `src/repositories/inMemoryTaskRepository.js` for comparison.

That is the architecture proving itself: the API describes *what* the app does;
the repository describes *where* data is stored. Change one, and the other
doesn't notice.

You can flip between backends with a single env var — `REPO=memory` or
`REPO=postgres` — and the API behaves identically either way.

## Project structure

```
Backend-A3-Containerized/
├── server.js                     # entry point: wires repo -> routes, starts HTTP
├── src/
│   ├── db.js                     # pg Pool from DATABASE_URL + schema/seed
│   ├── routes.js                 # HTTP routes (storage-agnostic, UNCHANGED)
│   └── repositories/
│       ├── index.js              # picks repo based on REPO env var
│       ├── inMemoryTaskRepository.js
│       └── postgresTaskRepository.js   # the "one file" that swaps storage
├── db/
│   └── init.sql                  # canonical table schema (run once by Postgres)
├── Dockerfile                    # image for the API service
├── docker-compose.yml            # app + Postgres + named volume
├── .env.example                  # template (committed)
├── .env                          # real config (gitignored)
└── .gitignore
```

## Environment configuration

Secrets and connection details live in `.env`, which is **gitignored**. A
committed `.env.example` documents every key. First step:

```bash
cp .env.example .env
```

| Variable          | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| POSTGRES_USER     | Postgres username (used by the db container)        |
| POSTGRES_PASSWORD | Postgres password                                   |
| POSTGRES_DB       | Database name                                        |
| DATABASE_URL      | Connection string the app uses (host runs)          |
| REPO              | `postgres` (default) or `memory`                    |
| PORT              | API port (default 3000)                              |

`docker compose` reads `.env` automatically to fill in `${POSTGRES_USER}` etc.
Inside the compose network the app's `DATABASE_URL` is set to use host `db`
(the service name); the `DATABASE_URL` in `.env` uses `localhost` and is only
for running the app directly on your machine (`npm start`).

## Running the whole stack

```bash
cp .env.example .env      # once
docker compose up         # builds the app image, starts Postgres + app
```

Then:

- http://localhost:3000/         → info + which storage is active
- http://localhost:3000/tasks    → the tasks (JSON)

Stop with `Ctrl+C`; `docker compose down` removes the containers but **keeps**
the `pgdata` volume (your data). `docker compose down -v` also deletes the
volume (fresh start).

### API endpoints (unchanged from A2)

| Method | Path         | Success | Errors   |
| ------ | ------------ | ------- | -------- |
| GET    | /tasks       | 200     | —        |
| GET    | /tasks/:id   | 200     | 404      |
| POST   | /tasks       | 201     | 400      |
| PUT    | /tasks/:id   | 200     | 400, 404 |
| DELETE | /tasks/:id   | 204     | 404      |

## How persistence was proven

Data lives in the named Docker volume `pgdata`, mounted at Postgres's data
directory. To verify it survives restarts:

```bash
# 1. Start the stack
docker compose up -d

# 2. Create a row
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Persist me"}'

# 3. Confirm it's there
curl http://localhost:3000/tasks

# 4. Restart BOTH the app and the database container
docker compose restart
#    (or a full teardown that keeps the volume:)
# docker compose down && docker compose up -d

# 5. The row is still there — data survived the restart
curl http://localhost:3000/tasks
```

Because the volume is separate from the container filesystem, stopping and
recreating the containers does not touch the data. Only `docker compose down -v`
(which explicitly removes the volume) clears it.

## Honesty note (required by the assignment)

Swapping from the in-memory store to Postgres changed exactly one thing in the
application: a new repository file plus the selector pointing at it. The service
logic and the HTTP routes (`src/routes.js`) were **not** modified. The same
requests, bodies, and responses work against either backend.

## Verification done

Both repositories were tested against the same request sequence:

- the routes were exercised end-to-end with the in-memory repository (all status
  codes: 200 / 201 / 400 / 404 / 204);
- the Postgres repository's real SQL (`SERIAL`, parameterized `$1`, `RETURNING`,
  `COALESCE` for partial updates) was run against a Postgres engine and returned
  results identical in shape to the in-memory repository.

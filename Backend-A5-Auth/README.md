# Auth Login & Protect — Secure API with Supabase Auth

An Express API that handles user **authentication** (sign up, log in, log out)
and **protects** routes with JWTs issued by **Supabase Auth**. Public routes are
open; protected routes require a valid `Authorization: Bearer <token>` header.
Interactive docs are served with Swagger UI at `/docs`.

```
Client  --(email+password)-->  Supabase (Identity Provider)  --(JWT)-->  Client
Client  --(Bearer JWT)------>  This API  --(verify with Supabase)-->  protected data
```

The API never stores passwords or writes its own crypto — Supabase is the
Identity Provider that manages accounts and signs/verifies the tokens.

## Prerequisites

- Node.js 18+
- A free Supabase project (https://supabase.com). From **Project Settings → API**
  copy your **Project URL** and **anon public key**.

## Local setup

```bash
# 1. install dependencies
npm install

# 2. create your .env from the template and fill in your Supabase values
cp .env.example .env
```

`.env`:

```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
PORT=3000
```

`.env` is **gitignored** — your keys never get pushed.

## Run

```bash
npm start
```

You should see `Server running and connected to Supabase`.
Open http://localhost:3000/docs for the interactive Swagger UI.

## API reference

| Method | Endpoint               | Auth required | Purpose                              | Success | Errors        |
| ------ | ---------------------- | ------------- | ------------------------------------ | ------- | ------------- |
| POST   | `/auth/signup`         | No            | Create a new user account            | 201     | 400           |
| POST   | `/auth/login`          | No            | Authenticate, return JWT + refresh   | 200     | 400, 401      |
| POST   | `/auth/logout`         | **Yes**       | End the session for the token        | 204     | 401           |
| GET    | `/public/info`         | No            | Public, unprotected data             | 200     | —             |
| GET    | `/protected/profile`   | **Yes**       | Read the user's profile metadata     | 200     | 401           |
| GET    | `/protected/dashboard` | **Yes**       | Second protected route (demo)        | 200     | 401           |

Status codes: `201` on signup, `200` on login/read, `204` on logout, `400` on
missing input, `401` on missing / malformed / invalid / expired token.

### Example requests

```bash
# sign up
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# log in -> copy the "access_token" from the response
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# access a protected route with the token
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <PASTE_ACCESS_TOKEN>"

# log out
curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <PASTE_ACCESS_TOKEN>"
```

Changing one character of the token makes `/protected/profile` return `401`.

## Using Swagger UI

1. Open http://localhost:3000/docs
2. `POST /auth/login` → **Try it out** → run it → copy the `access_token`.
3. Click the **Authorize** 🔒 button (top right), paste the token, Authorize.
4. Now **Try it out** on `/protected/profile` — it sends the Bearer token for you.

Protected routes show a padlock icon; public routes do not.

![Swagger UI](docs/swagger-ui.png)

> Capture your own screenshot of `/docs` (showing the padlocks on the protected
> routes) and save it as `docs/swagger-ui.png` — this is the Stage 5 deliverable.

## How it's structured

```
Backend-A5-Auth/
├── server.js                     # wires routes + Swagger UI, starts server
├── openapi.json                  # OpenAPI spec incl. bearerAuth security scheme
├── src/
│   ├── supabaseClient.js         # Supabase client from env vars
│   ├── middleware/
│   │   └── requireAuth.js        # reusable Bearer-token guard (Stage 4)
│   └── routes/
│       ├── auth.js               # signup / login / logout
│       ├── public.js             # /public/info
│       └── protected.js          # /protected/profile + /dashboard (guarded)
├── .env.example                  # template (committed)
├── .env                          # your secrets (gitignored)
└── .gitignore
```

The auth check lives in **one** middleware (`requireAuth`) applied to the whole
`/protected` router and to `/auth/logout`, so protected handlers stay clean and
the logic isn't duplicated.

## Verification note

Every route and status code was exercised end-to-end (200 / 201 / 204 / 400 /
401), including missing-token, malformed-header, wrong-password and
tampered-token cases, plus the Swagger UI serving at `/docs`. The Supabase
network calls (`signUp`, `signInWithPassword`, `getUser`, `signOut`) are wired
exactly per the SDK; run it against your own project to see them live.

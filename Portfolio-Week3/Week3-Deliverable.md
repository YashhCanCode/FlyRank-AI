# Week 3 — Map It & Give It a Face
**Yash · Backend AI Engineering track**
The one action everything ladders up to: **hire me full-time (backend/AI engineering).**

---

## 1. The one-line claim

**Process (AI gave options, I chose):** I asked for ten, then rejected the vague and the clever-but-empty ones. Notes below each.

1. Backend APIs where the database is just a detail — swap it, and the contract still holds.
2. I build backends where "change the database" is a one-file change, not a rewrite.
3. Backend systems that keep their promises when everything behind them changes.
4. APIs that stay stable while the storage underneath them evolves. *(too abstract)*
5. Reliable, layered backends where the hard changes stay small. *(vague — "reliable" says nothing)*
6. I turn "it works on my machine" into "it runs anywhere, and the data survives."
7. Backend engineering where the interface is a promise and storage is a detail.
8. Clean, containerized backends where persistence is solved, not hoped for. *(buzzword-y)*
9. APIs that don't flinch when the database, the host, or the scale changes. *(trying too hard)*
10. Backend APIs designed to outlive their first database. *(clever but unclear on first read)*

**Chosen and sharpened:**

> **I build backend APIs where the database is just a detail — swap it, and the contract still holds.**

Short display version for the hero: **"The database is a detail. The API is the promise."**

*Why this one:* it's the literal, provable story of my actual work — the same Task Manager API kept an identical contract while its storage went from an in-memory array → SQLite → Postgres in Docker. It's a claim I can back with screenshots, not adjectives.

---

## 2. The content map

**Shape:** one focused single-page site, plus one deeper case-study page. Every page ends by pointing at the one action: **Get in touch (hire me).**

### Home (single page)

| Order | Section | What's in it | Call to action |
|------|---------|--------------|----------------|
| 1 | **Hero** | The one-line claim + short tagline. Name, one-sentence "what I do." | Primary: **Get in touch** · Secondary: **View on GitHub** |
| 2 | **Featured project — Task Manager API** *(strongest case, leads)* | The storage-swap story: same API, three backends. 2–3 real screenshots + the architecture diagram. One line of results (endpoints, persistence proven). | **Read the case study** |
| 3 | **Selected work** | 1–2 placeholder project cards to fill in (title, one-line proof, tags, link). | **See the code** (per card) |
| 4 | **About** | 2–3 sentences, real photo. Who I am, what I'm looking for (full-time backend role). | — |
| 5 | **Contact / footer** | Email, GitHub, LinkedIn, resume PDF. | Primary: **Email me** |

### Case study page — Task Manager API

| Order | Section | What's in it |
|------|---------|--------------|
| 1 | Problem & goal | Build a CRUD API whose storage can change without breaking clients. |
| 2 | The through-line | in-memory → SQLite → Postgres in Docker; the API never changed. |
| 3 | How it works | Architecture diagram (Client → API → repository → DB), the repository pattern. |
| 4 | Proof | Real captures: `docker compose up`, `curl` responses, DB viewer, persistence check. |
| 5 | What I'd do next | Auth, tests, deploy. | 
| — | CTA | **Get in touch** / **View repo** |

### Still need to gather (honest list — so build week isn't blocked)

- [ ] **Public GitHub repo URL** (make the FlyRank repo public; confirm READMEs render).
- [ ] **Real screenshots:** `docker compose up` terminal, `curl GET /tasks` JSON, DB Browser table, a persistence before/after.
- [ ] **A live demo or short GIF** of the API responding (optional but strong).
- [ ] **Professional photo** for the About section.
- [ ] **Resume PDF** + **LinkedIn URL**.
- [ ] **Numbers to cite:** endpoint count (5 CRUD routes), "data survives restart," stages shipped (A1–A3).
- [ ] Content for the **1–2 placeholder projects**.

---

## 3. The identity kit (decide once, repeat everywhere)

### Type
- **Headings:** Space Grotesk (Google Fonts) — precise, modern, a subtly technical feel.
- **Body / UI:** Inter (Google Fonts) — neutral and highly readable at small sizes.
- Both are free on Google Fonts. If I want it even calmer, Inter alone at two weights also works.

### Palette (near-black text, near-white background, one calm accent)

| Role | Hex | Use |
|------|-----|-----|
| Ink / text | `#18181B` | Body text, headings on light background |
| Background | `#FAFAFA` | Page background |
| Primary | `#0F172A` | Nav, footer, strong headings, logo ground |
| Accent | `#0F766E` | Links, buttons, the one highlight (passes WCAG AA on white) |

Roughly four colors, on purpose. The accent is a muted teal, not a loud one, so my screenshots stay the most colorful thing on the page.

### Logo / favicon
A monogram **"Y"** in white on a deep-slate rounded square, with a small teal underscore (a quiet nod to the terminal / backend). Provided as `favicon.svg`, `favicon.ico`, `favicon-32.png`, `favicon-512.png`, and `apple-touch-icon.png`.

### Style note (paste this back in every build)
> **Fonts:** Space Grotesk for headings, Inter for body. **Colors:** text `#18181B`, background `#FAFAFA`, primary `#0F172A`, links/buttons `#0F766E`. **Mood:** calm, engineered, confident — lots of whitespace, one accent only, the work is always the loudest thing on the page.

*(A visual version of this kit is in `images/identity-palette.png`.)*

---

## 4. The image set (curate ruthlessly)

**Real captures — the proof (use these, not AI):**
- `docker compose up` terminal starting the app + Postgres.
- `curl GET /tasks` returning JSON.
- DB viewer showing the `tasks` table (I already have `db-screenshot.png` from A2).
- A persistence check: a row created, container restarted, row still there.

**Connective tissue — one consistent style, brand colors:**
- `images/architecture-diagram.png` — Client → Express API → Postgres (in the palette above).
- `images/identity-palette.png` — the palette swatch strip.

**You (real photo, not generated):**
- One clean headshot for the About section — *to add.*

### Rejection note (the actual skill)
> I generated three abstract "hero" backgrounds — glowing circuit boards and a network-of-nodes motif — to sit behind the headline. All three had the melted, fake-glass **AI-slop** look, and worse, they competed with my screenshots for attention. I rejected all three. A plain headline over whitespace, with the real terminal and DB captures below it, looks more intentional and keeps the focus on the work. The one generated image I kept is the architecture diagram, because it clarifies the project instead of decorating it — and I rebuilt it in my own palette so it belongs with everything else.

---

*Assets accompanying this submission: `favicon.svg` / `.ico` / PNGs, `identity-palette.png`, `architecture-diagram.png` (all in the `images/` folder), plus the A2 database screenshot as a real capture.*

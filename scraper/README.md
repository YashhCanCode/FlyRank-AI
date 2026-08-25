# The Polite Scraper — Books to Scrape

A small, polite scraping pipeline that collects the first **3 catalogue pages**
of [Books to Scrape](https://books.toscrape.com), visits all **60 book pages**,
turns messy HTML into clean, schema-checked JSON, survives a broken page without
crashing, and writes an honest run report.

Pipeline shape: **fetch → extract → normalize → validate → store → report.**

## Target classification (Stage 0)

- **Site:** https://books.toscrape.com — a public **sandbox built specifically for
  scraping practice** (its own homepage says so). It is the only site this code touches.
- **Scope:** the first **3 catalogue pages only** → the 60 books they list.
- **Data collected:** per book — title, product URL, price, availability, rating,
  description, and provenance (source page + fetch time). Nothing behind a login.
- **robots.txt:** requesting `https://books.toscrape.com/robots.txt` returned **no
  rules** (empty/no disallow directives) at last check. *A missing/empty file is not
  positive permission — the sandbox's stated purpose is. Confirm the status yourself
  and record it.*
- **Why appropriate:** the site exists to be scraped, the scope is tiny, and the
  requests are slow and identified.

> **I will not reuse this code on another site without checking its rules and terms first.**

## Politeness rules this scraper follows

- **Identifies itself:** every real request sends a `User-Agent` naming the project
  with a contact link (`FlyRankInternshipA9/1.0 (+repo-url)`) — set it to your repo in `src/config.js`.
- **Goes slowly:** at least **600 ms** between real requests (cached reads have no delay).
- **Times out:** requests give up after **8 s** instead of hanging forever.
- **Checks status:** only `200` is treated as HTML; anything else is a failed fetch.
- **Caches:** the first fetch of a URL is saved to `cache/`; while developing, every
  later run reads the saved copy, so the site is only ever touched once per URL.
- **Retries gently:** one retry on a timeout or `5xx`; **never** retries `404` (gone)
  or `403` (refused).

## Install & run

Requires Node.js 20+ (built-in `fetch`).

```bash
cd scraper
npm install            # cheerio + zod
npm start              # = node src/index.js
```

Outputs land in `output/`:
- `books.json` — exactly 60 unique, validated records.
- `errors.json` — any record that failed validation or fetch, with the reason.
- `run-report.json` — honest counts for the run.

Run tests (no network needed — they use saved fixtures):

```bash
npm test               # 8 unit tests: price parse, URL resolve, missing desc, schema, dedupe
```

Prove failure-handling (Stage 5) without hammering the site — inject one fake URL:

```bash
INJECT_FAKE=1 npm start   # run finishes, books.json still 60, run-report shows failed_pages: 1
```

## Record schema

Validated with Zod (`src/schema.js`) before anything is stored:

| Field | Type | Notes |
|-------|------|-------|
| title | string | required |
| product_url | string (https URL) | canonical identity |
| price_text | string | raw, e.g. `"£51.77"` |
| price_gbp | number > 0 | normalized, e.g. `51.77` |
| availability_text | string | e.g. `"In stock (22 available)"` |
| rating_text | string \| null | e.g. `"Three"` |
| rating | integer 0–5 \| null | normalized from rating_text |
| description | string \| null | `null` when the page has none — never invented |
| source_page | string (URL) | provenance: which catalogue page |
| fetched_at | ISO datetime | provenance: when it was fetched |

The raw text (`price_text`) and the clean value (`price_gbp`) live side by side.

## Sample run-report.json

```json
{
  "started_at": "2026-08-25T10:00:00.000Z",
  "finished_at": "2026-08-25T10:00:41.000Z",
  "duration_ms": 41000,
  "catalogue_pages": 3,
  "discovered": 60,
  "unique_urls": 60,
  "detail_pages_fetched": 60,
  "cache_hits": 0,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```
*(Replace with a real report from your own run.)*

## Why no browser was needed

The data is already in the HTML the server sends, so a plain HTTP request sees
everything — a headless browser would only add startup time and memory for no gain.

## Ethics note

Use an official API when one exists; never bypass logins, paywalls, or blocks;
collect only what you need, and go slowly. This project only touches a sandbox that
exists for practice.

## Known limitation

The selectors are tuned to the current Books to Scrape markup (`.product_main`,
`p.price_color`, the `#product_description` sibling). If the site's HTML changes,
the extractor would need updating — which is exactly why every record keeps its
provenance, and why validation sends anything unexpected to `errors.json` instead
of silently storing bad data.

## How it was verified

8 unit tests pass against saved HTML fixtures (price normalization, relative→absolute
URL resolution, missing-description→null, schema accept/reject, dedupe/idempotency),
plus an offline end-to-end run (cache-seeded) confirming discovery, extraction,
validation, and a stable record count across reruns.

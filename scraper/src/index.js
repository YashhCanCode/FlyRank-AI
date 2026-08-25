// Orchestrator: fetch -> extract -> normalize -> validate -> store -> report.
// Run: node src/index.js      (set INJECT_FAKE=1 to add one broken URL on purpose)
const fs = require("fs");
const path = require("path");
const { START_URL, MAX_CATALOGUE_PAGES } = require("./config");
const { politeFetch } = require("./fetch");
const { parseCatalogue, parseBook } = require("./parse");
const { priceToNumber, ratingToNumber } = require("./normalize");
const { BookSchema } = require("./schema");

const OUT_DIR = path.join(__dirname, "..", "output");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function discoverBookUrls() {
  let pageUrl = START_URL;
  let pages = 0;
  const seen = new Set();
  const bookToSource = new Map(); // book url -> the catalogue page it came from

  while (pageUrl && pages < MAX_CATALOGUE_PAGES) {
    const { html } = await politeFetch(pageUrl);
    const { bookUrls, nextUrl } = parseCatalogue(html, pageUrl);
    pages++;
    for (const u of bookUrls) {
      if (!seen.has(u)) {
        seen.add(u);
        bookToSource.set(u, pageUrl);
      }
    }
    pageUrl = nextUrl; // let the site tell us the next page; don't hardcode
  }
  return { pages, discovered: seen.size, bookToSource };
}

async function run() {
  const started = new Date();
  const report = {
    started_at: started.toISOString(),
    finished_at: null,
    duration_ms: 0,
    catalogue_pages: 0,
    discovered: 0,
    unique_urls: 0,
    detail_pages_fetched: 0,
    cache_hits: 0,
    valid_records: 0,
    invalid_records: 0,
    failed_pages: 0,
  };

  // Stage 2: discover
  const { pages, discovered, bookToSource } = await discoverBookUrls();
  report.catalogue_pages = pages;
  report.discovered = discovered;

  let urls = [...bookToSource.keys()];
  // Stage 5 proof: optionally inject one broken URL to show the run survives.
  if (process.env.INJECT_FAKE) {
    const fake = "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html";
    urls.push(fake);
    bookToSource.set(fake, START_URL);
  }
  report.unique_urls = new Set(urls).size;

  const valid = [];
  const invalid = [];

  // Stage 3 + 5: fetch each book in isolation so one bad page can't kill the run.
  for (const url of urls) {
    try {
      const { html, fromCache, status } = await politeFetch(url);
      report.detail_pages_fetched++;
      if (fromCache) report.cache_hits++;
      void status;

      const raw = parseBook(html, url);
      const record = {
        ...raw,
        price_gbp: priceToNumber(raw.price_text),
        rating: ratingToNumber(raw.rating_text),
        source_page: bookToSource.get(url),
        fetched_at: new Date().toISOString(),
      };

      // Stage 4: validate before storing. Failures are set aside with a reason.
      const parsed = BookSchema.safeParse(record);
      if (parsed.success) {
        valid.push(parsed.data);
      } else {
        invalid.push({ product_url: url, reason: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), record });
      }
    } catch (err) {
      report.failed_pages++;
      invalid.push({ product_url: url, reason: `fetch failed: ${err.message}` });
      console.warn(`SKIP ${url} — ${err.message}`);
    }
  }

  // Idempotency: dedupe by canonical product_url and sort, so reruns are stable.
  const byUrl = new Map(valid.map((r) => [r.product_url, r]));
  const books = [...byUrl.values()].sort((a, b) => a.product_url.localeCompare(b.product_url));

  report.valid_records = books.length;
  report.invalid_records = invalid.length;
  const finished = new Date();
  report.finished_at = finished.toISOString();
  report.duration_ms = finished - started;

  fs.writeFileSync(path.join(OUT_DIR, "books.json"), JSON.stringify(books, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "errors.json"), JSON.stringify(invalid, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "run-report.json"), JSON.stringify(report, null, 2));

  console.log("\n--- run report ---");
  console.log(JSON.stringify(report, null, 2));
  console.log(`\ncatalogue_pages=${report.catalogue_pages} discovered=${report.discovered} unique_urls=${report.unique_urls}`);
  console.log(`detail_pages=${report.detail_pages_fetched} valid=${report.valid_records} invalid=${report.invalid_records} failed_pages=${report.failed_pages}`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

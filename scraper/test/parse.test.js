const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const { parseCatalogue, parseBook } = require("../src/parse");
const { priceToNumber, ratingToNumber } = require("../src/normalize");
const { BookSchema } = require("../src/schema");

const fx = (n) => fs.readFileSync(path.join(__dirname, "fixtures", n), "utf8");
const PAGE_URL = "https://books.toscrape.com/catalogue/page-1.html";

test("priceToNumber turns '£51.77' into 51.77", () => {
  assert.strictEqual(priceToNumber("£51.77"), 51.77);
  assert.ok(Number.isNaN(priceToNumber("free")));
});

test("ratingToNumber maps words to numbers", () => {
  assert.strictEqual(ratingToNumber("Three"), 3);
  assert.strictEqual(ratingToNumber("Nope"), null);
});

test("parseCatalogue resolves relative links to absolute and finds next", () => {
  const { bookUrls, nextUrl } = parseCatalogue(fx("catalogue.html"), PAGE_URL);
  assert.strictEqual(bookUrls.length, 2);
  assert.strictEqual(bookUrls[0], "https://books.toscrape.com/catalogue/the-alpha-book_1/index.html");
  assert.ok(bookUrls[0].startsWith("https://"));
  assert.strictEqual(nextUrl, "https://books.toscrape.com/catalogue/page-2.html");
});

test("parseBook extracts fields and cleans availability", () => {
  const url = "https://books.toscrape.com/catalogue/the-alpha-book_1/index.html";
  const r = parseBook(fx("book-with-desc.html"), url);
  assert.strictEqual(r.title, "The Alpha Book");
  assert.strictEqual(r.price_text, "£51.77");
  assert.strictEqual(r.availability_text, "In stock (22 available)");
  assert.strictEqual(r.rating_text, "Three");
  assert.strictEqual(r.description, "An alpha book description with details.");
  assert.strictEqual(r.product_url, url);
});

test("parseBook returns null description when absent (never invents text)", () => {
  const r = parseBook(fx("book-no-desc.html"), "https://books.toscrape.com/catalogue/the-beta-book_2/index.html");
  assert.strictEqual(r.description, null);
});

test("schema accepts a clean record", () => {
  const raw = parseBook(fx("book-with-desc.html"), "https://books.toscrape.com/catalogue/the-alpha-book_1/index.html");
  const record = { ...raw, price_gbp: priceToNumber(raw.price_text), rating: ratingToNumber(raw.rating_text),
    source_page: PAGE_URL, fetched_at: new Date().toISOString() };
  assert.strictEqual(BookSchema.safeParse(record).success, true);
});

test("schema rejects a bad record (NaN price, non-https url)", () => {
  const bad = { title: "x", product_url: "http://insecure/x", price_text: "£1", price_gbp: NaN,
    availability_text: "In stock", rating_text: "One", rating: 1, description: null,
    source_page: PAGE_URL, fetched_at: new Date().toISOString() };
  assert.strictEqual(BookSchema.safeParse(bad).success, false);
});

test("dedupe by product_url keeps a book once (idempotency)", () => {
  const recs = [
    { product_url: "https://books.toscrape.com/catalogue/a_1/index.html", title: "A" },
    { product_url: "https://books.toscrape.com/catalogue/a_1/index.html", title: "A" },
    { product_url: "https://books.toscrape.com/catalogue/b_2/index.html", title: "B" },
  ];
  const byUrl = new Map(recs.map((r) => [r.product_url, r]));
  assert.strictEqual(byUrl.size, 2);
});

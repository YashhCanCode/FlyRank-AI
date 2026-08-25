// Polite fetching with caching, timeout, status checks, delay, and one retry.
// While developing you restart the script constantly — the cache means the
// real site is only ever touched once per URL.
const fs = require("fs");
const path = require("path");
const { USER_AGENT, TIMEOUT_MS, DELAY_MS, RETRY_DELAY_MS, MAX_RETRIES } = require("./config");

const CACHE_DIR = path.join(__dirname, "..", "cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Spacing gate: never send two REAL requests closer than DELAY_MS apart.
let lastRequestAt = 0;
async function respectDelay() {
  const wait = DELAY_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

// Turn a URL into a stable, readable cache filename.
function cacheNameFromUrl(url) {
  const { pathname } = new URL(url);
  const pageMatch = pathname.match(/page-(\d+)\.html$/);
  if (pageMatch) return `catalogue-page-${pageMatch[1]}.html`;
  // book detail: use the folder slug, e.g. a-light-in-the-attic_1000
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1] || "page";
  return `${slug}.html`;
}

// Error raised for non-200 responses, tagged with the status code.
class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
  }
}

// Fetch a URL politely. Reads from cache if present. Returns { html, fromCache }.
async function politeFetch(url) {
  const name = cacheNameFromUrl(url);
  const cachePath = path.join(CACHE_DIR, name);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, "utf8");
    console.log(`CACHE HIT ${name} (${Buffer.byteLength(html)} bytes)`);
    return { html, fromCache: true, status: 200 };
  }

  let attempt = 0;
  while (true) {
    attempt++;
    await respectDelay();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status !== 200) {
        // 404 (gone) and 403 (refused) must NOT be retried.
        if (res.status === 404 || res.status === 403) throw new HttpError(res.status, url);
        // 5xx: retry once, then give up.
        if (res.status >= 500 && attempt <= MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw new HttpError(res.status, url);
      }

      const html = await res.text();
      fs.writeFileSync(cachePath, html);
      console.log(`FETCH ${name} (${Buffer.byteLength(html)} bytes)`);
      return { html, fromCache: false, status: 200 };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === "AbortError";
      const isNetwork = !isTimeout && err.status === undefined;
      // Retry once on timeout or a raw network error; never on 404/403/other 4xx.
      if ((isTimeout || isNetwork) && attempt <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }
}

module.exports = { politeFetch, cacheNameFromUrl, CACHE_DIR, HttpError };

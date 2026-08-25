// Pure parsing functions (no network) — easy to unit-test against fixtures.
const cheerio = require("cheerio");

// Parse a catalogue page: return this page's book URLs (absolute) and the
// absolute "next" page URL (or null). URLs are resolved with the URL API,
// never by gluing strings together.
function parseCatalogue(html, pageUrl) {
  const $ = cheerio.load(html);
  const bookUrls = [];
  $("article.product_pod h3 a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) bookUrls.push(new URL(href, pageUrl).href);
  });
  const nextHref = $("li.next a").attr("href");
  const nextUrl = nextHref ? new URL(nextHref, pageUrl).href : null;
  return { bookUrls, nextUrl };
}

// Parse a single book detail page into the raw record (8 fields minus the
// provenance ones, which the caller adds). Aims selectors at .product_main,
// not the whole document. Missing description -> null (never invented).
function parseBook(html, productUrl) {
  const $ = cheerio.load(html);
  const main = $(".product_main");

  const title = main.find("h1").first().text().trim();
  const price_text = main.find("p.price_color").first().text().trim();
  const availability_text = main.find("p.instock.availability").first().text().replace(/\s+/g, " ").trim();

  // rating is encoded as a class, e.g. "star-rating Three"
  const ratingClass = main.find("p.star-rating").attr("class") || "";
  const rating_text = ratingClass.replace("star-rating", "").trim() || null;

  // description is the <p> immediately following the #product_description header.
  const descEl = $("#product_description").nextAll("p").first();
  const description = descEl.length ? descEl.text().trim() : null;

  return { title, price_text, availability_text, rating_text, description, product_url: productUrl };
}

module.exports = { parseCatalogue, parseBook };

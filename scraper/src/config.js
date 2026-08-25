// Central config for the scraper. Politeness knobs live here.
module.exports = {
  START_URL: "https://books.toscrape.com/catalogue/page-1.html",
  MAX_CATALOGUE_PAGES: 3,
  // A polite robot introduces itself with a contact link.
  USER_AGENT: "FlyRankInternshipA9/1.0 (+https://github.com/your-username/your-repo)",
  TIMEOUT_MS: 8000,     // give up instead of hanging forever
  DELAY_MS: 600,        // >= 500ms between REAL requests (cache is free)
  RETRY_DELAY_MS: 1000, // wait before the single retry
  MAX_RETRIES: 1,       // retry once on timeout / 5xx only
};

// Normalization: turn messy strings into clean, program-friendly values.
// The raw text is always kept alongside the clean value.

// "£51.77" -> 51.77 (a real number). Returns NaN if nothing numeric is found,
// so the schema step can reject it instead of storing garbage.
function priceToNumber(priceText) {
  if (typeof priceText !== "string") return NaN;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

// "Three" -> 3 (words used by books.toscrape). Returns null if unknown.
const WORDS = { Zero: 0, One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };
function ratingToNumber(ratingText) {
  return ratingText != null && ratingText in WORDS ? WORDS[ratingText] : null;
}

module.exports = { priceToNumber, ratingToNumber };

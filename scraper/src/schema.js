// The record schema — written once, every record checked against it before
// storage. A web page is untrusted input; nothing gets into books.json until
// it passes here.
const { z } = require("zod");

const BookSchema = z.object({
  title: z.string().min(1),
  product_url: z.string().url().startsWith("https://"),
  price_text: z.string().min(1),
  price_gbp: z.number().positive(),
  availability_text: z.string().min(1),
  rating_text: z.string().nullable(),
  rating: z.number().int().min(0).max(5).nullable(),
  description: z.string().nullable(), // optional content -> null allowed
  source_page: z.string().url(),
  fetched_at: z.string().datetime(),
});

module.exports = { BookSchema };

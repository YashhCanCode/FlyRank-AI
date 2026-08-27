// Pure test of the HTML builder (no DB, no browser needed).
const test = require("node:test");
const assert = require("node:assert");
const { buildReportHtml } = require("../src/html");

const data = {
  generatedAt: "2026-08-27T10:00:00Z",
  orderCount: 200,
  totalRevenue: 20163.54,
  topProducts: [{ product: "Widget", orders: 41, revenue: 4322.08 }],
  ordersPerDay: [{ day: "2026-08-21", orders: 6, revenue: 498.25 }],
  allOrders: [
    { id: 1, customer: "Ava", product: "Widget", amount: 51.77, created_at: "2026-08-21" },
    { id: 2, customer: "Ben", product: "Gizmo", amount: 12.5, created_at: "2026-08-22" },
  ],
};

test("builds a full HTML document with both totals", () => {
  const h = buildReportHtml(data);
  assert.ok(h.startsWith("<!DOCTYPE html>"));
  assert.match(h, /Total orders/);
  assert.match(h, /\$20163\.54/);
});

test("includes print CSS for clean page breaks", () => {
  const h = buildReportHtml(data);
  assert.match(h, /break-inside: avoid/);
  assert.match(h, /table-header-group/); // header repeats on each page
  assert.match(h, /<thead>/);
});

test("renders one <tr> per order plus header/section rows", () => {
  const h = buildReportHtml(data);
  const rows = (h.match(/<tr>/g) || []).length;
  // 2 orders + 1 top + 1 day + 3 header rows = 7
  assert.strictEqual(rows, 7);
});

test("escapes HTML in data (no injection from values)", () => {
  const h = buildReportHtml({ ...data, allOrders: [{ id: 1, customer: "<script>", product: "x", amount: 1, created_at: "d" }] });
  assert.ok(h.includes("&lt;script&gt;"));
  assert.ok(!h.includes("<script>x")); // raw tag not present from data
});

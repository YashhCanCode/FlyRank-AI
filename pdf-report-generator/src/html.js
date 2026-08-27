// Builds the report page as an HTML string. Playwright will "print" this to PDF.
// The print CSS is what keeps rows whole across page breaks and repeats the header.
function money(n) { return "$" + Number(n).toFixed(2); }
function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

function buildReportHtml(data) {
  const date = new Date(data.generatedAt).toISOString().slice(0, 10);

  const topRows = data.topProducts.map(
    (p) => `<tr><td>${esc(p.product)}</td><td class="num">${p.orders}</td><td class="num">${money(p.revenue)}</td></tr>`
  ).join("");

  const dayRows = data.ordersPerDay.map(
    (d) => `<tr><td>${esc(d.day)}</td><td class="num">${d.orders}</td><td class="num">${money(d.revenue)}</td></tr>`
  ).join("");

  const allRows = data.allOrders.map(
    (o) => `<tr><td class="num">${o.id}</td><td>${esc(o.customer)}</td><td>${esc(o.product)}</td><td class="num">${money(o.amount)}</td><td>${esc(o.created_at)}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { font-family: -apple-system, Arial, sans-serif; }
    body { color: #18181b; margin: 32px; }
    h1 { font-size: 22px; margin: 0 0 2px; color: #0f172a; }
    .muted { color: #71717a; font-size: 12px; }
    .cards { display: flex; gap: 16px; margin: 20px 0; }
    .card { border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 16px; }
    .card .label { font-size: 11px; text-transform: uppercase; color: #71717a; }
    .card .value { font-size: 24px; font-weight: 700; color: #0f766e; }
    h2 { font-size: 14px; margin: 22px 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ececec; }
    th { background: #f4f4f5; }
    td.num, th.num { text-align: right; }

    /* --- print CSS: the whole point of Stage 3 --- */
    @page { size: A4; margin: 16mm; }
    thead { display: table-header-group; }  /* repeat header on every page */
    tr { break-inside: avoid; }             /* never slice a row across a page */
  </style></head><body>
    <h1>Sales Report</h1>
    <div class="muted">Generated ${date}</div>

    <div class="cards">
      <div class="card"><div class="label">Total orders</div><div class="value">${data.orderCount}</div></div>
      <div class="card"><div class="label">Total revenue</div><div class="value">${money(data.totalRevenue)}</div></div>
    </div>

    <h2>Top 5 products by revenue</h2>
    <table><thead><tr><th>Product</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
      <tbody>${topRows}</tbody></table>

    <h2>Orders per day (last 7 days)</h2>
    <table><thead><tr><th>Day</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead>
      <tbody>${dayRows}</tbody></table>

    <h2>All orders (${data.allOrders.length})</h2>
    <table><thead><tr><th class="num">#</th><th>Customer</th><th>Product</th><th class="num">Amount</th><th>Date</th></tr></thead>
      <tbody>${allRows}</tbody></table>
  </body></html>`;
}

module.exports = { buildReportHtml };

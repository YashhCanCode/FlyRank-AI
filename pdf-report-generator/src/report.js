// Turns 200 rows into the handful of numbers a report actually shows.
const { db } = require("./db");

function getReportData() {
  const totals = db.prepare(
    "SELECT COUNT(*) AS order_count, ROUND(COALESCE(SUM(amount), 0), 2) AS total_revenue FROM orders"
  ).get();

  const topProducts = db.prepare(`
    SELECT product, ROUND(SUM(amount), 2) AS revenue, COUNT(*) AS orders
    FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5
  `).all();

  const ordersPerDay = db.prepare(`
    SELECT created_at AS day, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS revenue
    FROM orders
    WHERE created_at >= date('now', '-6 days')
    GROUP BY created_at ORDER BY created_at
  `).all();

  const allOrders = db.prepare(
    "SELECT id, customer, product, amount, created_at FROM orders ORDER BY created_at DESC, id DESC"
  ).all();

  return {
    generatedAt: new Date().toISOString(),
    orderCount: totals.order_count,
    totalRevenue: totals.total_revenue,
    topProducts,
    ordersPerDay,
    allOrders,
  };
}

module.exports = { getReportData };

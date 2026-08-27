// Seeds ~200 random orders. Deletes existing rows first, so running it twice
// leaves exactly one clean copy (a first taste of "safe to run twice").
const { db } = require("./db");

const PRODUCTS = ["Widget", "Gadget", "Gizmo", "Doohickey", "Sprocket", "Thingamajig"];
const CUSTOMERS = ["Ava", "Ben", "Chloe", "Dan", "Ella", "Finn", "Gia", "Hugo", "Iris", "Jack"];
const rand = (n) => Math.floor(Math.random() * n);
const money = () => Math.round((5 + Math.random() * 195) * 100) / 100; // 5.00–200.00

function isoDaysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

db.exec("DELETE FROM orders");
const insert = db.prepare("INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)");
for (let i = 0; i < 200; i++) {
  insert.run(CUSTOMERS[rand(CUSTOMERS.length)], PRODUCTS[rand(PRODUCTS.length)], money(), isoDaysAgo(rand(30)));
}
const { c } = db.prepare("SELECT COUNT(*) AS c FROM orders").get();
console.log(`Seeded ${c} orders.`);

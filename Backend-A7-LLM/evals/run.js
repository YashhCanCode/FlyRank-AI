// Runs every eval case through the live endpoint and scores the key field (category).
// Run the server first (npm start), then: npm run eval
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/triage`;
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "cases.json"), "utf8"));
const PROMPT_VERSION = process.env.PROMPT_VERSION || "triage-v1";

(async () => {
  let pass = 0;
  const failures = [];
  for (const c of cases) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: c.text }),
      });
      const body = await res.json();
      const got = body.category;
      if (res.status === 200 && got === c.expected.category) {
        pass++;
      } else {
        failures.push({ id: c.id, expected: c.expected.category, got: got ?? `HTTP ${res.status}`, text: c.text.slice(0, 60) });
      }
    } catch (e) {
      failures.push({ id: c.id, expected: c.expected.category, got: `error: ${e.message}`, text: c.text.slice(0, 60) });
    }
  }
  console.log(`\nEval (prompt ${PROMPT_VERSION}, ${new Date().toISOString().slice(0, 10)}): ${pass}/${cases.length} on 'category'`);
  if (failures.length) {
    console.log("Failed cases:");
    for (const f of failures) console.log(`  #${f.id} expected=${f.expected} got=${f.got}  "${f.text}..."`);
  }
})();

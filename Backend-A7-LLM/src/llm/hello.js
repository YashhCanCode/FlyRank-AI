// Stage 0 throwaway: prove one sentence comes out of the model from your machine.
// Run: node --env-file=.env src/llm/hello.js  -> should print something containing "ready"
const { chat } = require("./client");
(async () => {
  const r = await chat([{ role: "user", content: "Reply with exactly the word: ready" }]);
  console.log(r.content);
})().catch((e) => { console.error("hello failed:", e.message); process.exit(1); });

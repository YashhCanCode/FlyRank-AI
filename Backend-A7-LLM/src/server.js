// Wires the endpoint into an Express app. Run: npm start (node --env-file=.env ...).
const express = require("express");
const createTriageRoute = require("./routes/triage");

const app = express();
app.use(express.json());
app.use("/", createTriageRoute());

app.get("/", (req, res) => {
  res.json({ message: "A17 — LLM triage endpoint. POST /triage with { text }." });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}  (STUB=${process.env.LLM_STUB} ENABLED=${process.env.LLM_ENABLED})`);
  });
}
module.exports = app;

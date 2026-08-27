// Wires the real Inngest client + functions and starts the server.
const { createApp } = require("./app");
const { inngest, functions } = require("./inngest");

const PORT = process.env.PORT || 3000;
const app = createApp({ inngest, functions });
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  console.log(`Start the worker in another terminal:  npm run inngest`);
});

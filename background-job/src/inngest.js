const { Inngest } = require("inngest");
const store = require("./store");
const { buildReport } = require("./report");

const inngest = new Inngest({ id: "report-api" });

// Stage 1 — a first function: sleep 5s, then return a greeting.
const sayHello = inngest.createFunction(
  { id: "say-hello" },
  { event: "test/hello" },
  async ({ step }) => {
    await step.sleep("nap", "5s");
    return "Hello from the background!";
  }
);

// Stage 2 + 3 — the real worker: slow work off the request, with retries.
const makeReport = inngest.createFunction(
  { id: "make-report", retries: 2 }, // Stage 3: short retry show (attempt 1,2,3)
  { event: "report/requested" },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    // Step 1: stand-in for the slow work (8 seconds).
    await step.sleep("do-the-slow-work", "8s");

    // Step 2: build the result and save it. Throws on topic "fail" -> Inngest retries.
    const result = await step.run("build-report", async () => buildReport(topic));

    store.saveResult(id, result);
    return { id, status: "done" };
  }
);

// Stage 4 — cron: nobody asks; the clock triggers it. Logs a status summary.
const heartbeat = inngest.createFunction(
  { id: "heartbeat" },
  { cron: "* * * * *" }, // every minute (testing only; a real one would be daily)
  async () => {
    const c = store.counts();
    console.log(`[heartbeat ${new Date().toISOString()}] pending=${c.pending} done=${c.done} failed=${c.failed}`);
    return c;
  }
);

module.exports = { inngest, functions: [sayHello, makeReport, heartbeat] };

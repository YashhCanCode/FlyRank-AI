// Stand-in for a real slow task (an AI call, a big export). Pure + testable.
function buildReport(topic) {
  if (topic === "fail") throw new Error("The report oven is broken!"); // Stage 3 demo
  return {
    title: `Report about ${topic}`,
    summary: `Here is your generated report on "${topic}". (Pretend an 8-second AI call produced this.)`,
    words: Math.floor(200 + Math.random() * 800),
    builtAt: new Date().toISOString(),
  };
}
module.exports = { buildReport };

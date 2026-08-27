// Turns a node's prompt + the run input into a strict YES/NO decision.
// Mock mode (AI_MOCK=1 or no key) is deterministic, so the app runs with no key.
const { parseYesNo } = require("./parse");

function mockDecision(node, input) {
  // Deterministic pseudo-decision seeded by node id + input, clearly labelled.
  const seed = (node.id + "|" + (input || "")).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 2 === 0 ? "YES" : "NO";
}

async function realDecision(node, input) {
  const OpenAI = require("openai").default || require("openai");
  const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
    timeout: 30000,
    maxRetries: 2,
  });
  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a strict binary classifier. Answer the user's question about the INPUT " +
          "with exactly one word: YES or NO. No punctuation, no explanation.",
      },
      { role: "user", content: `QUESTION: ${node.data?.prompt || node.data?.label}\n\nINPUT:\n${input}` },
    ],
  });
  return parseYesNo(res.choices?.[0]?.message?.content);
}

async function decide(node, input) {
  const useMock = process.env.AI_MOCK === "1" || !process.env.LLM_API_KEY || process.env.LLM_API_KEY === "your_key_here";
  if (useMock) return mockDecision(node, input);
  return realDecision(node, input);
}

module.exports = { decide, mockDecision };

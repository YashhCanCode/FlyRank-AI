// The real provider client. Provider-agnostic: it speaks the OpenAI request shape,
// which OpenRouter and Ollama both accept — only three env vars change.
const OpenAI = require("openai");

let _client;
function getClient() {
  if (!_client) {
    _client = new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      timeout: Number(process.env.LLM_TIMEOUT_MS || 30000), // real timeout, not the 10-min default
      maxRetries: 0, // we run our own explicit retry policy (see callModel.js)
    });
  }
  return _client;
}

// Returns { content, usage, model }.
async function chat(messages) {
  const res = await getClient().chat.completions.create({
    model: process.env.LLM_MODEL,
    messages,
    temperature: 0, // deterministic-ish: same input -> same answer
  });
  return {
    content: res.choices?.[0]?.message?.content ?? "",
    usage: res.usage || {},
    model: res.model || process.env.LLM_MODEL,
  };
}

module.exports = { chat, getClient };

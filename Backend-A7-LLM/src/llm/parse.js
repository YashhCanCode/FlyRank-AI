// Turn a model's raw text into a validated object, or explain why it failed.
// Models like to wrap JSON in ```fences``` or add a preamble — strip that first.
const { TriageSchema } = require("./schema");

function extractJson(text) {
  if (typeof text !== "string") throw new Error("model returned no text");
  let t = text.trim();
  // strip a ```json ... ``` fence if present
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // otherwise grab the first {...} block
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("no JSON object found");
  return t.slice(start, end + 1);
}

// Returns { ok:true, data } or { ok:false, error } — never throws.
function parseAndValidate(rawText) {
  let jsonStr;
  try {
    jsonStr = extractJson(rawText);
  } catch (e) {
    return { ok: false, error: `unparseable: ${e.message}` };
  }
  let obj;
  try {
    obj = JSON.parse(jsonStr);
  } catch (e) {
    return { ok: false, error: `invalid JSON: ${e.message}` };
  }
  const result = TriageSchema.safeParse(obj);
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, data: result.data };
}

module.exports = { parseAndValidate, extractJson };

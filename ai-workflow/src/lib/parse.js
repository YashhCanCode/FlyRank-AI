// Extract a clean YES/NO from whatever the model said. Defaults to NO if truly
// ambiguous (safer to not-branch-forward than to guess YES).
function parseYesNo(text) {
  const t = String(text || "").trim().toUpperCase();
  if (/\bYES\b/.test(t)) return "YES";
  if (/\bNO\b/.test(t)) return "NO";
  if (t.startsWith("Y")) return "YES";
  if (t.startsWith("N")) return "NO";
  return "NO";
}
module.exports = { parseYesNo };

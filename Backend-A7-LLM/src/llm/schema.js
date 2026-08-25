// The output contract. The model's answer is untrusted input; nothing leaves the
// endpoint unless it matches this exactly. .strict() rejects any extra field the
// model invents.
const { z } = require("zod");

const TriageSchema = z.object({
  category: z.enum(["billing", "bug", "feature", "account", "other"]),
  urgency: z.enum(["low", "normal", "high"]),
  suggested_team: z.enum(["billing", "engineering", "product", "support"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(200),
}).strict();

// A hard-coded, schema-valid object for LLM_STUB=1 (build without spending calls).
const STUB_RESULT = {
  category: "other",
  urgency: "low",
  suggested_team: "support",
  confidence: 0.5,
  reason: "Stubbed response (no model call).",
};

module.exports = { TriageSchema, STUB_RESULT };

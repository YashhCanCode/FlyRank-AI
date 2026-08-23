// Reusable auth guard (Stage 4). It runs BEFORE a protected route handler:
//   1. pulls the token out of the `Authorization: Bearer <token>` header,
//   2. asks Supabase to verify it,
//   3. either attaches the user (+ token) to req and calls next(), or
//      short-circuits with a 401.
// Because this lives in one place, every protected route stays clean.
const supabase = require("../supabaseClient");

// Helper: safely extract the token from the Authorization header.
// Returns null if the header is missing or not in "Bearer <token>" form.
function extractBearerToken(req) {
  const header = req.headers["authorization"];
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) return null;
  return parts[1];
}

async function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Verify the token with Supabase.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Make the verified user and token available to downstream handlers.
  req.user = data.user;
  req.token = token;
  next();
}

module.exports = { requireAuth, extractBearerToken };

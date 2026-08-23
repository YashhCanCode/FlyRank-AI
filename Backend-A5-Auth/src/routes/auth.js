// Authentication routes: signup, login, logout.
const express = require("express");
const supabase = require("../supabaseClient");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// POST /auth/signup — create a new user account.
router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    // Supabase rejected the signup (e.g. weak password, already registered).
    return res.status(400).json({ error: error.message });
  }
  return res.status(201).json({ user: data.user });
});

// POST /auth/login — authenticate and return the JWT + refresh token.
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return res.status(401).json({ error: "Invalid login credentials" });
  }

  return res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: data.session.token_type,
    expires_in: data.session.expires_in,
    user: data.user,
  });
});

// POST /auth/logout — protected: ends the session for the presented token.
router.post("/logout", requireAuth, async (req, res) => {
  const { error } = await supabase.auth.signOut(req.token);
  if (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  return res.status(204).end();
});

module.exports = router;

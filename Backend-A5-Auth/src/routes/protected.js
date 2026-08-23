// Protected routes — every route here is guarded by requireAuth middleware,
// so the handlers only run for a valid, verified token.
const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// Guard ALL routes in this router.
router.use(requireAuth);

// GET /protected/profile — return the verified user's secure metadata.
router.get("/profile", (req, res) => {
  const u = req.user;
  res.status(200).json({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
  });
});

// GET /protected/dashboard — a second protected route proving the middleware
// is reusable (Stage 4 checkpoint).
router.get("/dashboard", (req, res) => {
  res.status(200).json({
    message: `Welcome to your dashboard, ${req.user.email}.`,
    user_id: req.user.id,
  });
});

module.exports = router;

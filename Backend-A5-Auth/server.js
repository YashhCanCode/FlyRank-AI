// Entry point. Loads env, wires routes + Swagger UI, and starts the server.
require("dotenv").config();

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");

// Requiring the client here also validates SUPABASE_URL/KEY are present.
const supabase = require("./src/supabaseClient");

const authRoutes = require("./src/routes/auth");
const publicRoutes = require("./src/routes/public");
const protectedRoutes = require("./src/routes/protected");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Swagger UI with the Bearer "Authorize" padlock, served at /docs.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Routes.
app.use("/auth", authRoutes);
app.use("/public", publicRoutes);
app.use("/protected", protectedRoutes);

// Friendly root.
app.get("/", (req, res) => {
  res.json({
    message: "Auth Login & Protect API. See /docs for interactive Swagger UI.",
  });
});

app.listen(PORT, () => {
  console.log("Server running and connected to Supabase");
  console.log(`Listening on http://localhost:${PORT}  (docs at /docs)`);
});

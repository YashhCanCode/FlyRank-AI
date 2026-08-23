// Initializes the Supabase client from environment variables.
// Supabase is our Identity Provider (IdP): it stores users, hashes passwords,
// and issues/validates the JWTs. Our server never sees raw passwords beyond
// forwarding them to Supabase.
const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_KEY. Copy .env.example to .env and fill them in."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;

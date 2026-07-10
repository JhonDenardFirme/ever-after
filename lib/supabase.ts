import 'server-only';
// ^ This import is a tripwire, not decoration. If any client component ever
// imports this file (even indirectly through a chain), the build FAILS on
// purpose. That's the guarantee that the service-role key — which bypasses
// all Row Level Security — never ships to a browser. If you ever see
// "Module not found: server-only", do NOT delete this line; move your DB
// call into a Server Action instead.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * The one and only Supabase client in this app. Service-role, server-side.
 * Lazily created and cached so we don't rebuild it per request.
 *
 * Every read/write in Ever After goes through Server Actions or Server
 * Components calling this — the browser never talks to Supabase directly.
 */
export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — compare .env.local against .env.example.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false }, // no user sessions here — NextAuth owns identity
  });

  return _client;
}

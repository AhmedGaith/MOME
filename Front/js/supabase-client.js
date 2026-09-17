/**
 * Browser Supabase client for MOME.
 * Loaded from /api/config at runtime so keys stay in .env on the server.
 */
let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const res = await fetch('/api/config');
  const config = await res.json();

  if (!window.supabase?.createClient) {
    throw new Error('Supabase JS library is not loaded.');
  }

  supabaseClient = window.supabase.createClient(config.url, config.publishableKey);
  return supabaseClient;
}

const { createClient } = require('@supabase/supabase-js');

function getSupabaseKey() {
  return (
    getServiceRoleKey() ||
    getPublishableKey()
  );
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getPublishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

function hasServiceRoleKey() {
  return Boolean(getServiceRoleKey());
}

function createSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let supabase = null;
let serviceSupabase = null;

function getClient() {
  if (!supabase) supabase = createSupabaseClient();
  return supabase;
}

function getServiceClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      'Supabase service role key is missing. Add SUPABASE_SERVICE_ROLE_KEY to .env for server writes.'
    );
  }

  if (!serviceSupabase) {
    serviceSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return serviceSupabase;
}

module.exports = {
  getClient,
  getServiceClient,
  getSupabaseUrl,
  getSupabaseKey,
  getPublishableKey,
  getServiceRoleKey,
  hasServiceRoleKey,
  createSupabaseClient,
};

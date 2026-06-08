import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = !!supabaseUrl;

const noResult = { data: null, error: null, count: null, status: 200, statusText: "OK" };

const chainable = (): any => {
  const obj: any = Promise.resolve(noResult);
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq",
    "single", "maybeSingle", "order", "limit", "range", "filter", "match",
    "in", "is", "not", "or", "textSearch"];
  for (const m of methods) {
    obj[m] = () => chainable();
  }
  return obj;
};

const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => chainable(),
} as unknown as SupabaseClient;

export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;

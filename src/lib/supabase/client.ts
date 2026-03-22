import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables'
  );
}

// BRD §5.1 — anon key only; service_role NEVER in frontend bundle
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Call a Supabase Edge Function with JWT auth.
 * All privileged operations (Stripe, email, refunds) go through Edge Functions.
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    body,
  });

  if (error) {
    // Extract the real error message from the response body
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        throw new Error(body.error ?? body.message ?? error.message);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
      }
    }
    throw new Error(error.message ?? `Edge Function ${functionName} failed`);
  }

  return data as T;
}

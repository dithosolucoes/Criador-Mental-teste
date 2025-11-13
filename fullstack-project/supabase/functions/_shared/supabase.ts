import { createClient } from 'npm:@supabase/supabase-js@2.44.2';

export const createSupabaseClient = (authHeader?: string) => {
  const options = authHeader ? {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  } : {};

  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    options
  );
};

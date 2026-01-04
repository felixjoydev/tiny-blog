import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabaseServer";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase server client with cookie access
  const supabase = createSupabaseServerClient(context.cookies);

  // Try to refresh the session
  const { data: { session } } = await supabase.auth.getSession();

  // If there's a session, refresh it to keep it alive
  if (session) {
    await supabase.auth.refreshSession();
  }

  // Continue to the route
  return next();
});

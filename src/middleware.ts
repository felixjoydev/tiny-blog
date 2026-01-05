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
    
    // Check if user needs onboarding (exclude auth and setup pages)
    const pathname = context.url.pathname;
    const isAuthPage = pathname.startsWith('/auth');
    const isSetupPage = pathname.startsWith('/accounts/setup');
    
    // Only check onboarding status if user is logged in and not on auth/setup pages
    if (!isAuthPage && !isSetupPage) {
      // Fetch user profile to check onboarded status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, handle, display_name, bio')
        .eq('id', session.user.id)
        .single();
      
      // If profile exists and user is not onboarded, redirect to setup
      if (profile && !profile.onboarded) {
        return context.redirect('/accounts/setup');
      }
      
      // Also check if mandatory fields are missing (fallback for legacy profiles)
      if (profile && (!profile.handle || !profile.display_name || profile.display_name === 'New user' || !profile.bio)) {
        return context.redirect('/accounts/setup');
      }
    }
  }

  // Continue to the route
  return next();
});

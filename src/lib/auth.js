/**
 * Get the current authenticated user session
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{user: object | null, session: object | null}>}
 */
export const getSessionUser = async (supabase) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { user: null, session: null };
  }
  
  return { user: session.user, session };
};

/**
 * Get the current user's profile and check if onboarded
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{profile: object | null, isOnboarded: boolean, error: object | null}>}
 */
export const getMyProfile = async (supabase) => {
  const { user, session } = await getSessionUser(supabase);
  
  if (!user) {
    return { profile: null, isOnboarded: false, error: { message: 'Not authenticated' } };
  }
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (error) {
    return { profile: null, isOnboarded: false, error };
  }
  
  // Check if profile is complete/onboarded
  const isOnboarded = Boolean(profile?.display_name && profile?.bio);
  
  return { profile, isOnboarded, error: null };
};

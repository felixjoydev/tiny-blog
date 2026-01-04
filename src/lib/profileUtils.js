/**
 * Check if a user profile is complete (onboarded)
 * @param {Object} profile - The user profile object
 * @returns {boolean} - True if profile is complete
 */
export function isProfileComplete(profile) {
	if (!profile) return false;
	
	// Check the onboarded flag if it exists
	if (profile.onboarded !== undefined) {
		return profile.onboarded === true;
	}
	
	// Fallback: check if display_name is set and bio exists
	// This handles legacy profiles before onboarded field was added
	return (
		profile.display_name &&
		profile.display_name !== 'New user' &&
		profile.bio !== null &&
		profile.bio !== undefined &&
		profile.bio.trim() !== ''
	);
}

/**
 * Update user profile
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client instance
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates (display_name, bio, avatar_path)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateProfile(supabase, userId, updates) {
	try {
		const { data, error } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', userId)
			.select()
			.single();

		return { data, error };
	} catch (error) {
		console.error('Error updating profile:', error);
		return { data: null, error };
	}
}

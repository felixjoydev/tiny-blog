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

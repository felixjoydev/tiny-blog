/**
 * URL helpers for profile routing
 * 
 * This module provides canonical URL generation for user profiles.
 * Primary strategy: /u/<handle> for users with handles
 * Fallback: /profile/<uuid> for legacy compatibility
 */

/**
 * Reserved handles that cannot be registered by users
 * Prevents impersonation and reserves for future system use
 */
export const RESERVED_HANDLES = [
	'admin',
	'administrator',
	'support',
	'help',
	'api',
	'www',
	'mail',
	'root',
	'moderator',
	'mod',
	'staff',
	'team',
	'official',
	'tiny',
	'system',
	'bot',
	'info',
	'contact',
	'about',
	'terms',
	'privacy',
	'settings',
	'account',
	'profile',
	'user',
	'users',
	'post',
	'posts',
	'comment',
	'comments',
	'auth',
	'login',
	'logout',
	'signup',
	'register',
];

/**
 * Get canonical profile URL for a user
 * @param {Object} profile - Profile object with handle and/or id
 * @param {string} profile.handle - User's handle (preferred)
 * @param {string} profile.id - User's UUID (fallback)
 * @returns {string} Profile URL
 */
export function getProfileUrl(profile) {
	if (!profile) {
		throw new Error('Profile object is required');
	}

	// Prefer handle-based URL if available
	if (profile.handle) {
		return `/u/${profile.handle}`;
	}

	// Fallback to UUID-based URL
	if (profile.id) {
		return `/profile/${profile.id}`;
	}

	throw new Error('Profile must have either handle or id');
}

/**
 * Validate handle format
 * @param {string} handle - Handle to validate
 * @returns {boolean} True if valid
 */
export function isValidHandle(handle) {
	if (!handle || typeof handle !== 'string') {
		return false;
	}

	// Check length
	if (handle.length < 3 || handle.length > 20) {
		return false;
	}

	// Check format: lowercase letters, numbers, underscore only
	const handleRegex = /^[a-z0-9_]+$/;
	if (!handleRegex.test(handle)) {
		return false;
	}

	// Check reserved
	if (RESERVED_HANDLES.includes(handle.toLowerCase())) {
		return false;
	}

	return true;
}

/**
 * Normalize handle input
 * @param {string} handle - Raw handle input
 * @returns {string} Normalized handle (trimmed, lowercase)
 */
export function normalizeHandle(handle) {
	if (!handle || typeof handle !== 'string') {
		return '';
	}

	return handle.trim().toLowerCase();
}

/**
 * Get error message for invalid handle
 * @param {string} handle - Handle to validate
 * @returns {string|null} Error message or null if valid
 */
export function getHandleError(handle) {
	if (!handle || handle.trim() === '') {
		return 'Handle is required';
	}

	const normalized = normalizeHandle(handle);

	if (normalized.length < 3) {
		return 'Handle must be at least 3 characters';
	}

	if (normalized.length > 20) {
		return 'Handle must be 20 characters or less';
	}

	const handleRegex = /^[a-z0-9_]+$/;
	if (!handleRegex.test(normalized)) {
		return 'Handle can only contain lowercase letters, numbers, and underscores';
	}

	if (RESERVED_HANDLES.includes(normalized)) {
		return 'This handle is reserved';
	}

	return null;
}

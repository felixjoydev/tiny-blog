import { supabase } from './supabaseClient';

/**
 * Generate a URL-friendly slug from a title
 * Rules: lowercase, alphanumeric + hyphens, max 50 chars
 * @param {string} title - Post title
 * @returns {string} - Generated slug
 */
export function generateSlug(title) {
	if (!title || typeof title !== 'string') {
		// Fallback for empty/invalid titles
		return `post-${Math.random().toString(36).substring(2, 8)}`;
	}

	let slug = title
		.toLowerCase()
		.trim()
		// Replace spaces and underscores with hyphens
		.replace(/[\s_]+/g, '-')
		// Remove all non-alphanumeric characters except hyphens
		.replace(/[^a-z0-9-]/g, '')
		// Replace multiple consecutive hyphens with single hyphen
		.replace(/-+/g, '-')
		// Remove leading/trailing hyphens
		.replace(/^-+|-+$/g, '');

	// If slug is empty after sanitization, use fallback
	if (!slug || slug.length === 0) {
		return `post-${Math.random().toString(36).substring(2, 8)}`;
	}

	// Truncate to 50 chars at word boundary
	if (slug.length > 50) {
		slug = slug.substring(0, 50);
		// Try to break at last hyphen to avoid cutting mid-word
		const lastHyphen = slug.lastIndexOf('-');
		if (lastHyphen > 30) {
			// Only break at hyphen if it's not too early
			slug = slug.substring(0, lastHyphen);
		}
		// Remove trailing hyphen if created by truncation
		slug = slug.replace(/-+$/, '');
	}

	return slug;
}

/**
 * Check if a slug is available for a specific author
 * Checks both current posts.slug and post_slug_aliases
 * @param {string} authorId - Author's UUID
 * @param {string} slug - Slug to check
 * @param {string} [excludePostId] - Post ID to exclude (for edit mode)
 * @returns {Promise<boolean>} - True if available
 */
export async function checkSlugAvailability(authorId, slug, excludePostId = null) {
	if (!authorId || !slug) {
		return false;
	}

	try {
		// Check current posts
		let postsQuery = supabase
			.from('posts')
			.select('id')
			.eq('author_id', authorId)
			.eq('slug', slug);

		// Exclude current post in edit mode
		if (excludePostId) {
			postsQuery = postsQuery.neq('id', excludePostId);
		}

		const { data: existingPosts, error: postsError } = await postsQuery;

		if (postsError) {
			console.error('Error checking slug in posts:', postsError);
			return false;
		}

		if (existingPosts && existingPosts.length > 0) {
			return false; // Slug already used in current posts
		}

		// Check aliases
		const { data: existingAliases, error: aliasesError } = await supabase
			.from('post_slug_aliases')
			.select('id')
			.eq('author_id', authorId)
			.eq('slug', slug);

		if (aliasesError) {
			console.error('Error checking slug in aliases:', aliasesError);
			return false;
		}

		if (existingAliases && existingAliases.length > 0) {
			return false; // Slug already used in aliases
		}

		return true; // Slug is available
	} catch (error) {
		console.error('Error in checkSlugAvailability:', error);
		return false;
	}
}

/**
 * Generate a unique slug for an author by appending numbers if needed
 * @param {string} authorId - Author's UUID
 * @param {string} title - Post title
 * @param {string} [excludePostId] - Post ID to exclude (for edit mode)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(authorId, title, excludePostId = null) {
	const baseSlug = generateSlug(title);
	let slug = baseSlug;
	let counter = 2;

	// Try base slug first
	const isAvailable = await checkSlugAvailability(authorId, slug, excludePostId);
	if (isAvailable) {
		return slug;
	}

	// Append numbers until we find an available slug
	while (counter <= 100) {
		// Safety limit
		slug = `${baseSlug}-${counter}`;

		// Ensure we don't exceed 50 char limit
		if (slug.length > 50) {
			// Truncate base slug to make room for suffix
			const maxBaseLength = 50 - `-${counter}`.length;
			const truncatedBase = baseSlug.substring(0, maxBaseLength).replace(/-+$/, '');
			slug = `${truncatedBase}-${counter}`;
		}

		const available = await checkSlugAvailability(authorId, slug, excludePostId);
		if (available) {
			return slug;
		}

		counter++;
	}

	// Fallback: use random suffix if we somehow can't find a unique slug
	return `${baseSlug.substring(0, 40)}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} - True if valid
 */
export function isValidSlug(slug) {
	if (!slug || typeof slug !== 'string') {
		return false;
	}

	// Check length
	if (slug.length < 1 || slug.length > 50) {
		return false;
	}

	// Check format: lowercase alphanumeric + hyphens only
	const slugRegex = /^[a-z0-9-]+$/;
	return slugRegex.test(slug);
}

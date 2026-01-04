import { supabase } from "./supabaseClient";

/**
 * Create a new post with slug generation
 * @param {string} title - Post title
 * @param {string} subtitle - Post subtitle (optional)
 * @param {string} content - Post content
 * @param {string} authorId - Author's user ID
 * @param {string} slug - URL-friendly slug
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const createPost = async (title, subtitle, content, authorId, slug) => {
  const { data, error } = await supabase
    .rpc('create_post_with_slug', {
      p_title: title,
      p_subtitle: subtitle || null,
      p_content: content,
      p_slug: slug
    });

  if (error) {
    return { data: null, error };
  }

  // RPC returns JSON with { data: { id, slug }, error }
  if (data?.error) {
    return { data: null, error: { message: data.error } };
  }

  return { data: data?.data, error: null };
};

/**
 * Get a post by ID with author profile data
 * @param {string} id - Post ID
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const getPostById = async (id) => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        id,
        display_name,
        handle,
        avatar_path
      )
    `)
    .eq("id", id)
    .single();

  return { data, error };
};

/**
 * Update a post's title and slug using RPC (creates alias for old slug)
 * @param {string} id - Post ID
 * @param {string} title - New title
 * @param {string} slug - New slug
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const updatePostWithSlug = async (id, title, slug) => {
  const { data, error } = await supabase
    .rpc('update_post_with_slug', {
      p_post_id: id,
      p_title: title,
      p_new_slug: slug
    });

  if (error) {
    return { data: null, error };
  }

  // RPC returns JSON with { data: { slug }, error }
  if (data?.error) {
    return { data: null, error: { message: data.error } };
  }

  return { data: data?.data, error: null };
};

/**
 * Update a post (subtitle and content only - title/slug handled by RPC)
 * @param {string} id - Post ID
 * @param {string} subtitle - New subtitle (optional)
 * @param {string} content - New content
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const updatePostContent = async (id, subtitle, content) => {
  const { data, error } = await supabase
    .from("posts")
    .update({
      subtitle: subtitle || null,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
};

/**
 * Update a post (legacy function - kept for backward compatibility)
 * @param {string} id - Post ID
 * @param {string} title - New title
 * @param {string} subtitle - New subtitle (optional)
 * @param {string} content - New content
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const updatePost = async (id, title, subtitle, content) => {
  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      subtitle: subtitle || null,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
};

/**
 * Delete a post
 * @param {string} id - Post ID
 * @returns {Promise<{error: object | null}>}
 */
export const deletePost = async (id) => {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  return { error };
};

/**
 * Get posts by author with comment count
 * @param {string} authorId - Author's user ID
 * @returns {Promise<{data: array | null, error: object | null}>}
 */
export const getPostsByAuthor = async (authorId) => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        id,
        display_name,
        handle,
        avatar_path
      ),
      comments (count)
    `)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  // Transform to include comment count
  const postsWithCommentCount = data?.map(post => ({
    ...post,
    comment_count: post.comments?.[0]?.count || 0
  }));

  return { data: postsWithCommentCount, error };
};

import { supabase } from "./supabaseClient";

/**
 * Create a new post
 * @param {string} title - Post title
 * @param {string} subtitle - Post subtitle (optional)
 * @param {string} content - Post content
 * @param {string} authorId - Author's user ID
 * @returns {Promise<{data: object | null, error: object | null}>}
 */
export const createPost = async (title, subtitle, content, authorId) => {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      subtitle: subtitle || null,
      content,
      author_id: authorId,
    })
    .select("id")
    .single();

  return { data, error };
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
        avatar_path
      )
    `)
    .eq("id", id)
    .single();

  return { data, error };
};

/**
 * Update a post
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

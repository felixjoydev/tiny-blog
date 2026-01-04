import { supabase } from "./supabaseClient";

/**
 * Get all comments for a post with author profile information
 * @param {string} postId - Post ID
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function getCommentsByPostId(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      author_id,
      created_at,
      updated_at,
      profiles:author_id (
        id,
        display_name,
        avatar_path
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: false }); // Newest first

  return { data, error };
}

/**
 * Create a new comment
 * @param {string} postId - Post ID
 * @param {string} authorId - Comment author ID
 * @param {string} content - Comment content
 * @returns {Promise<{data: any, error: any}>}
 */
export async function createComment(postId, authorId, content) {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: authorId,
      content: content.trim(),
    })
    .select(`
      id,
      content,
      author_id,
      created_at,
      updated_at,
      profiles:author_id (
        id,
        display_name,
        avatar_path
      )
    `)
    .single();

  return { data, error };
}

/**
 * Update a comment's content
 * @param {string} commentId - Comment ID
 * @param {string} content - New comment content
 * @returns {Promise<{data: any, error: any}>}
 */
export async function updateComment(commentId, content) {
  const { data, error } = await supabase
    .from("comments")
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select(`
      id,
      content,
      author_id,
      created_at,
      updated_at,
      profiles:author_id (
        id,
        display_name,
        avatar_path
      )
    `)
    .single();

  return { data, error };
}

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<{data: any, error: any}>}
 */
export async function deleteComment(commentId) {
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  return { data, error };
}

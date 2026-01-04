import { useState } from "react";
import PostActionBar from "./PostActionBar";
import { deletePost } from "../../lib/posts";

/**
 * PostDetail - Interactive wrapper for post detail page
 * @param {Object} props
 * @param {string} props.postId - Post ID
 * @param {string} props.userId - Current user ID
 */
export default function PostDetail({ postId, userId }) {
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await deletePost(postId);
      if (error) {
        alert("Failed to delete post");
        console.error("Delete error:", error);
        return;
      }
      
      // Redirect to profile after deletion
      window.location.href = `/profile/${userId}`;
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting the post");
    }
  };

  return (
    <PostActionBar 
      mode="view-own-post" 
      postId={postId}
      onDelete={handleDelete}
    />
  );
}

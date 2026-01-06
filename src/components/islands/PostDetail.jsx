import { useState } from "react";
import PostActionBar from "./PostActionBar";
import { deletePost } from "../../lib/posts";
import DeletePostModal from "../ui/DeletePostModal";

/**
 * PostDetail - Interactive wrapper for post detail page
 * @param {Object} props
 * @param {string} props.postId - Post ID
 * @param {string} props.userId - Current user ID
 * @param {string} [props.userHandle] - Current user handle (optional)
 * @param {string} props.postTitle - Post title for delete confirmation
 */
export default function PostDetail({ postId, userId, userHandle, postTitle }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const { error } = await deletePost(postId);
      if (error) {
        alert("Failed to delete post");
        console.error("Delete error:", error);
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }
      
      // Redirect to profile after deletion
      if (userHandle) {
        window.location.href = `/u/${userHandle}`;
      } else {
        window.location.href = `/profile/${userId}`;
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting the post");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <PostActionBar 
        mode="view-own-post" 
        postId={postId}
        onDelete={handleDeleteClick}
        userHandle={userHandle}
      />
      
      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        postTitle={postTitle}
        isDeleting={isDeleting}
      />
    </>
  );
}

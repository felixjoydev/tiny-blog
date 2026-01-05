import { useState, useEffect } from 'react';
import { getCommentsByPostId } from '../../lib/comments';
import CommentForm from './CommentForm.jsx';
import CommentList from './CommentList.jsx';

/**
 * CommentsSection parent component
 * @param {{
 *   postId: string,
 *   postAuthorId: string,
 *   currentUserId: string | null
 * }} props
 */
export default function CommentsSection({ postId, postAuthorId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    const { data, error } = await getCommentsByPostId(postId);

    if (error) {
      console.error('Error loading comments:', error);
    } else {
      setComments(data || []);
    }

    setIsLoading(false);
  };

  const handleCommentAdded = (newComment) => {
    setComments([newComment, ...comments]);
  };

  const handleCommentUpdated = (updatedComment) => {
    setComments(comments.map(c => 
      c.id === updatedComment.id ? updatedComment : c
    ));
  };

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  const handleAuthRequired = () => {
    // Save scroll position and return URL before redirecting
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
      sessionStorage.setItem('scrollTimestamp', Date.now().toString());
      sessionStorage.setItem('restoreScroll', 'true');
      sessionStorage.setItem('returnUrl', window.location.pathname);
    }
    
    // Redirect to auth page
    window.location.href = '/auth';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Comments heading */}
      <h2 className="type-h3 text-[#3F331C] mb-8">
        Comments
      </h2>

      {/* Comment form */}
      <div className="mb-8">
        <CommentForm
          postId={postId}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
          onAuthRequired={handleAuthRequired}
        />
      </div>

      {/* Comment list */}
      <CommentList
        comments={comments}
        postAuthorId={postAuthorId}
        currentUserId={currentUserId}
        onCommentUpdated={handleCommentUpdated}
        onCommentDeleted={handleCommentDeleted}
        isLoading={isLoading}
      />
    </div>
  );
}

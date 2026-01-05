import { useState } from 'react';
import { createComment } from '../../lib/comments';

/**
 * CommentForm component with rate limiting
 * @param {{
 *   postId: string,
 *   currentUserId: string | null,
 *   onCommentAdded: (comment: any) => void,
 *   onAuthRequired: () => void
 * }} props
 */
export default function CommentForm({ postId, currentUserId, onCommentAdded, onAuthRequired }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      onAuthRequired();
      return;
    }

    if (!content.trim()) {
      return;
    }

    // Check rate limiting
    const lastCommentTime = localStorage.getItem(`lastComment_${currentUserId}`);
    if (lastCommentTime) {
      const timeSinceLastComment = Date.now() - parseInt(lastCommentTime);
      const oneMinute = 60 * 1000;
      
      if (timeSinceLastComment < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeSinceLastComment) / 1000);
        setError(`Please wait ${remainingSeconds} seconds before commenting again`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    const { data, error: commentError } = await createComment(postId, currentUserId, content);

    if (commentError) {
      console.error('Error creating comment:', commentError);
      console.error('Error details:', {
        message: commentError.message,
        details: commentError.details,
        hint: commentError.hint,
        code: commentError.code
      });
      setError(`Failed to post comment: ${commentError.message || 'Please try again.'}`);
      setIsSubmitting(false);
      return;
    }

    // Update rate limiting timestamp
    localStorage.setItem(`lastComment_${currentUserId}`, Date.now().toString());

    // Clear form and notify parent
    setContent('');
    setIsSubmitting(false);
    onCommentAdded(data);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="w-full rounded-[0.625rem] bg-[#F2E1C0] p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts"
          aria-label="Write a comment"
          className="w-full min-h-16 bg-transparent border-none outline-none resize-none type-label-plain text-[#3F331C] placeholder:text-[#3F331C] placeholder:opacity-50"
        />
        
        {error && (
          <p className="type-meta-plain text-[#DA5700] mt-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            aria-label="Submit comment"
            className="inline-flex py-2 px-2.5 justify-center items-center gap-2.5 rounded-[6.25rem] bg-[#DA5700] type-label-plain text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Respond'}
          </button>
        </div>
      </div>
    </form>
  );
}

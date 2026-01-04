import CommentItem from './CommentItem.jsx';

/**
 * CommentList component displays comments with dividers and empty state
 * @param {{
 *   comments: Array,
 *   postAuthorId: string,
 *   currentUserId: string | null,
 *   onCommentUpdated: (comment: any) => void,
 *   onCommentDeleted: (commentId: string) => void,
 *   isLoading: boolean
 * }} props
 */
export default function CommentList({ 
  comments, 
  postAuthorId, 
  currentUserId, 
  onCommentUpdated, 
  onCommentDeleted,
  isLoading 
}) {
  if (isLoading) {
    return (
      <div className="w-full py-8 text-center">
        <p 
          className="text-[#786237] text-[0.875rem]"
          style={{ fontFamily: 'Exposure[-10]' }}
        >
          Loading comments...
        </p>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="w-full flex flex-col items-center gap-4 py-8">
        {/* Bear comment icon */}
        <div className="w-[76.421px] h-[80.853px]">
          <img 
            src="/icons/bear-comment.svg" 
            alt="" 
            className="w-full h-full"
          />
        </div>

        {/* Empty state text */}
        <div className="flex flex-col gap-1 text-center">
          <p 
            className="text-[#3F331C] text-[1.25rem] tracking-[0.037rem]"
            style={{ fontFamily: 'Exposure[-40]' }}
          >
            No comments yet
          </p>
          <p 
            className="text-[#786237] text-[1rem] tracking-[0.02rem] leading-6"
            style={{ fontFamily: 'Exposure[-10]' }}
          >
            Be the first one to comment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          {/* 16px spacing before each comment */}
          <div className="h-4" aria-hidden="true" />
          
          <CommentItem
            comment={comment}
            postAuthorId={postAuthorId}
            currentUserId={currentUserId}
            onCommentUpdated={onCommentUpdated}
            onCommentDeleted={onCommentDeleted}
          />

          {/* 16px spacing and divider after each comment except last */}
          {index < comments.length - 1 && (
            <>
              <div className="h-4" aria-hidden="true" />
              <div 
                className="w-full h-px bg-[#F2E1C0]" 
                role="separator"
                aria-hidden="true"
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

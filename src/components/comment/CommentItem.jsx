import { useState, useEffect, useRef } from 'react';
import { updateComment, deleteComment } from '../../lib/comments';
import { supabase } from '../../lib/supabaseClient';
import { getProfileUrl } from '../../lib/urls';

/**
 * CommentItem component with edit/delete functionality
 * @param {{
 *   comment: any,
 *   postAuthorId: string,
 *   currentUserId: string | null,
 *   onCommentUpdated: (comment: any) => void,
 *   onCommentDeleted: (commentId: string) => void
 * }} props
 */
export default function CommentItem({ comment, postAuthorId, currentUserId, onCommentUpdated, onCommentDeleted }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const menuRef = useRef(null);

  const isAuthor = currentUserId === comment.author_id;
  const isPostOwner = currentUserId === postAuthorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isPostOwner;
  const isEdited = comment.updated_at && new Date(comment.updated_at).getTime() !== new Date(comment.created_at).getTime();

  // Get author profile URL
  const authorProfileUrl = comment.profiles?.handle 
    ? getProfileUrl(comment.profiles) 
    : `/profile/${comment.author_id}`;

  // Load avatar
  useEffect(() => {
    if (comment.profiles?.avatar_path) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(comment.profiles.avatar_path);
      setAvatarUrl(data.publicUrl);
    }
  }, [comment.profiles?.avatar_path]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Truncate content to 50 words
  const words = comment.content.split(/\s+/);
  const needsTruncation = words.length > 50;
  const displayContent = isExpanded || !needsTruncation 
    ? comment.content 
    : words.slice(0, 50).join(' ') + '...';

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    const { data, error } = await updateComment(comment.id, editContent);

    if (error) {
      console.error('Error updating comment:', error);
      setIsSaving(false);
      return;
    }

    setIsEditing(false);
    setIsSaving(false);
    onCommentUpdated(data);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const { data, error } = await deleteComment(comment.id);

    if (error) {
      console.error('Error deleting comment:', error);
      alert(`Failed to delete comment: ${error.message}`);
      return;
    }

    // Check if delete actually succeeded (RLS might block it)
    console.log('Delete response:', { data, error });
    onCommentDeleted(comment.id);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {/* Profile row with action menu */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            {/* Avatar */}
            <div 
              className="w-8 h-8 rounded-full bg-[#D9D9D9] overflow-hidden shrink-0"
              aria-hidden="true"
            >
              {avatarUrl && (
                <img 
                  src={avatarUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Name and date */}
            <div className="flex flex-col gap-1">
              <a 
                href={authorProfileUrl}
                className="type-label text-[#3F331C] hover:underline"
              >
                {comment.profiles?.display_name || 'Unknown User'}
              </a>
              <div className="flex items-center gap-2">
                <p className="type-meta-plain text-[#786237]">
                  {formatDate(comment.created_at)}
                </p>
                {isEdited && (
                  <span 
                    className="type-meta-plain text-[#786237] opacity-70"
                    aria-label="This comment has been edited"
                  >
                    (edited)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* More menu */}
          {canEdit || canDelete ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-4 h-4 flex items-center justify-center"
                aria-label="Comment options"
                aria-expanded={showMenu}
              >
                <img 
                  src="/icons/more-menu.svg" 
                  alt="" 
                  className="w-full h-full"
                />
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 top-6 bg-[#F1E0BF] rounded-lg shadow-lg py-2 px-1 min-w-30 z-10"
                  role="menu"
                >
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="type-label-plain w-full px-4 py-2 text-left text-[#3F331C] hover:bg-[#FAECD2] rounded"
                      role="menuitem"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="type-label-plain w-full px-4 py-2 text-left text-[#DA5700] hover:bg-[#FAECD2] rounded"
                      role="menuitem"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Comment content */}
        {isEditing ? (
          <div className="w-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-16 p-3 rounded-lg bg-[#F2E1C0] border-none outline-none resize-none type-label-plain text-[#3F331C]"
              aria-label="Edit comment"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isSaving}
                className="type-label-plain px-4 py-1.5 rounded-lg bg-[#DA5700] text-white disabled:opacity-30"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="type-label-plain px-4 py-1.5 rounded-lg bg-[#F2E1C0] text-[#3F331C]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="type-label-plain text-[#3F331C]">
              {displayContent}
              {needsTruncation && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="ml-1 text-[#DA5700] hover:underline"
                  aria-label="Read more"
                >
                  read more
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

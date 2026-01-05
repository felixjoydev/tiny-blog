import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSessionUser, getMyProfile } from "../../lib/auth";
import { createPost, updatePostWithSlug, updatePostContent, deletePost, getPostById } from "../../lib/posts";
import { generateUniqueSlug, generateSlug, checkSlugAvailability } from "../../lib/slugify";
import PostActionBar from "./PostActionBar";
import ConfirmCloseModal from "../ui/ConfirmCloseModal";
import DeletePostModal from "../ui/DeletePostModal";

/**
 * PostEditor - Interactive post creation/editing form
 * @param {Object} props
 * @param {"create" | "edit"} props.mode - Editor mode
 * @param {string | null | undefined} props.postId - Post ID (for edit mode)
 */
export default function PostEditor({ mode = "create", postId = null }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userHandle, setUserHandle] = useState(null);
  const [slugPreview, setSlugPreview] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(true);
  
  // Track original values for edit mode
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSubtitle, setOriginalSubtitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    checkAuthAndLoadPost();
  }, []);

  // Auto-resize textareas when content is loaded (for edit mode)
  useEffect(() => {
    if (!loading) {
      if (titleRef.current && title) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
      if (subtitleRef.current && subtitle) {
        subtitleRef.current.style.height = 'auto';
        subtitleRef.current.style.height = subtitleRef.current.scrollHeight + 'px';
      }
    }
  }, [loading, title, subtitle]);

  // Track changes in edit mode
  useEffect(() => {
    if (mode === "edit" && !loading) {
      const changed = 
        title !== originalTitle ||
        subtitle !== originalSubtitle ||
        content !== originalContent;
      setHasChanges(changed);
    }
  }, [mode, loading, title, subtitle, content, originalTitle, originalSubtitle, originalContent]);

  // Debounced slug preview and availability check
  useEffect(() => {
    if (!title || title.trim() === '' || !userId) {
      setSlugPreview('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      const previewSlug = generateSlug(title);
      setSlugPreview(previewSlug);

      if (mode === "create") {
        // Check availability for create mode
        setCheckingSlug(true);
        const available = await checkSlugAvailability(userId, previewSlug);
        setSlugAvailable(available);
        setCheckingSlug(false);
      } else {
        // In edit mode, slug will be made unique by RPC
        setSlugAvailable(true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, userId, mode]);

  const checkAuthAndLoadPost = async () => {
    try {
      // Check session
      const { user } = await getSessionUser(supabase);
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      setUserId(user.id);

      // Check onboarding status and get handle
      const { profile, isOnboarded } = await getMyProfile(supabase);
      if (!isOnboarded) {
        window.location.href = "/accounts/setup";
        return;
      }

      setUserHandle(profile?.handle || null);

      // If edit mode, load existing post
      if (mode === "edit" && postId) {
        const { data: post, error: postError } = await getPostById(postId);
        if (postError) {
          setError("Failed to load post");
          return;
        }
        
        // Check if user owns this post
        if (post.author_id !== user.id) {
          window.location.href = "/";
          return;
        }

        setTitle(post.title || "");
        setSubtitle(post.subtitle || "");
        setContent(post.content || "");
        
        // Store original values for change tracking
        setOriginalTitle(post.title || "");
        setOriginalSubtitle(post.subtitle || "");
        setOriginalContent(post.content || "");
      }

      setLoading(false);
    } catch (err) {
      console.error("Auth check error:", err);
      setError("Authentication error");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    }
  };

  const handleClose = () => {
    // Check for unsaved changes in edit mode
    if (mode === "edit" && hasChanges) {
      setShowCloseModal(true);
      return;
    }

    // Proceed with close
    if (mode === "edit" && postId) {
      window.location.href = `/post/${postId}`;
    } else {
      window.location.href = "/";
    }
  };

  const handleCloseConfirm = () => {
    setShowCloseModal(false);
    if (mode === "edit" && postId) {
      window.location.href = `/post/${postId}`;
    } else {
      window.location.href = "/";
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === "edit" && postId) {
        // Update existing post - split into two calls
        // 1. Update title and slug via RPC (handles alias creation)
        const newSlug = generateSlug(title);
        const { data: slugData, error: slugUpdateError } = await updatePostWithSlug(postId, title, newSlug);
        if (slugUpdateError) {
          console.error("Slug update error:", slugUpdateError);
          setError(slugUpdateError.message || "Failed to update post title");
          setSaving(false);
          return;
        }

        // 2. Update subtitle and content separately (do NOT update title again)
        const { error: contentUpdateError } = await updatePostContent(postId, subtitle, content);
        if (contentUpdateError) {
          console.error("Content update error:", contentUpdateError);
          setError("Failed to update post content");
          setSaving(false);
          return;
        }

        // Redirect to stable UUID route (which will redirect to canonical)
        window.location.href = `/post/${postId}`;
      } else {
        // Create new post with unique slug
        const uniqueSlug = await generateUniqueSlug(userId, title);
        const { data, error: createError } = await createPost(title, subtitle, content, userId, uniqueSlug);
        if (createError) {
          setError("Failed to create post");
          setSaving(false);
          return;
        }
        // Redirect to user's profile page after creating post
        if (userHandle) {
          window.location.href = `/u/${userHandle}`;
        } else {
          window.location.href = `/profile/${userId}`;
        }
      }
    } catch (err) {
      console.error("Publish error:", err);
      setError("An error occurred while publishing");
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await deletePost(postId);
      if (deleteError) {
        setError("Failed to delete post");
        setIsDeleting(false);
        setSaving(false);
        setShowDeleteModal(false);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting");
      setIsDeleting(false);
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextField && nextField.current) {
        nextField.current.focus();
      }
    }
  };

  if (loading) {
    return (
      <>
        <PostActionBar 
          mode="create"
          onClose={handleClose}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="type-body-lg text-[#786237]">
            Loading...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PostActionBar 
        mode={mode}
        onClose={handleClose}
        onPublish={handlePublish}
        onDelete={mode === "edit" ? handleDelete : undefined}
        hasChanges={mode === "edit" ? hasChanges : true}
      />
      
      <div className="py-12">
        {error && (
          <div className="mb-6 p-4 bg-[#ffe5e5] border border-[#B42018] rounded-lg">
            <p className="type-label text-[#B42018]">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Title Input */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, subtitleRef)}
            placeholder="Title"
            disabled={saving}
            rows={1}
            className="w-full bg-transparent border-none outline-none type-display-1 text-[#3f331c] placeholder:text-[#d4c7a8] resize-none overflow-y-hidden"
            style={{ minHeight: 'auto', lineHeight: '1.2' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />

          {/* Subtitle Input */}
          <textarea
            ref={subtitleRef}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, contentRef)}
            placeholder="Subtitle"
            disabled={saving}
            rows={1}
            className="w-full bg-transparent border-none outline-none type-h3 text-[#786237] placeholder:text-[#d4c7a8] resize-none overflow-y-hidden"
            style={{ minHeight: 'auto', lineHeight: '1.2' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />

          {/* Content Input */}
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing or type / for commands"
            disabled={saving}
            rows={15}
            className="w-full bg-transparent border-none outline-none type-body-lg text-[#3f331c] placeholder:text-[#d4c7a8] resize-none"
          />
        </div>
      </div>

      {/* Confirm Close Modal (unsaved changes) */}
      <ConfirmCloseModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseConfirm}
      />

      {/* Delete Post Modal */}
      {mode === "edit" && (
        <DeletePostModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          postTitle={title}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

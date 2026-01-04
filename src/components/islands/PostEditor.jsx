import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSessionUser, getMyProfile } from "../../lib/auth";
import { createPost, updatePost, deletePost, getPostById } from "../../lib/posts";
import PostActionBar from "./PostActionBar";

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
        // Update existing post
        const { error: updateError } = await updatePost(postId, title, subtitle, content);
        if (updateError) {
          setError("Failed to update post");
          setSaving(false);
          return;
        }
        window.location.href = `/post/${postId}`;
      } else {
        // Create new post
        const { data, error: createError } = await createPost(title, subtitle, content, userId);
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await deletePost(postId);
      if (deleteError) {
        setError("Failed to delete post");
        setSaving(false);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      console.error("Delete error:", err);
      setError("An error occurred while deleting");
      setSaving(false);
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
          <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#786237] text-lg">
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
      />
      
      <div className="py-12">
        {error && (
          <div className="mb-6 p-4 bg-[#ffe5e5] border border-[#B42018] rounded-lg">
            <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#B42018] text-sm">
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
            className="w-full bg-transparent border-none outline-none font-['Exposure[-40]:Regular',sans-serif] text-[#3f331c] text-5xl placeholder:text-[#d4c7a8] tracking-tight resize-none leading-tight overflow-y-hidden"
            style={{ minHeight: 'auto' }}
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
            className="w-full bg-transparent border-none outline-none font-['Exposure[-20]:Regular',sans-serif] text-[#786237] text-2xl placeholder:text-[#d4c7a8] tracking-tight resize-none leading-tight overflow-y-hidden"
            style={{ minHeight: 'auto' }}
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
            className="w-full bg-transparent border-none outline-none font-['Exposure[-10]:Regular',sans-serif] text-[#3f331c] text-lg placeholder:text-[#d4c7a8] leading-relaxed resize-none"
          />
        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import tinyLogo from "../../assets/icons/tiny-logo.svg";
import writeIcon from "../../assets/icons/write.svg";

/**
 * PostActionBar - Navigation bar for post creation/editing
 * @param {Object} props
 * @param {"create" | "view-own-post" | "edit" | "view-only"} props.mode - Display mode
 * @param {string} [props.postId] - Post ID (for view-own-post mode)
 * @param {Function} [props.onClose] - Close button callback
 * @param {Function} [props.onPublish] - Publish button callback
 * @param {Function} [props.onEdit] - Edit button callback
 * @param {Function} [props.onDelete] - Delete button callback
 */
export default function PostActionBar({ 
  mode = "create",
  postId,
  onClose,
  onPublish,
  onEdit,
  onDelete 
}) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Fetch profile for view-only mode
        if (mode === "view-only") {
          fetchProfile(user.id);
        }
      }
    };
    getCurrentUser();
  }, [mode]);

  useEffect(() => {
    // Handle click outside to close dropdown
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_path')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowDropdown(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleClose = () => {
    if (mode === "view-only") {
      // In view-only mode, navigate to user's profile instead of going back
      if (currentUserId) {
        window.location.href = `/profile/${currentUserId}`;
      } else {
        // If no user is logged in, go to home page
        window.location.href = '/';
      }
    } else if (mode === "view-own-post" && currentUserId) {
      // Mark scroll position for restoration when navigating to profile
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      const scrollTimestamp = sessionStorage.getItem('scrollTimestamp');
      
      if (scrollPosition && scrollTimestamp) {
        const timeDiff = Date.now() - parseInt(scrollTimestamp);
        if (timeDiff < 5 * 60 * 1000) {
          sessionStorage.setItem('restoreScroll', scrollPosition);
        }
      }
      
      window.location.href = `/profile/${currentUserId}`;
    } else if (onClose) {
      onClose();
    }
  };

  const handleEdit = () => {
    if (postId) {
      window.location.href = `/write?id=${postId}`;
    } else if (onEdit) {
      onEdit();
    }
  };

  const getAvatarContent = () => {
    if (profile?.avatar_path) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_path);
      return (
        <img
          src={data.publicUrl}
          alt={profile.display_name || 'User avatar'}
          className="w-full h-full object-cover"
        />
      );
    }

    const firstLetter = profile?.display_name?.charAt(0).toUpperCase() || 'U';
    return (
      <span className="text-white type-body-lg">
        {firstLetter}
      </span>
    );
  };
  

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ height: 'var(--nav-height)' }}>
      {/* Blur layer with gradient mask */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ 
          backdropFilter: 'blur(6.55px)', 
          maskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)', 
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)' 
        }}
      />
      
      {/* Background gradient */}
      <div 
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, rgba(255, 241, 213, 0.79) 0%, rgba(255, 241, 213, 0.00) 100%)' }}
      />
      
      {/* Content */}
      <div className="relative flex items-center justify-between px-[70px] h-full">
        {/* Left: Logo (view-only) or Close button (other modes) */}
        {mode === "view-only" ? (
          <a
            href="/"
            className="hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <img src={tinyLogo.src} alt="Tiny" className="h-[55px] w-[50px]" />
          </a>
        ) : (
          <button
            onClick={handleClose}
            className="bg-[rgba(63,51,28,0.1)] flex gap-[10px] items-center justify-center px-4 py-[10px] rounded-[100px] hover:bg-[rgba(63,51,28,0.15)] transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 16 16" 
              fill="none"
            >
              <path 
                d="M2.34315 2.34315C2.73367 1.95262 3.36684 1.95262 3.75736 2.34315L8 6.58579L12.2426 2.34315C12.6332 1.95262 13.2663 1.95262 13.6569 2.34315C14.0474 2.73367 14.0474 3.36684 13.6569 3.75736L9.41421 8L13.6569 12.2426C14.0474 12.6332 14.0474 13.2663 13.6569 13.6569C13.2663 14.0474 12.6332 14.0474 12.2426 13.6569L8 9.41421L3.75736 13.6569C3.36684 14.0474 2.73367 14.0474 2.34315 13.6569C1.95262 13.2663 1.95262 12.6332 2.34315 12.2426L6.58579 8L2.34315 3.75736C1.95262 3.36684 1.95262 2.73367 2.34315 2.34315Z" 
                fill="#3f331c"
              />
            </svg>
            <span className="type-label text-[#3f331c]">
              Close
            </span>
          </button>
        )}

        {/* Right: Action buttons based on mode */}
        <div className="flex gap-3">
          {mode === "view-only" && (
            <div className="flex items-center gap-2 relative">
              <a
                href="/write"
                className="bg-[#da5700] text-white px-4 py-2.5 h-10 rounded-full type-label hover:bg-[#c24e00] transition-colors flex items-center gap-2.5"
              >
                <img src={writeIcon.src} alt="" className="w-4 h-4" />
                Write a post
              </a>

              <button
                ref={avatarRef}
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-[#3f331c] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#da5700] transition-all cursor-pointer"
                aria-label="User menu"
              >
                {getAvatarContent()}
              </button>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100"
                >
                  <a
                    href={`/profile/${currentUserId}`}
                    className="block px-4 py-2 text-[#3f331c] hover:bg-[#FFFAEF] transition-colors type-label"
                  >
                    Profile
                  </a>
                  <a
                    href="/accounts"
                    className="block px-4 py-2 text-[#3f331c] hover:bg-[#FFFAEF] transition-colors type-label"
                  >
                    Settings
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-[#3f331c] hover:bg-[#FFFAEF] transition-colors type-label"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "create" && (
            <button
              onClick={onPublish}
              className="bg-[#da5700] flex gap-[10px] items-center justify-center px-4 py-[10px] rounded-[100px] hover:bg-[#c44f00] transition-colors"
            >
              <img src={writeIcon.src} alt="" className="w-4 h-4" />
              <span className="type-label text-white">
                Publish
              </span>
            </button>
          )}

          {mode === "view-own-post" && (
            <>
              <button
                onClick={handleEdit}
                className="bg-[#da5700] flex gap-[10px] items-center justify-center px-4 py-[10px] rounded-[100px] hover:bg-[#c44f00] transition-colors"
              >
                <svg 
                  className="w-4 h-4" 
                  viewBox="0 0 16 16" 
                  fill="none"
                >
                  <path 
                    d="M11.3334 1.33333C11.7754 0.891357 12.3671 0.643066 12.9844 0.643066C13.6017 0.643066 14.1933 0.891357 14.6354 1.33333C15.0774 1.77531 15.3257 2.36696 15.3257 2.98425C15.3257 3.60154 15.0774 4.19319 14.6354 4.63517L5.16211 14.1085L1.33545 15L2.22678 11.1733L11.3334 1.33333Z" 
                    fill="white"
                  />
                </svg>
                <span className="type-label text-white">
                  Edit
                </span>
              </button>
              <button
                onClick={onDelete}
                className="bg-[#b42018] flex gap-[10px] items-center justify-center px-4 py-[10px] rounded-[100px] hover:bg-[#a01c14] transition-colors"
              >
                <svg 
                  className="w-4 h-4" 
                  viewBox="0 0 16 16" 
                  fill="none"
                >
                  <path 
                    d="M2.66669 4H13.3334M6.00002 7.33333V11.3333M10 7.33333V11.3333M3.33335 4L4.00002 13.3333C4.00002 13.6869 4.14049 14.026 4.39054 14.2761C4.64059 14.5261 4.97973 14.6667 5.33335 14.6667H10.6667C11.0203 14.6667 11.3594 14.5261 11.6095 14.2761C11.8595 14.026 12 13.6869 12 13.3333L12.6667 4M5.33335 4V2.66667C5.33335 2.48986 5.40359 2.32029 5.52862 2.19526C5.65364 2.07024 5.82321 2 6.00002 2H10C10.1769 2 10.3464 2.07024 10.4714 2.19526C10.5965 2.32029 10.6667 2.48986 10.6667 2.66667V4" 
                    stroke="white" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="type-label text-white">
                  Delete
                </span>
              </button>
            </>
          )}

          {mode === "edit" && (
              <button
                onClick={onPublish}
                className="bg-[#da5700] flex gap-[10px] items-center justify-center px-4 py-[10px] rounded-[100px] hover:bg-[#c44f00] transition-colors"
              >
                <img src={writeIcon.src} alt="" className="w-4 h-4" />
                <span className="type-label text-white">
                  Publish
                </span>
              </button>
          )}

          {/* view-only mode: no action buttons */}
        </div>
      </div>
    </nav>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSessionUser } from "../../lib/auth";
import { getPostsByAuthor } from "../../lib/posts";
import PostCard from "./PostCard";

/**
 * ProfilePage - Display user profile with posts
 * @param {Object} props
 * @param {string} props.profileId - Profile user ID
 * @param {Object} props.initialProfile - Initial profile data from server
 */
export default function ProfilePage({ profileId, initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfileAndPosts();
  }, [profileId]);

  useEffect(() => {
    // Restore scroll position if returning from post detail
    const restoreScroll = sessionStorage.getItem('restoreScroll');
    if (restoreScroll) {
      const scrollY = parseInt(restoreScroll);
      // Wait for content to load before scrolling
      setTimeout(() => {
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem('restoreScroll');
        sessionStorage.removeItem('scrollPosition');
        sessionStorage.removeItem('scrollTimestamp');
      }, 100);
    }
  }, []);

  const loadProfileAndPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if current user is owner
      const { user } = await getSessionUser(supabase);
      setIsOwner(user?.id === profileId);

      // Fetch posts by author
      const { data: postsData, error: postsError } = await getPostsByAuthor(profileId);
      
      if (postsError) {
        console.error("Error fetching posts:", postsError);
        setError("Failed to load posts");
        setPosts([]);
      } else {
        setPosts(postsData || []);
      }

      setLoading(false);
    } catch (err) {
      console.error("Profile load error:", err);
      setError("An error occurred");
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return `${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
  };

  return (
    <div className="w-full max-w-125 mx-auto px-4 py-12">
      {/* Profile Section */}
      <div className="flex flex-col items-center gap-6 mb-10">
        {/* Avatar */}
        {profile?.avatar_path ? (
          <img
            src={getAvatarUrl(profile.avatar_path)}
            alt={profile.display_name}
            className="w-24 h-24 rounded-full object-cover border-2 border-[rgba(63,51,28,0.1)]"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#f4edde] flex items-center justify-center border-2 border-[rgba(63,51,28,0.1)]">
            <span className="font-['Exposure[-40]:Regular',sans-serif] text-[#3f331c] text-3xl">
              {profile?.display_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        {/* Name and Bio */}
        <div className="text-center">
          <h1 className="font-['Exposure[-40]:Regular',sans-serif] text-[#3f331c] text-4xl tracking-tight mb-2">
            {profile?.display_name || "User"}
          </h1>
          {profile?.bio && (
            <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#786237] text-base max-w-md">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Posts Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#FFFAEF] border border-[rgba(63,51,28,0.1)] rounded-lg p-6 animate-pulse"
            >
              <div className="h-7 bg-[#f4edde] rounded w-3/4 mb-3"></div>
              <div className="h-5 bg-[#f4edde] rounded w-1/2 mb-4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-[#f4edde] rounded"></div>
                <div className="h-4 bg-[#f4edde] rounded"></div>
                <div className="h-4 bg-[#f4edde] rounded w-2/3"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[rgba(63,51,28,0.1)]">
                <div className="h-4 bg-[#f4edde] rounded w-32"></div>
                <div className="h-4 bg-[#f4edde] rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#B42018] text-base">
            {error}
          </p>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 mb-6">
            <img 
              src="/icons/bear-with-pencil.svg" 
              alt="Bear with pencil" 
              className="w-full h-full"
            />
          </div>
          
          <h2 className="font-['Exposure[-40]:Regular',sans-serif] text-[#3f331c] text-2xl mb-2 text-center">
            No Post yet
          </h2>
          
          <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#786237] text-base mb-6 text-center max-w-sm">
            {isOwner 
              ? "Write something memorable"
              : `${profile?.display_name || "This user"} hasn't posted anything yet`
            }
          </p>

          {isOwner && (
            <a
              href="/write"
              className="flex items-center justify-center gap-2 bg-[#da5700] text-white px-6 py-3 rounded-[100px] font-['Exposure[-20]:Regular',sans-serif] text-base hover:bg-[#c44f00] transition-colors w-full max-w-sm"
            >
              <img src="/icons/write.svg" alt="" className="w-4 h-4" />
              Write a post
            </a>
          )}
        </div>
      ) : (
        /* Posts Grid */
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              title={post.title}
              subtitle={post.subtitle}
              content={post.content}
              commentCount={post.comment_count}
              createdAt={post.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}

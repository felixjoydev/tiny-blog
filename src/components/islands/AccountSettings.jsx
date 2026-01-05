import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSessionUser } from "../../lib/auth";

/**
 * AccountSettings - Profile settings page for authenticated users
 * @param {Object} props
 * @param {string} props.profileId - User's profile ID
 * @param {Object} props.initialProfile - Initial profile data
 */
export default function AccountSettings({ profileId, initialProfile }) {
  const [displayName, setDisplayName] = useState(initialProfile.display_name || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [avatarPath, setAvatarPath] = useState(initialProfile.avatar_path || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  // Track changes
  useEffect(() => {
    const nameChanged = displayName !== initialProfile.display_name;
    const bioChanged = bio !== (initialProfile.bio || "");
    const avatarChanged = avatarFile !== null;
    
    setHasChanges(nameChanged || bioChanged || avatarChanged);
  }, [displayName, bio, avatarFile, initialProfile]);

  // Get avatar URL
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (avatarPath) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
      return data.publicUrl;
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setError(null);
    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;

    try {
      // Delete from storage if exists
      if (avatarPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([avatarPath]);
        
        if (deleteError) throw deleteError;
      }

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_path: null })
        .eq('id', profileId);

      if (updateError) throw updateError;

      // Clear state
      setAvatarPath(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update initial profile
      initialProfile.avatar_path = null;
    } catch (err) {
      console.error('Delete avatar error:', err);
      setError('Failed to delete avatar');
    }
  };

  const uploadAvatar = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileId}/avatar.${fileExt}`;

    // Delete old avatar if exists
    if (avatarPath) {
      await supabase.storage.from('avatars').remove([avatarPath]);
    }

    // Upload new avatar
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return data.path;
  };

  const handleSave = async () => {
    // Validation
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (bio.length > 160) {
      setError('Bio must be 160 characters or less');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let newAvatarPath = avatarPath;

      // Upload avatar if changed
      if (avatarFile) {
        newAvatarPath = await uploadAvatar(avatarFile);
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio || null,
          avatar_path: newAvatarPath
        })
        .eq('id', profileId);

      if (updateError) throw updateError;

      // Update initial profile state
      initialProfile.display_name = displayName;
      initialProfile.bio = bio;
      initialProfile.avatar_path = newAvatarPath;

      // Reset change tracking
      setAvatarPath(newAvatarPath);
      setAvatarFile(null);
      setAvatarPreview(null);
      setHasChanges(false);
      
      // Optional: show success message or redirect
      // For now, just clear the saving state
      setSaving(false);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save changes');
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }

    // Get previous page from sessionStorage or use default
    const previousPage = sessionStorage.getItem('settings_referrer') || '/';
    const scrollPosition = sessionStorage.getItem('settings_scroll') || '0';

    // Clear storage
    sessionStorage.removeItem('settings_referrer');
    sessionStorage.removeItem('settings_scroll');

    // Navigate back with scroll restoration
    window.location.href = previousPage;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <>
      {/* Custom Navigation Bar */}
      <nav 
        className="fixed top-0 left-0 right-0 bg-[#FFF1D5] border-b border-[rgba(63,51,28,0.1)] z-50"
        style={{ height: 'var(--nav-height)' }}
      >
        <div className="max-w-125 mx-auto px-4 h-full flex items-center justify-between">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="text-[#3f331c] type-label hover:opacity-70 transition-opacity"
          >
            Close
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-[#da5700] text-white px-6 py-2.5 rounded-full type-label hover:bg-[#c24e00] transition-all disabled:cursor-not-allowed"
            style={{ opacity: hasChanges ? 1 : 0.5 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div 
        className="max-w-125 mx-auto px-4 py-12"
        style={{ paddingTop: 'calc(var(--nav-height) + 3rem)' }}
      >
        <h1 className="type-display-2 text-[#3f331c] mb-8">
          Account Settings
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-[#ffe5e5] border border-[#B42018] rounded-lg">
            <p className="type-label text-[#B42018]">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full bg-[#f4edde] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#786237] type-display-1">
                  {displayName.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#3f331c] text-white px-4 py-2 rounded-full type-label hover:bg-[#2f2715] transition-colors"
              >
                Upload Avatar
              </button>
              {avatarUrl && (
                <button
                  onClick={handleDeleteAvatar}
                  className="bg-[#B42018] text-white px-4 py-2 rounded-full type-label hover:bg-[#9a1c13] transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="type-meta-plain text-[#786237] text-center">
              Recommended: Square image, at least 400×400px
              <br />
              Max size: 2MB • Formats: JPEG, PNG, WebP
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label 
              htmlFor="displayName"
              className="block type-body text-[#3f331c]"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-3 bg-white border border-[rgba(63,51,28,0.2)] rounded-lg type-body text-[#3f331c] focus:outline-none focus:border-[#da5700] transition-colors"
              placeholder="Your display name"
            />
          </div>

          {/* Handle (Disabled) */}
          <div className="space-y-2">
            <label 
              htmlFor="handle"
              className="block type-body text-[#3f331c]"
            >
              Handle
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 type-body text-[#786237]">
                @
              </div>
              <input
                id="handle"
                type="text"
                value={initialProfile.handle || ""}
                disabled
                className="w-full pl-8 pr-4 py-3 bg-[#f4edde] border border-[rgba(63,51,28,0.1)] rounded-lg type-body text-[#786237] cursor-not-allowed opacity-60"
                placeholder="handle"
              />
            </div>
            <p className="type-meta-plain text-[#786237]">
              Handle cannot be changed at this time
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label 
              htmlFor="bio"
              className="block type-body text-[#3f331c]"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[rgba(63,51,28,0.2)] rounded-lg type-body text-[#3f331c] focus:outline-none focus:border-[#da5700] transition-colors resize-none"
              placeholder="Tell us about yourself"
            />
            <p className="type-meta-plain text-[#786237] text-right">
              {bio.length}/160
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

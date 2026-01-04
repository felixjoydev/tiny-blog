# Account Settings Implementation

## Overview

Complete implementation of user account settings page allowing authenticated users to manage their profile (avatar, display name, bio). Handle field is intentionally disabled.

## Features Implemented

### 1. Settings Route (`src/pages/accounts/index.astro`)

- **SSR enabled**: `export const prerender = false`
- **Authentication guard**: Redirects to `/auth` if not logged in
- **Onboarding check**: Redirects to `/accounts/setup` if not onboarded
- **Profile data fetch**: Loads handle, display_name, bio, avatar_path
- **Props passed to AccountSettings**:
  - `profileId`: User's profile UUID
  - `initialProfile`: Complete profile object for change tracking

### 2. AccountSettings Component (`src/components/islands/AccountSettings.jsx`)

#### State Management (10+ variables)

- `displayName`: Editable user display name
- `bio`: Editable bio text (max 160 chars)
- `avatarPath`: Current avatar path in storage
- `avatarFile`: New avatar file to upload
- `avatarPreview`: Preview URL for new avatar
- `loading`, `saving`, `error`: UI states
- `hasChanges`: Boolean tracking if any field was modified
- `uploadProgress`: Avatar upload progress

#### Custom Navigation Bar

- **Left**: Close button with unsaved changes confirmation
- **Right**: Save button with opacity control
  - Opacity 1.0 when `hasChanges === true`
  - Opacity 0.5 when `hasChanges === false`
  - Disabled when no changes or saving

#### Change Detection

- `useEffect` hook compares current values to `initialProfile`
- Triggers on displayName, bio, or avatarFile changes
- Updates `hasChanges` state automatically

#### Avatar Management

- **Upload**: 2MB limit, JPEG/PNG/WebP only
- **Preview**: Shows preview before saving
- **Delete**: Removes avatar from storage and database
- **Circular display**: 160px × 160px with fallback to first letter

#### Form Fields

1. **Display Name**

   - Required field
   - Max 50 characters
   - Fully editable

2. **Handle**

   - Read-only (disabled)
   - Displayed with @ prefix
   - Grayed out with explanatory text

3. **Bio**
   - Optional field
   - Max 160 characters
   - Character counter (e.g., "42/160")
   - Multiline textarea

#### Save Flow

1. Validate inputs (display name required, bio ≤ 160 chars)
2. Upload new avatar to storage if changed
3. Delete old avatar if exists and replaced
4. Update database with new values
5. Update `initialProfile` state to reset change tracking
6. Clear `hasChanges` flag

#### Close Flow

1. Check if `hasChanges === true`
2. If true, show confirmation dialog
3. Retrieve previous page from sessionStorage
4. Retrieve scroll position from sessionStorage
5. Navigate back (browser will restore scroll)

### 3. Navigation Integration (`src/components/islands/NavActions.jsx`)

#### Updated Settings Link

- Changed from `/settings` to `/accounts`
- Added scroll position tracking on click:
  ```jsx
  sessionStorage.setItem("settings_scroll", window.scrollY.toString());
  sessionStorage.setItem("settings_referrer", window.location.pathname);
  ```

### 4. Profile Utilities (`src/lib/profileUtils.js`)

#### Added updateProfile Function

```javascript
updateProfile(supabase, userId, updates);
```

- Parameters:
  - `supabase`: Supabase client instance
  - `userId`: User's UUID
  - `updates`: Object with fields to update
- Returns: `{ data, error }`
- Handles profile updates with proper error handling

## User Flow

### Accessing Settings

1. User clicks avatar in navigation
2. Dropdown appears with "Settings" option
3. Click "Settings" → saves scroll position → navigates to `/accounts`
4. Route checks authentication → checks onboarding → loads profile
5. AccountSettings component renders with current profile data

### Editing Profile

1. User changes display name, bio, or uploads new avatar
2. `hasChanges` state automatically updates to `true`
3. Save button becomes fully opaque (enabled)
4. User clicks "Save"
5. Avatar uploads to storage (if new)
6. Database updates with new values
7. `hasChanges` resets to `false`
8. Save button returns to 0.5 opacity (disabled)

### Closing Without Saving

1. User makes changes (`hasChanges === true`)
2. User clicks "Close"
3. Confirmation dialog: "You have unsaved changes. Discard them?"
4. If canceled → stays on page
5. If confirmed → navigates back with scroll restoration

### Closing With Saved Changes

1. No unsaved changes (`hasChanges === false`)
2. User clicks "Close"
3. Immediately navigates back (no confirmation)
4. Scroll position restored from sessionStorage

## Security

### Route Level (accounts/index.astro)

- Server-side authentication check
- Validates user session exists
- Validates profile is onboarded
- Only loads profile data for authenticated user

### Database Level (RLS)

- Profiles table has Row Level Security
- Users can only update their own profile
- `auth.uid()` must match `profiles.id`

### Storage Level

- Avatar uploads follow path pattern: `{userId}/avatar.{ext}`
- Storage policies ensure users can only upload to their own folder
- Storage policies ensure users can only delete their own files

## Files Modified

### Created

1. `src/pages/accounts/index.astro` - Settings route
2. `src/components/islands/AccountSettings.jsx` - Settings UI
3. `ACCOUNT_SETTINGS.md` - This documentation

### Updated

1. `src/components/islands/NavActions.jsx` - Added settings link with scroll tracking
2. `src/lib/profileUtils.js` - Added updateProfile function

## Testing Checklist

- [ ] Logged out user accessing `/accounts` → redirects to `/auth`
- [ ] Logged in but not onboarded user → redirects to `/accounts/setup`
- [ ] Settings page loads current profile data correctly
- [ ] Handle field is disabled and grayed out
- [ ] Display name changes update `hasChanges` to `true`
- [ ] Bio changes update `hasChanges` to `true`
- [ ] Avatar upload shows preview immediately
- [ ] Save button opacity changes with `hasChanges`
- [ ] Save button is disabled when no changes
- [ ] Saving updates database and storage correctly
- [ ] After saving, changes are visible across app (profile pages, nav avatar)
- [ ] Close with unsaved changes shows confirmation
- [ ] Close without changes navigates immediately
- [ ] Scroll position is restored when returning from settings
- [ ] Avatar delete removes from storage and database
- [ ] Character counter updates correctly for bio
- [ ] Validation prevents empty display name
- [ ] Validation prevents bio > 160 characters
- [ ] File size validation prevents uploads > 2MB
- [ ] File type validation only allows JPEG/PNG/WebP

## Known Limitations

1. **Handle cannot be changed**: Intentionally disabled for now. Future work could add handle change flow with alias creation.

2. **No email/password management**: Account credentials are managed through Supabase Auth UI, not in settings. Future work could add these if needed.

3. **Single avatar only**: System supports one avatar per user. Future work could add avatar history or multiple profile pictures.

4. **No image cropping**: Avatar upload accepts any square or rectangular image. Future work could add client-side cropping tool.

## Related Documentation

- See `SLUG_IMPLEMENTATION.md` for slug system
- See `database-design.instructions.md` for complete database schema
- See Supabase Storage docs for storage policies

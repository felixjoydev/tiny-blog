# Slug Implementation Summary

## Overview

The slug system enables pretty URLs for posts using the format `/u/<handle>/<slug>`. The implementation includes:

- Automatic slug generation from post titles
- Slug aliases to preserve old URLs when slugs change
- Profile handle aliases for future username changes
- Centralized slug management via Postgres RPCs

## Database Schema

### posts table

- Added `slug` TEXT column (nullable initially, becomes NOT NULL after backfill)
- Unique constraint on `(author_id, slug)` - same slug allowed for different authors
- Maximum length: 50 characters

### post_slug_aliases table

```sql
- id (uuid, primary key)
- post_id (uuid, references posts ON DELETE CASCADE)
- author_id (uuid, references profiles ON DELETE CASCADE)
- old_slug (text)
- created_at (timestamptz)
- Unique constraint on (author_id, old_slug)
- RLS: public read, no insert/update/delete
```

### profile_handle_aliases table

```sql
- id (uuid, primary key)
- profile_id (uuid, references profiles ON DELETE CASCADE)
- old_handle (text)
- created_at (timestamptz)
- Unique constraint on old_handle
- RLS: public read, no insert/update/delete
```

## RPC Functions

### create_post_with_slug(...)

Called when creating new posts. Ensures slug uniqueness by:

1. Checking if slug exists for this author
2. If conflict, appends `-2`, `-3`, etc. until unique
3. Inserts post with the unique slug
4. Returns JSON: `{data: {...}, error: null}` or `{data: null, error: "..."}`

### update_post_with_slug(...)

Called when editing post title/slug. Handles:

1. Fetches current slug
2. If slug changed, inserts old slug into `post_slug_aliases`
3. Ensures new slug is unique (adds counter suffix if needed)
4. Updates post with new slug
5. Returns JSON: `{data: {...}, error: null}` or `{data: null, error: "..."}`

## Frontend Utilities

### lib/slugify.js

#### generateSlug(title)

- Converts title to URL-friendly slug
- Lowercases, replaces special chars with hyphens
- Truncates to 50 chars max
- Fallback to `post-<shortid>` if title produces empty slug

#### checkSlugAvailability(authorId, slug, excludePostId)

- Queries both `posts` and `post_slug_aliases` tables
- Returns true if slug is available for this author
- Excludes current post when editing (via excludePostId)

#### generateUniqueSlug(authorId, title, excludePostId)

- Calls generateSlug(title) to get base slug
- Calls checkSlugAvailability in loop
- Appends `-2`, `-3`, etc. until unique
- Returns the unique slug

### lib/posts.js Updates

#### createPost(title, subtitle, content, authorId, slug)

- Calls `create_post_with_slug` RPC
- RPC handles slug uniqueness validation

#### updatePostWithSlug(id, title, slug)

- Calls `update_post_with_slug` RPC
- RPC creates alias for old slug before updating

#### updatePostContent(id, subtitle, content)

- Direct Supabase update for non-slug fields
- Separate from slug updates to avoid conflicts

## Routing

### /u/[handle]/[slug].astro (canonical)

1. Resolves handle to profile UUID (checks alias if not found)
2. If handle is an alias, 301 redirect to current handle
3. Queries posts for matching slug
4. If not found, checks post_slug_aliases
5. If alias found, 301 redirect to current slug URL
6. Renders post if found, 404 otherwise

### /post/[id].astro (UUID fallback)

- Fetches post with handle and slug
- If both present, 302 redirect to `/u/<handle>/<slug>`
- Otherwise renders inline (backward compatibility)

### /u/[handle].astro

- Fetches profile by handle
- If not found, checks profile_handle_aliases
- If alias found, 301 redirect to current handle
- Renders profile page if found, 404 otherwise

## UI Components

### PostEditor.jsx

**Create Mode:**

- Generates slug preview from title (debounced 500ms)
- Shows availability indicator (checking/available/taken)
- Calls `generateUniqueSlug()` before creating post
- Uses `createPost()` which calls RPC

**Edit Mode:**

- Shows slug preview below title
- Warns about URL changes
- Split update:
  1. Title/slug → `updatePostWithSlug()` RPC (creates alias)
  2. Subtitle/content → `updatePostContent()` direct update

### PostCard.jsx

- Updated to accept `authorHandle` and `slug` props
- Links to `/u/<handle>/<slug>` when available
- Falls back to `/post/<id>` for old posts

### ProfilePage.jsx

- Passes `authorHandle` and `slug` to PostCard components
- Gets data from `getPostsByAuthor()` which includes profiles.handle

## Redirect Strategy

### 301 Permanent Redirects (SEO-friendly)

- Old slug → new slug: `/u/handle/old-slug` → `/u/handle/new-slug`
- Old handle → new handle: `/u/old-handle` → `/u/new-handle`
- Combination: `/u/old-handle/old-slug` → `/u/new-handle/slug`

### 302 Temporary Redirects (targets can change)

- UUID post → canonical: `/post/<uuid>` → `/u/handle/slug`
- Reason: slug can change, so URL target is not permanent

### 307 Temporary Redirects (preserve method)

- UUID profile → handle: `/profile/<uuid>` → `/u/handle`
- Reason: handle can change, so URL target is not permanent

## Migration Order

Run these in order:

1. `migrations/add_post_slugs_and_aliases.sql` - Creates tables and columns
2. `migrations/create_post_slug_rpcs.sql` - Creates RPC functions
3. `migrations/backfill_post_slugs.sql` - Generates slugs for existing posts

## Testing Checklist

- [ ] Create new post → slug generated from title
- [ ] Edit post title → old slug becomes alias, new slug assigned
- [ ] Visit old slug URL → redirects to new slug (301)
- [ ] Visit UUID post URL → redirects to canonical slug URL (302)
- [ ] Multiple posts with same title → unique slugs with `-2`, `-3` suffixes
- [ ] Empty title → generates `post-<shortid>` slug
- [ ] Profile route by handle works
- [ ] Old handle redirects to new handle (when implemented)
- [ ] PostCard links to canonical URLs
- [ ] Slug preview shows in editor
- [ ] Slug availability checking works

## Future Enhancements

1. **Handle changes:** Add UI for users to change their handle

   - Automatically creates entry in profile_handle_aliases
   - Old handle URLs redirect to new handle (301)

2. **Slug customization:** Allow manual slug editing in PostEditor

   - Validate slug format on client and server
   - Show availability in real-time

3. **SEO metadata:** Add canonical link tags to all post pages

   - Points to `/u/<handle>/<slug>` as canonical
   - Helps search engines understand preferred URL

4. **Analytics:** Track redirect hits to identify popular old URLs
   - Could inform URL stability strategies

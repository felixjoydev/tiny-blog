-- Add slug-based URLs for posts with alias tracking
-- Part 1: Add slug column to posts table

-- Add slug column (nullable initially for backfill)
ALTER TABLE public.posts
ADD COLUMN slug text;

-- Add check constraint for slug format (lowercase, alphanumeric, hyphens, max 50 chars)
ALTER TABLE public.posts
ADD CONSTRAINT slug_format_check 
CHECK (slug ~* '^[a-z0-9-]{1,50}$');

-- Create unique index on (author_id, slug) - same slug allowed for different authors
CREATE UNIQUE INDEX posts_author_slug_idx ON public.posts (author_id, slug);

-- Create index for slug lookups
CREATE INDEX posts_slug_idx ON public.posts (slug);

-- Comment for documentation
COMMENT ON COLUMN public.posts.slug IS 'URL-friendly slug generated from title. Max 50 chars, lowercase alphanumeric + hyphens. Unique per author.';

-- Part 2: Create post_slug_aliases table for tracking old slugs

CREATE TABLE public.post_slug_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure slug format
  CONSTRAINT alias_slug_format_check CHECK (slug ~* '^[a-z0-9-]{1,50}$')
);

-- Unique constraint: one author cannot reuse an aliased slug
CREATE UNIQUE INDEX post_slug_aliases_author_slug_idx ON public.post_slug_aliases (author_id, slug);

-- Index for fast alias lookups
CREATE INDEX post_slug_aliases_post_idx ON public.post_slug_aliases (post_id);
CREATE INDEX post_slug_aliases_author_idx ON public.post_slug_aliases (author_id);

-- Comment
COMMENT ON TABLE public.post_slug_aliases IS 'Tracks old post slugs to maintain permanent redirects when titles change.';

-- RLS policies for post_slug_aliases
ALTER TABLE public.post_slug_aliases ENABLE ROW LEVEL SECURITY;

-- Anyone can read aliases (needed for public slug resolution)
CREATE POLICY "Aliases are publicly readable"
  ON public.post_slug_aliases FOR SELECT
  USING (true);

-- Only system/RPC can insert aliases (users don't directly manage this)
-- This will be handled by the RPC functions

-- Part 3: Create profile_handle_aliases table for future handle changes

CREATE TABLE public.profile_handle_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure handle format (same as profiles.handle)
  CONSTRAINT alias_handle_format_check CHECK (handle ~* '^[a-z0-9_]{3,20}$')
);

-- Index for fast handle alias lookups
CREATE INDEX profile_handle_aliases_profile_idx ON public.profile_handle_aliases (profile_id);
CREATE INDEX profile_handle_aliases_handle_idx ON public.profile_handle_aliases (handle);

-- Comment
COMMENT ON TABLE public.profile_handle_aliases IS 'Tracks old profile handles to maintain permanent redirects when handles change.';

-- RLS policies for profile_handle_aliases
ALTER TABLE public.profile_handle_aliases ENABLE ROW LEVEL SECURITY;

-- Anyone can read handle aliases (needed for public profile resolution)
CREATE POLICY "Handle aliases are publicly readable"
  ON public.profile_handle_aliases FOR SELECT
  USING (true);

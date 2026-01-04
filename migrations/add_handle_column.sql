-- Add handle column to profiles table
-- Handles are user-friendly profile identifiers (e.g., @username)
-- Format: lowercase letters, numbers, underscore only, 3-20 characters

-- Add handle column (nullable initially for existing users)
ALTER TABLE public.profiles
ADD COLUMN handle text;

-- Add check constraint for handle format
ALTER TABLE public.profiles
ADD CONSTRAINT handle_format_check 
CHECK (handle ~* '^[a-z0-9_]{3,20}$');

-- Add unique constraint
ALTER TABLE public.profiles
ADD CONSTRAINT handle_unique UNIQUE (handle);

-- Create index for fast handle lookups
CREATE INDEX profiles_handle_idx ON public.profiles (handle);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.handle IS 'User-friendly profile identifier. Format: lowercase letters, numbers, underscore. 3-20 chars. Immutable once set.';

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS comments_post_created_idx ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_author_idx ON public.comments (author_id);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments

-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
ON public.comments
FOR SELECT
USING (true);

-- Only authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
    auth.uid() = author_id
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments OR post owners can delete any comment on their posts
CREATE POLICY "Users can delete own comments or post owner can delete"
ON public.comments
FOR DELETE
USING (
    auth.uid() = author_id 
    OR 
    auth.uid() IN (
        SELECT author_id 
        FROM public.posts 
        WHERE id = comments.post_id
    )
);

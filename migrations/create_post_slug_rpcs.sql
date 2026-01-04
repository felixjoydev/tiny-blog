-- RPC function to create a post with unique slug generation
-- Ensures slug is unique for the author across current slugs and aliases

CREATE OR REPLACE FUNCTION public.create_post_with_slug(
  p_title text,
  p_subtitle text,
  p_content text,
  p_slug text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_unique_slug text;
  v_counter int := 2;
  v_post_id uuid;
  v_result json;
BEGIN
  -- Get authenticated user
  v_author_id := auth.uid();
  
  IF v_author_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Not authenticated',
      'data', null
    );
  END IF;
  
  -- Start with provided slug
  v_unique_slug := p_slug;
  
  -- Check uniqueness and add suffix if needed
  WHILE EXISTS (
    SELECT 1 FROM posts 
    WHERE author_id = v_author_id AND slug = v_unique_slug
  ) OR EXISTS (
    SELECT 1 FROM post_slug_aliases
    WHERE author_id = v_author_id AND slug = v_unique_slug
  ) LOOP
    v_unique_slug := p_slug || '-' || v_counter;
    v_counter := v_counter + 1;
    
    -- Safety: prevent infinite loop
    IF v_counter > 1000 THEN
      RETURN json_build_object(
        'error', 'Could not generate unique slug',
        'data', null
      );
    END IF;
  END LOOP;
  
  -- Insert post with unique slug
  INSERT INTO posts (title, subtitle, content, author_id, slug)
  VALUES (p_title, p_subtitle, p_content, v_author_id, v_unique_slug)
  RETURNING id INTO v_post_id;
  
  -- Return success with post ID and final slug
  RETURN json_build_object(
    'data', json_build_object(
      'id', v_post_id,
      'slug', v_unique_slug
    ),
    'error', null
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'data', null
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_post_with_slug TO authenticated;

-- RPC function to update post title and slug, creating alias for old slug
-- Only updates title and slug - other fields handled separately

CREATE OR REPLACE FUNCTION public.update_post_with_slug(
  p_post_id uuid,
  p_title text,
  p_new_slug text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_current_slug text;
  v_unique_slug text;
  v_counter int := 2;
BEGIN
  -- Get authenticated user
  v_author_id := auth.uid();
  
  IF v_author_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Not authenticated',
      'data', null
    );
  END IF;
  
  -- Verify ownership and get current slug
  SELECT slug INTO v_current_slug
  FROM posts
  WHERE id = p_post_id AND author_id = v_author_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Post not found or access denied',
      'data', null
    );
  END IF;
  
  -- If slug is changing, we need to ensure uniqueness and create alias
  IF v_current_slug IS DISTINCT FROM p_new_slug THEN
    v_unique_slug := p_new_slug;
    
    -- Check uniqueness (excluding current post's slug) and add suffix if needed
    WHILE EXISTS (
      SELECT 1 FROM posts 
      WHERE author_id = v_author_id 
        AND slug = v_unique_slug 
        AND id != p_post_id
    ) OR EXISTS (
      SELECT 1 FROM post_slug_aliases
      WHERE author_id = v_author_id AND slug = v_unique_slug
    ) LOOP
      v_unique_slug := p_new_slug || '-' || v_counter;
      v_counter := v_counter + 1;
      
      -- Safety: prevent infinite loop
      IF v_counter > 1000 THEN
        RETURN json_build_object(
          'error', 'Could not generate unique slug',
          'data', null
        );
      END IF;
    END LOOP;
    
    -- Create alias for old slug (if it exists and is different)
    IF v_current_slug IS NOT NULL THEN
      INSERT INTO post_slug_aliases (post_id, author_id, slug)
      VALUES (p_post_id, v_author_id, v_current_slug)
      ON CONFLICT (author_id, slug) DO NOTHING; -- Skip if alias already exists
    END IF;
  ELSE
    -- No slug change, keep current
    v_unique_slug := v_current_slug;
  END IF;
  
  -- Update post with new title and slug
  UPDATE posts
  SET 
    title = p_title,
    slug = v_unique_slug,
    updated_at = now()
  WHERE id = p_post_id AND author_id = v_author_id;
  
  -- Return success with final slug
  RETURN json_build_object(
    'data', json_build_object(
      'slug', v_unique_slug
    ),
    'error', null
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'data', null
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_post_with_slug TO authenticated;

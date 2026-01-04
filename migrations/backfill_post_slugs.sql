-- Backfill slugs for existing posts
-- This migration generates unique slugs for all posts that don't have one yet

DO $$
DECLARE
  post_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INT;
  slug_exists BOOLEAN;
BEGIN
  -- Process each post that doesn't have a slug
  FOR post_record IN 
    SELECT id, author_id, title 
    FROM posts 
    WHERE slug IS NULL OR slug = ''
    ORDER BY created_at ASC
  LOOP
    -- Generate base slug from title
    base_slug := LOWER(TRIM(post_record.title));
    
    -- Replace spaces and special chars with hyphens
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
    
    -- Remove leading/trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Truncate to 50 chars
    IF LENGTH(base_slug) > 50 THEN
      base_slug := SUBSTRING(base_slug FROM 1 FOR 50);
      base_slug := TRIM(BOTH '-' FROM base_slug);
    END IF;
    
    -- Fallback if slug is empty
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'post-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    END IF;
    
    -- Ensure uniqueness within author's posts
    final_slug := base_slug;
    counter := 2;
    
    LOOP
      -- Check if slug exists for this author
      SELECT EXISTS(
        SELECT 1 FROM posts 
        WHERE author_id = post_record.author_id 
          AND slug = final_slug 
          AND id != post_record.id
      ) INTO slug_exists;
      
      IF NOT slug_exists THEN
        EXIT;
      END IF;
      
      -- Add counter suffix and try again
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
      
      -- Safety limit
      IF counter > 1000 THEN
        final_slug := base_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
        EXIT;
      END IF;
    END LOOP;
    
    -- Update the post with the generated slug
    UPDATE posts 
    SET slug = final_slug 
    WHERE id = post_record.id;
    
    RAISE NOTICE 'Generated slug "%" for post %', final_slug, post_record.id;
  END LOOP;
END $$;

-- Make slug NOT NULL after backfill
ALTER TABLE posts ALTER COLUMN slug SET NOT NULL;

-- Verify results
DO $$
DECLARE
  null_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM posts WHERE slug IS NULL;
  SELECT COUNT(*) INTO total_count FROM posts;
  
  RAISE NOTICE 'Backfill complete: % posts total, % without slugs', total_count, null_count;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill failed: % posts still have null slugs', null_count;
  END IF;
END $$;

-- Create RPC function for vector similarity search
-- This function finds products similar to a given image embedding
-- Run this script in your Supabase SQL Editor after running 019_enable_pgvector_for_image_search.sql

-- Drop function if exists to allow updates
DROP FUNCTION IF EXISTS match_products_by_image;

-- Create function to search for similar products using vector similarity
-- Uses cosine similarity (1 - cosine distance) to find matches
CREATE OR REPLACE FUNCTION match_products_by_image(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.70,
  match_count int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price decimal,
  image_url text,
  images text[],
  category text,
  brand text,
  condition text,
  seller_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    p.price,
    p.image_url,
    p.images,
    p.category,
    p.brand,
    p.condition,
    p.seller_id,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE 
    p.embedding IS NOT NULL
    AND p.is_active = true
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION match_products_by_image IS 'Finds products visually similar to a given image embedding using cosine similarity. Returns products above the similarity threshold, ordered by similarity score.';

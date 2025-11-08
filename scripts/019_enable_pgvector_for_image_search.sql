-- Enable pgvector extension for vector similarity search
-- This enables image search using OpenAI embeddings (like Amazon/Alibaba)
-- Run this script in your Supabase SQL Editor

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products table
-- Using vector(1536) for OpenAI text-embedding-3-large model
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for faster vector similarity search using HNSW (Hierarchical Navigable Small World)
-- This index dramatically speeds up similarity searches
CREATE INDEX IF NOT EXISTS products_embedding_idx 
ON public.products 
USING hnsw (embedding vector_cosine_ops);

-- Add comment to explain the column
COMMENT ON COLUMN public.products.embedding IS 'Vector embedding (1536 dimensions) generated from product image using OpenAI text-embedding-3-small model for visual similarity search';

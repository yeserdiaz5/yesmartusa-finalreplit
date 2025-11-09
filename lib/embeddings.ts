/**
 * Utilities for generating product embeddings using Hugging Face CLIP
 * 
 * Uses the free OpenCLIP ViT-B/32 model from Hugging Face to generate
 * image embeddings for visual similarity search.
 * 
 * Model: openai/clip-vit-base-patch32
 * Dimensions: 512 (CLIP ViT-B/32 standard)
 */

import { generateImageEmbeddingFromUrl } from "./huggingface"
import { upsertProductEmbedding } from "./pinecone"

/**
 * Generate an embedding for a product image using Hugging Face CLIP
 * @param imageUrl - URL of the product image
 * @returns The embedding vector (512 dimensions) or null if failed
 */
export async function generateProductEmbedding(imageUrl: string): Promise<number[] | null> {
  return generateImageEmbeddingFromUrl(imageUrl)
}

/**
 * Update a product's embedding in Pinecone vector database
 * @param supabase - Supabase client (unused, kept for backwards compatibility)
 * @param productId - Product ID
 * @param imageUrl - Product image URL
 * @returns Success status
 */
export async function updateProductEmbedding(
  supabase: any,
  productId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    const embedding = await generateProductEmbedding(imageUrl)

    if (!embedding) {
      console.error("[Embeddings] Failed to generate embedding")
      return false
    }

    // Upsert to Pinecone instead of Supabase
    const success = await upsertProductEmbedding(productId, embedding, {
      image_url: imageUrl,
    })

    if (!success) {
      console.error("[Embeddings] Error upserting embedding to Pinecone")
      return false
    }

    console.log(`[Embeddings] Successfully updated embedding for product ${productId} in Pinecone`)
    return true
  } catch (error) {
    console.error("[Embeddings] Error in updateProductEmbedding:", error)
    return false
  }
}

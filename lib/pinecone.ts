/**
 * Pinecone Vector Database Integration
 * 
 * Manages the Pinecone vector database for image similarity search.
 * Index: yesmart-images
 * Dimensions: 512 (matching CLIP ViT-B/32)
 */

import { Pinecone } from "@pinecone-database/pinecone"

let pineconeClient: Pinecone | null = null

/**
 * Get or initialize the Pinecone client
 */
export function getPineconeClient(): Pinecone {
  if (pineconeClient) {
    return pineconeClient
  }

  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY not configured")
  }

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  return pineconeClient
}

/**
 * Get the Pinecone index for product images
 */
export function getProductsIndex() {
  const client = getPineconeClient()
  return client.index("yesmart-images")
}

/**
 * Upsert a product embedding into Pinecone
 * @param productId - Product ID
 * @param embedding - Image embedding vector (512 dimensions)
 * @param metadata - Optional metadata (title, price, etc.)
 */
export async function upsertProductEmbedding(
  productId: string,
  embedding: number[],
  metadata?: Record<string, any>
) {
  try {
    const index = getProductsIndex()

    await index.upsert([
      {
        id: productId,
        values: embedding,
        metadata: metadata || {},
      },
    ])

    console.log(`[Pinecone] Upserted embedding for product ${productId}`)
    return true
  } catch (error) {
    console.error("[Pinecone] Error upserting embedding:", error)
    return false
  }
}

/**
 * Search for similar products by image embedding
 * @param embedding - Query embedding vector (512 dimensions)
 * @param topK - Number of results to return (default: 20)
 * @param minScore - Minimum similarity score (default: 0.7)
 * @returns Array of product IDs with similarity scores
 */
export async function searchSimilarProducts(
  embedding: number[],
  topK: number = 20,
  minScore: number = 0.7
): Promise<Array<{ id: string; score: number }>> {
  try {
    const index = getProductsIndex()

    const queryResponse = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    })

    // Filter by minimum score and map to product IDs
    const results = queryResponse.matches
      .filter((match) => match.score && match.score >= minScore)
      .map((match) => ({
        id: match.id,
        score: match.score || 0,
      }))

    console.log(`[Pinecone] Found ${results.length} similar products (min score: ${minScore})`)
    
    return results
  } catch (error) {
    console.error("[Pinecone] Error searching similar products:", error)
    return []
  }
}

/**
 * Delete a product embedding from Pinecone
 * @param productId - Product ID to delete
 */
export async function deleteProductEmbedding(productId: string) {
  try {
    const index = getProductsIndex()
    await index.deleteOne(productId)
    console.log(`[Pinecone] Deleted embedding for product ${productId}`)
    return true
  } catch (error) {
    console.error("[Pinecone] Error deleting embedding:", error)
    return false
  }
}

/**
 * Batch upsert multiple product embeddings
 * @param products - Array of products with embeddings
 */
export async function batchUpsertProductEmbeddings(
  products: Array<{ id: string; embedding: number[]; metadata?: Record<string, any> }>
) {
  try {
    const index = getProductsIndex()

    const vectors = products.map((product) => ({
      id: product.id,
      values: product.embedding,
      metadata: product.metadata || {},
    }))

    await index.upsert(vectors)

    console.log(`[Pinecone] Batch upserted ${products.length} product embeddings`)
    return true
  } catch (error) {
    console.error("[Pinecone] Error batch upserting embeddings:", error)
    return false
  }
}

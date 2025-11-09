/**
 * Hugging Face CLIP Integration for Image Embeddings
 * 
 * Uses the free OpenCLIP ViT-B/32 model from Hugging Face
 * to generate image embeddings for visual similarity search.
 * 
 * Model: openai/clip-vit-base-patch32
 * Dimensions: 512 (CLIP-ViT-B/32 standard)
 * API: https://api-inference.huggingface.co
 */

/**
 * Generate an embedding for an image using Hugging Face CLIP
 * @param imageBase64 - Base64 encoded image (with or without data URI prefix)
 * @param retries - Number of retries for model loading (default: 3)
 * @returns The embedding vector (512 dimensions) or null if failed
 */
export async function generateImageEmbedding(
  imageBase64: string,
  retries: number = 3
): Promise<number[] | null> {
  try {
    if (!process.env.HUGGINGFACE_TOKEN) {
      console.error("[HuggingFace] HUGGINGFACE_TOKEN not configured")
      return null
    }

    // Remove data URI prefix if present to get raw base64
    const base64Data = imageBase64.startsWith("data:") 
      ? imageBase64.split(",")[1] 
      : imageBase64

    // Convert base64 to binary
    const binaryData = Buffer.from(base64Data, "base64")

    console.log("[HuggingFace] Generating embedding with CLIP model...")

    // Try multiple times if model is loading
    for (let attempt = 0; attempt <= retries; attempt++) {
      // Call Hugging Face Inference API
      const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
            "Content-Type": "application/octet-stream",
          },
          body: binaryData,
        }
      )

      if (response.ok) {
        const result = await response.json()

        // Hugging Face feature-extraction returns batched arrays: [[...512 floats...]]
        // We need to extract the first (and only) embedding from the batch
        let embedding: number[]
        
        if (Array.isArray(result) && Array.isArray(result[0])) {
          // Nested array - extract the inner array
          embedding = result[0]
        } else if (Array.isArray(result)) {
          // Already flat array (shouldn't happen with CLIP, but handle it)
          embedding = result
        } else {
          console.error("[HuggingFace] Invalid embedding format:", result)
          return null
        }

        // Validate embedding dimensions (CLIP ViT-B/32 = 512 dimensions)
        if (!Array.isArray(embedding) || embedding.length !== 512) {
          console.error(`[HuggingFace] Invalid embedding dimensions: expected 512, got ${embedding?.length || 0}`)
          return null
        }

        console.log(`[HuggingFace] Successfully generated ${embedding.length}-dimensional CLIP embedding`)
        
        return embedding
      }

      // Handle errors
      const errorText = await response.text()
      
      // Handle model loading state (503)
      if (response.status === 503) {
        if (attempt < retries) {
          const waitTime = Math.min(5000 * (attempt + 1), 20000) // 5s, 10s, 15s (max 20s)
          console.log(`[HuggingFace] Model is loading (attempt ${attempt + 1}/${retries + 1}), waiting ${waitTime/1000}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        } else {
          console.error("[HuggingFace] Model loading timeout after retries")
          return null
        }
      }
      
      // Other errors - don't retry
      console.error("[HuggingFace] API error:", response.status, errorText)
      return null
    }

    return null
  } catch (error) {
    console.error("[HuggingFace] Error generating embedding:", error)
    return null
  }
}

/**
 * Generate an embedding for an image URL
 * @param imageUrl - URL of the image
 * @returns The embedding vector (512 dimensions) or null if failed
 */
export async function generateImageEmbeddingFromUrl(imageUrl: string): Promise<number[] | null> {
  try {
    // Fetch the image
    console.log("[HuggingFace] Fetching image from URL:", imageUrl)
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      console.error(`[HuggingFace] Failed to fetch image: ${imageResponse.statusText}`)
      return null
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")

    return generateImageEmbedding(base64Image)
  } catch (error) {
    console.error("[HuggingFace] Error generating embedding from URL:", error)
    return null
  }
}

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
 * @returns The embedding vector (512 dimensions) or null if failed
 */
export async function generateImageEmbedding(imageBase64: string): Promise<number[] | null> {
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[HuggingFace] API error:", response.status, errorText)
      
      // Handle model loading state
      if (response.status === 503) {
        console.log("[HuggingFace] Model is loading, this may take a few seconds...")
        return null
      }
      
      return null
    }

    const embedding = await response.json()

    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error("[HuggingFace] Invalid embedding format:", embedding)
      return null
    }

    // CLIP ViT-B/32 produces 512-dimensional embeddings
    console.log(`[HuggingFace] Generated embedding with ${embedding.length} dimensions`)
    
    return embedding
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

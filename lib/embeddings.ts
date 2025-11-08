/**
 * Utilities for generating product embeddings using OpenAI
 * 
 * This uses a two-step process:
 * 1. GPT-4o Vision analyzes the image and generates a detailed textual description
 * 2. text-embedding-3-small creates an embedding from that description (1536 dimensions)
 * 
 * This approach ensures semantically meaningful embeddings for visual similarity search.
 */

import OpenAI from "openai"

/**
 * Generate a detailed textual description of a product image using GPT-4o Vision
 * @param imageUrl - URL of the product image
 * @param openai - OpenAI client
 * @returns Detailed textual description or null if failed
 */
async function generateImageDescription(imageUrl: string, openai: OpenAI): Promise<string | null> {
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error(`[Embeddings] Failed to fetch image: ${imageResponse.statusText}`)
      return null
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:image/jpeg;base64,${base64Image}`

    // Use GPT-4o Vision to analyze the image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image in detail. Provide a comprehensive description that captures:
1. Product type and category
2. Visual characteristics (color, shape, material, texture, design)
3. Brand or distinguishing marks if visible
4. Condition and quality indicators
5. Key features and details that make this product unique
6. Any text, logos, or patterns visible
7. Overall style and aesthetic

Generate a detailed, keyword-rich description that will help find visually similar products. Focus on objective visual features rather than subjective opinions.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    })

    const description = visionResponse.choices[0]?.message?.content

    if (!description) {
      console.error("[Embeddings] No description generated from vision model")
      return null
    }

    console.log(`[Embeddings] Generated description: ${description.substring(0, 100)}...`)
    return description
  } catch (error) {
    console.error("[Embeddings] Error generating image description:", error)
    return null
  }
}

/**
 * Generate an embedding for a product image
 * @param imageUrl - URL of the product image
 * @returns The embedding vector or null if failed
 */
export async function generateProductEmbedding(imageUrl: string): Promise<number[] | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Embeddings] OPENAI_API_KEY not configured")
      return null
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Step 1: Generate textual description of the image using Vision
    const description = await generateImageDescription(imageUrl, openai)
    
    if (!description) {
      return null
    }

    // Step 2: Generate embedding from the textual description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
      encoding_format: "float",
    })

    const embedding = embeddingResponse.data[0].embedding

    if (!embedding || embedding.length !== 1536) {
      console.error("[Embeddings] Invalid embedding generated")
      return null
    }

    console.log("[Embeddings] Successfully generated embedding from image description")
    return embedding
  } catch (error) {
    console.error("[Embeddings] Error generating embedding:", error)
    return null
  }
}

/**
 * Update a product's embedding in the database
 * @param supabase - Supabase client
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
      return false
    }

    const { error } = await supabase
      .from("products")
      .update({ embedding })
      .eq("id", productId)

    if (error) {
      console.error("[Embeddings] Error updating product embedding:", error)
      return false
    }

    console.log(`[Embeddings] Successfully updated embedding for product ${productId}`)
    return true
  } catch (error) {
    console.error("[Embeddings] Error in updateProductEmbedding:", error)
    return false
  }
}

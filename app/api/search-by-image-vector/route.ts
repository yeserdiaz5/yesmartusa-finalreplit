import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import OpenAI from "openai"

const searchByImageVectorSchema = z.object({
  image: z.string().min(1, "Image is required"),
})

export async function POST(request: Request) {
  try {
    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Vector Image Search] OPENAI_API_KEY not configured")
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Initialize OpenAI client with direct API key for embeddings
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const body = await request.json()
    const { image } = searchByImageVectorSchema.parse(body)

    // Validate image size (limit to 10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      console.error("[Vector Image Search] Image too large:", image.length)
      return NextResponse.json(
        { error: "Image is too large. Please upload an image smaller than 10MB." },
        { status: 400 }
      )
    }

    console.log("[Vector Image Search] Analyzing image with GPT-4o Vision")

    // Ensure image is in data URL format
    const imageDataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`

    // Step 1: Use GPT-4o Vision to generate detailed description of the image
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
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    })

    const imageDescription = visionResponse.choices[0]?.message?.content

    if (!imageDescription) {
      console.error("[Vector Image Search] No description generated from vision model")
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 }
      )
    }

    console.log("[Vector Image Search] Generated description:", imageDescription.substring(0, 100) + "...")

    // Step 2: Generate embedding from the textual description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: imageDescription,
      encoding_format: "float",
    })

    const imageEmbedding = embeddingResponse.data[0].embedding

    if (!imageEmbedding || imageEmbedding.length !== 1536) {
      console.error("[Vector Image Search] Invalid embedding generated")
      return NextResponse.json(
        { error: "Failed to generate valid embedding" },
        { status: 500 }
      )
    }

    console.log("[Vector Image Search] Embedding generated, searching for similar products")

    // Search for similar products using vector similarity
    const supabase = createAdminClient()

    const { data: products, error } = await supabase.rpc("match_products_by_image", {
      query_embedding: imageEmbedding,
      match_threshold: 0.70, // 70% similarity threshold
      match_count: 20, // Return top 20 matches
    })

    if (error) {
      console.error("[Vector Image Search] Database error:", error)
      return NextResponse.json(
        { error: "Failed to search products: " + error.message },
        { status: 500 }
      )
    }

    console.log("[Vector Image Search] Found products:", products?.length || 0)

    // Fetch seller information for each product
    const productIds = products?.map((p: any) => p.id) || []
    
    let productsWithSellers = products || []
    if (productIds.length > 0) {
      const { data: fullProducts, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          seller:users!products_seller_id_fkey (
            id,
            full_name,
            email,
            store_name,
            seller_address
          )
        `
        )
        .in("id", productIds)

      if (!productsError && fullProducts) {
        // Merge similarity scores with full product data
        productsWithSellers = fullProducts.map((product: any) => {
          const matchedProduct = products.find((p: any) => p.id === product.id)
          return {
            ...product,
            similarity: matchedProduct?.similarity || 0,
          }
        })
        // Sort by similarity score
        productsWithSellers.sort((a: any, b: any) => b.similarity - a.similarity)
      }
    }

    return NextResponse.json({
      success: true,
      products: productsWithSellers,
      count: productsWithSellers.length,
    })
  } catch (error) {
    console.error("[Vector Image Search] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process image search",
      },
      { status: 500 }
    )
  }
}

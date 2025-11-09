import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import { generateImageEmbedding } from "@/lib/huggingface"
import { searchSimilarProducts } from "@/lib/pinecone"

const searchByImageVectorSchema = z.object({
  image: z.string().min(1, "Image is required"),
})

export async function POST(request: Request) {
  try {
    // Verify Hugging Face token is configured
    if (!process.env.HUGGINGFACE_TOKEN) {
      console.error("[Vector Image Search] HUGGINGFACE_TOKEN not configured")
      return NextResponse.json(
        { error: "Image search service not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Verify Pinecone API key is configured
    if (!process.env.PINECONE_API_KEY) {
      console.error("[Vector Image Search] PINECONE_API_KEY not configured")
      return NextResponse.json(
        { error: "Vector search service not configured. Please contact support." },
        { status: 500 }
      )
    }

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

    console.log("[Vector Image Search] Generating image embedding with Hugging Face CLIP...")

    // Generate embedding using Hugging Face CLIP
    const imageEmbedding = await generateImageEmbedding(image)

    if (!imageEmbedding) {
      console.error("[Vector Image Search] Failed to generate embedding")
      return NextResponse.json(
        { error: "Failed to analyze image. The model may be loading. Please try again in a moment." },
        { status: 503 }
      )
    }

    console.log(`[Vector Image Search] Generated ${imageEmbedding.length}-dimensional embedding`)

    // Search for similar products in Pinecone
    console.log("[Vector Image Search] Searching Pinecone for similar products...")
    const similarProducts = await searchSimilarProducts(
      imageEmbedding,
      20, // top 20 results
      0.60 // 60% similarity threshold (CLIP embeddings have different scale than text embeddings)
    )

    console.log(`[Vector Image Search] Found ${similarProducts.length} similar products`)

    if (similarProducts.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0,
      })
    }

    // Fetch full product details from Supabase
    const supabase = createAdminClient()
    const productIds = similarProducts.map((p) => p.id)

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

    if (productsError) {
      console.error("[Vector Image Search] Database error:", productsError)
      return NextResponse.json(
        { error: "Failed to fetch product details: " + productsError.message },
        { status: 500 }
      )
    }

    // Merge similarity scores with full product data
    const productsWithSimilarity = fullProducts.map((product: any) => {
      const matchedProduct = similarProducts.find((p) => p.id === product.id)
      return {
        ...product,
        similarity: matchedProduct?.score || 0,
      }
    })

    // Sort by similarity score (highest first)
    productsWithSimilarity.sort((a: any, b: any) => b.similarity - a.similarity)

    console.log(`[Vector Image Search] Returning ${productsWithSimilarity.length} products`)

    return NextResponse.json({
      success: true,
      products: productsWithSimilarity,
      count: productsWithSimilarity.length,
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

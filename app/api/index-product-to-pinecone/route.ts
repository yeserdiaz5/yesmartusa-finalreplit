/**
 * Manual endpoint to index a specific product to Pinecone
 * Useful for testing and one-off indexing
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateImageEmbeddingFromUrl } from "@/lib/huggingface"
import { upsertProductEmbedding } from "@/lib/pinecone"

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      )
    }

    // Fetch product from Supabase
    const supabase = createAdminClient()
    const { data: product, error } = await supabase
      .from("products")
      .select("id, title, image_url")
      .eq("id", productId)
      .single()

    if (error || !product) {
      console.error("[Index Product] Product not found:", error)
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    if (!product.image_url) {
      return NextResponse.json(
        { error: "Product has no image" },
        { status: 400 }
      )
    }

    console.log(`[Index Product] Generating embedding for: ${product.title}`)

    // Generate embedding
    const embedding = await generateImageEmbeddingFromUrl(product.image_url)

    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      )
    }

    console.log(`[Index Product] Upserting to Pinecone...`)

    // Upsert to Pinecone
    const success = await upsertProductEmbedding(productId, embedding, {
      title: product.title,
      image_url: product.image_url,
    })

    if (!success) {
      return NextResponse.json(
        { error: "Failed to upsert to Pinecone" },
        { status: 500 }
      )
    }

    console.log(`[Index Product] Successfully indexed product ${productId}`)

    return NextResponse.json({
      success: true,
      message: `Product "${product.title}" indexed successfully`,
      productId,
      embeddingDimensions: embedding.length,
    })
  } catch (error) {
    console.error("[Index Product] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

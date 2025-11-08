import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateProductEmbedding } from "@/lib/embeddings"

/**
 * Generate and update embedding for a specific product
 * POST /api/products/{productId}/generate-embedding
 */
export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, title, image_url, images")
      .eq("id", productId)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Get image URL
    const imageUrl = product.image_url || product.images?.[0]

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Product has no image" },
        { status: 400 }
      )
    }

    // Generate embedding
    const embedding = await generateProductEmbedding(imageUrl)

    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      )
    }

    // Update product
    const { error: updateError } = await supabase
      .from("products")
      .update({ embedding })
      .eq("id", productId)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update product: " + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Embedding generated successfully",
      productId,
    })
  } catch (error) {
    console.error("[Generate Embedding] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate embedding",
      },
      { status: 500 }
    )
  }
}

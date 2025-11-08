import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import OpenAI from "openai"

/**
 * API endpoint to generate embeddings for products without them
 * This can be called manually or set up as a cron job
 * 
 * POST /api/generate-embeddings
 * Optional body: { limit: number } - defaults to 10
 */
export async function POST(request: Request) {
  try {
    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Generate Embeddings] OPENAI_API_KEY not configured")
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 10

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const supabase = createAdminClient()

    // Fetch products without embeddings
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title, image_url, images")
      .is("embedding", null)
      .eq("is_active", true)
      .limit(limit)

    if (fetchError) {
      console.error("[Generate Embeddings] Database error:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All active products already have embeddings",
        processed: 0,
      })
    }

    console.log(`[Generate Embeddings] Processing ${products.length} products`)

    const results = {
      success: 0,
      errors: 0,
      details: [] as any[],
    }

    for (const product of products) {
      try {
        // Get the main image URL
        const imageUrl = product.image_url || product.images?.[0]

        if (!imageUrl) {
          results.errors++
          results.details.push({
            id: product.id,
            title: product.title,
            status: "error",
            message: "No image found",
          })
          continue
        }

        // Fetch the image
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          results.errors++
          results.details.push({
            id: product.id,
            title: product.title,
            status: "error",
            message: `Failed to fetch image: ${imageResponse.statusText}`,
          })
          continue
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(arrayBuffer).toString("base64")
        const dataUrl = `data:image/jpeg;base64,${base64Image}`

        // Step 1: Use GPT-4o Vision to generate detailed description
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

        const imageDescription = visionResponse.choices[0]?.message?.content

        if (!imageDescription) {
          results.errors++
          results.details.push({
            id: product.id,
            title: product.title,
            status: "error",
            message: "Failed to generate image description",
          })
          continue
        }

        // Step 2: Generate embedding from the textual description
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: imageDescription,
          encoding_format: "float",
        })

        const embedding = embeddingResponse.data[0].embedding

        if (!embedding || embedding.length !== 1536) {
          results.errors++
          results.details.push({
            id: product.id,
            title: product.title,
            status: "error",
            message: "Invalid embedding generated",
          })
          continue
        }

        // Update product with embedding
        const { error: updateError } = await supabase
          .from("products")
          .update({ embedding: embedding })
          .eq("id", product.id)

        if (updateError) {
          results.errors++
          results.details.push({
            id: product.id,
            title: product.title,
            status: "error",
            message: updateError.message,
          })
          continue
        }

        results.success++
        results.details.push({
          id: product.id,
          title: product.title,
          status: "success",
        })

        // Delay to avoid rate limits (longer due to two API calls per product)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        results.errors++
        results.details.push({
          id: product.id,
          title: product.title,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: products.length,
      successful: results.success,
      errors: results.errors,
      details: results.details,
    })
  } catch (error) {
    console.error("[Generate Embeddings] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate embeddings",
      },
      { status: 500 }
    )
  }
}

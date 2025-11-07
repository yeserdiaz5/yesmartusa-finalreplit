import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import OpenAI from "openai"

const searchByImageSchema = z.object({
  image: z.string().min(1, "Image is required"),
})

export async function POST(request: Request) {
  try {
    // Verify AI Integrations environment variables
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      console.error("[Image Search] AI Integrations not configured")
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    })

    const body = await request.json()
    const { image } = searchByImageSchema.parse(body)

    // Validate image size (limit to 10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      console.error("[Image Search] Image too large:", image.length)
      return NextResponse.json(
        { error: "Image is too large. Please upload an image smaller than 10MB." },
        { status: 400 }
      )
    }

    console.log("[Image Search] Analyzing image with GPT-4o Vision")

    // Call OpenAI GPT-4o Vision to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and provide a detailed description. Focus on:
1. Product type/category (e.g., electronics, clothing, automotive, etc.)
2. Key visual features (color, style, design)
3. Brand or distinguishing marks if visible
4. Condition indicators (new, used, etc.)
5. Keywords that would help find similar products

Provide the analysis in this format:
{
  "productType": "category of the product",
  "description": "detailed description",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "color": "primary color if applicable",
  "category": "general category"
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 500,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No analysis returned" }, { status: 500 })
    }

    // Parse the analysis
    let analysis
    try {
      // Extract JSON from the response (in case it's wrapped in text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON found, create a simple analysis from the text
        analysis = {
          description: content,
          keywords: content.split(/\s+/).slice(0, 10),
        }
      }
    } catch (parseError) {
      console.error("Error parsing analysis:", parseError)
      analysis = {
        description: content,
        keywords: content.split(/\s+/).slice(0, 10),
      }
    }

    // Search for similar products in the database
    const supabase = await createClient()

    console.log("[Image Search] Analysis result:", JSON.stringify(analysis, null, 2))

    // Build search query based on keywords
    const keywords = analysis.keywords || []
    const searchTerms = [
      analysis.productType,
      analysis.category,
      ...keywords,
    ].filter(Boolean)

    console.log("[Image Search] Search terms:", searchTerms)

    // Use PostgreSQL full-text search or simple ILIKE search
    let query = supabase
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
      `,
      )
      .eq("is_active", true)

    // Helper function to sanitize search terms for Supabase
    const sanitizeTerm = (term: string): string => {
      // Remove or escape special characters that could break Supabase query
      // Remove: comma, parentheses, quotes, percent signs
      return term.replace(/[,%()'"]/g, '').trim()
    }

    // Build OR clauses for all search terms
    if (searchTerms.length > 0) {
      const orClauses: string[] = []
      
      // Search each keyword in both title and description
      searchTerms.slice(0, 5).forEach(term => {
        if (term && term.length > 2) {
          const sanitized = sanitizeTerm(term)
          if (sanitized.length > 2) {
            orClauses.push(`title.ilike.%${sanitized}%`)
            orClauses.push(`description.ilike.%${sanitized}%`)
          }
        }
      })

      if (orClauses.length > 0) {
        query = query.or(orClauses.join(","))
      }
    }

    const { data: products, error } = await query.limit(20)

    console.log("[Image Search] Found products:", products?.length || 0)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to search products" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis,
      products: products || [],
    })
  } catch (error) {
    console.error("Error in search-by-image:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process image search",
      },
      { status: 500 },
    )
  }
}

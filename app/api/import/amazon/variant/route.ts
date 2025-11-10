import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

interface RainforestProduct {
  product?: {
    asin?: string
    title?: string
    main_image?: {
      link?: string
    }
    images?: Array<{
      link?: string
    }>
    description?: string
    feature_bullets?: string[]
    buybox_winner?: {
      price?: {
        value?: number
      }
    }
    variants?: Array<{
      asin?: string
      dimensions?: Array<{
        name?: string
        value?: string
      }>
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asin } = body

    if (!asin || asin.trim() === "") {
      return NextResponse.json(
        { error: "ASIN is required" },
        { status: 400 },
      )
    }

    // Normalize ASIN to uppercase
    const normalizedAsin = asin.trim().toUpperCase()

    // Validate ASIN format (10 characters, alphanumeric)
    if (!/^[A-Z0-9]{10}$/.test(normalizedAsin)) {
      return NextResponse.json(
        { error: "Invalid ASIN format. ASIN should be 10 alphanumeric characters." },
        { status: 400 },
      )
    }

    console.log("[Variant Import] Fetching variant data for ASIN:", normalizedAsin)

    // Check if API key is available
    if (!process.env.RAINFOREST_API_KEY) {
      return NextResponse.json(
        { error: "Rainforest API key is not configured" },
        { status: 500 },
      )
    }

    // Call Rainforest API for this specific variant
    const response = await axios.get<RainforestProduct>("https://api.rainforestapi.com/request", {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: "product",
        asin: normalizedAsin,
        amazon_domain: "amazon.com",
      },
      timeout: 30000, // 30 seconds timeout
    })

    const productData = response.data.product

    if (!productData) {
      return NextResponse.json(
        { error: "Variant product not found or invalid response from Amazon" },
        { status: 404 },
      )
    }

    // Extract variant information
    const title = productData.title || ""
    const mainImage = productData.main_image?.link || ""
    
    // Collect all images for this variant
    const images: string[] = []
    if (mainImage) {
      images.push(mainImage)
    }
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((img) => {
        if (img.link && img.link !== mainImage) {
          images.push(img.link)
        }
      })
    }

    // Build description from feature bullets or description
    let description = ""
    if (productData.feature_bullets && productData.feature_bullets.length > 0) {
      description = productData.feature_bullets.join("\n• ")
      description = "• " + description
    } else if (productData.description) {
      description = productData.description
    }

    // Get price
    const price = productData.buybox_winner?.price?.value || 0

    // Extract attributes from the main product's variant dimensions (if available)
    // IMPORTANT: Match by ASIN to get the correct variant attributes
    const attributes: Record<string, string> = {}
    if (productData.variants && productData.variants.length > 0) {
      // Find the variant that matches our requested ASIN (case-insensitive)
      const matchingVariant = productData.variants.find(v => 
        v.asin && v.asin.toUpperCase() === normalizedAsin
      )
      
      // Only use attributes from the matching variant (if found and has dimensions)
      // Do NOT fall back to other variants as that would return incorrect attributes
      if (matchingVariant && matchingVariant.dimensions && matchingVariant.dimensions.length > 0) {
        matchingVariant.dimensions.forEach((dim) => {
          if (dim.name && dim.value) {
            attributes[dim.name.toLowerCase()] = dim.value
          }
        })
      }
    }

    const variantData = {
      asin: normalizedAsin,
      title,
      images: images.slice(0, 6), // Limit to 6 images
      description,
      price,
      attributes,
    }

    console.log("[Variant Import] Successfully imported variant:", title)
    console.log("[Variant Import] Found", images.length, "images")

    return NextResponse.json(variantData)
  } catch (error: any) {
    console.error("[Variant Import] Error:", error)

    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "Variant not found on Amazon. Please check the ASIN." },
          { status: 404 },
        )
      }
      if (error.code === "ECONNABORTED") {
        return NextResponse.json(
          { error: "Request timeout. Please try again." },
          { status: 408 },
        )
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        return NextResponse.json(
          { error: "Invalid Rainforest API key. Please check your configuration." },
          { status: 500 },
        )
      }
      if (error.response?.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to import variant from Amazon. Please try again." },
      { status: 500 },
    )
  }
}

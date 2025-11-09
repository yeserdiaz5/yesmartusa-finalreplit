import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

interface RainforestProduct {
  product?: {
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
    rating?: number
    ratings_total?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input } = body

    if (!input || input.trim() === "") {
      return NextResponse.json(
        { error: "ASIN or Amazon URL is required" },
        { status: 400 },
      )
    }

    // Extract ASIN from URL or use direct ASIN
    let asin = input.trim()
    
    // Check if input is a URL
    if (input.includes("amazon.com") || input.includes("amazon.")) {
      // Try multiple ASIN extraction patterns for different Amazon URL formats
      const patterns = [
        /\/dp\/([A-Za-z0-9]{10})/,           // /dp/ASIN
        /\/gp\/product\/([A-Za-z0-9]{10})/,  // /gp/product/ASIN
        /\/ASIN\/([A-Za-z0-9]{10})/,         // /ASIN/ASIN
        /[?&]asin=([A-Za-z0-9]{10})/i,       // ?asin=ASIN or &asin=ASIN
        /\/([A-Za-z0-9]{10})(?:\/|\?|$)/,    // /ASIN/ at end of path
      ]
      
      let foundAsin = false
      for (const pattern of patterns) {
        const match = input.match(pattern)
        if (match && match[1]) {
          asin = match[1]
          foundAsin = true
          break
        }
      }
      
      if (!foundAsin) {
        return NextResponse.json(
          { error: "Could not extract ASIN from URL. Please provide a valid Amazon product URL or ASIN." },
          { status: 400 },
        )
      }
    }

    // Normalize ASIN to uppercase for validation and API call
    asin = asin.toUpperCase()

    // Validate ASIN format (10 characters, alphanumeric)
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      return NextResponse.json(
        { error: "Invalid ASIN format. ASIN should be 10 alphanumeric characters." },
        { status: 400 },
      )
    }

    console.log("[Amazon Import] Fetching product data for ASIN:", asin)

    // Check if API key is available
    if (!process.env.RAINFOREST_API_KEY) {
      return NextResponse.json(
        { error: "Rainforest API key is not configured" },
        { status: 500 },
      )
    }

    // Call Rainforest API
    const response = await axios.get<RainforestProduct>("https://api.rainforestapi.com/request", {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: "product",
        asin: asin,
        amazon_domain: "amazon.com",
      },
      timeout: 30000, // 30 seconds timeout
    })

    const productData = response.data.product

    if (!productData) {
      return NextResponse.json(
        { error: "Product not found or invalid response from Amazon" },
        { status: 404 },
      )
    }

    // Extract and format product information
    const title = productData.title || ""
    const mainImage = productData.main_image?.link || ""
    
    // Collect all images
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

    // Get rating and reviews
    const rating = productData.rating || 0
    const reviewsCount = productData.ratings_total || 0

    const importedProduct = {
      title,
      main_image: mainImage,
      images: images.slice(0, 5), // Limit to 5 images
      description,
      price,
      rating,
      reviews_count: reviewsCount,
    }

    console.log("[Amazon Import] Successfully imported product:", title)

    return NextResponse.json({ product: importedProduct })
  } catch (error: any) {
    console.error("[Amazon Import] Error:", error)

    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "Product not found on Amazon. Please check the ASIN or URL." },
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
    }

    return NextResponse.json(
      { error: "Failed to import product from Amazon. Please try again." },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

interface RainforestVariant {
  asin?: string
  title?: string
  link?: string
  image?: string
  is_current_product?: boolean
  price?: {
    symbol?: string
    value?: number
    currency?: string
    raw?: string
  }
  dimensions?: Array<{
    name?: string
    value?: string
  }>
}

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
    rating?: number
    ratings_total?: number
    variants?: RainforestVariant[]
    variants_count?: number
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

    // Extract and format variants
    const variants = (productData.variants || []).map((variant) => {
      // Extract variant attributes from dimensions
      const attributes: Record<string, string> = {}
      if (variant.dimensions && variant.dimensions.length > 0) {
        variant.dimensions.forEach((dim) => {
          if (dim.name && dim.value) {
            attributes[dim.name.toLowerCase()] = dim.value
          }
        })
      }

      // Extract image URL from variant (Rainforest API returns image objects or strings)
      let imageUrl = ""
      if (variant.image) {
        if (typeof variant.image === "string") {
          imageUrl = variant.image
        } else if (typeof variant.image === "object" && "link" in variant.image) {
          imageUrl = (variant.image as { link: string }).link
        }
      }
      // Fallback to main product image if variant has no specific image
      if (!imageUrl) {
        imageUrl = mainImage
      }

      const variantData = {
        asin: variant.asin || "",
        title: variant.title || "",
        image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        price: variant.price?.value || 0,
        stock_quantity: 0,
        attributes,
        is_current: variant.is_current_product || false,
      }
      
      return {
        ...variantData,
        // Store original data for reset functionality
        originalData: JSON.parse(JSON.stringify(variantData)),
        isDetached: false,
        modified: false,
      }
    })

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
    console.log("[Amazon Import] Found", variants.length, "variants")

    return NextResponse.json({ 
      product: importedProduct,
      asin: asin,
      variants: variants,
      total_variants: productData.variants_count || 0,
    })
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

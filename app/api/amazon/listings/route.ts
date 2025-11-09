import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SellingPartnerApiAuth } from "@sp-api-sdk/auth"
import { ListingsItemsApiClient } from "@sp-api-sdk/listings-items-api-2021-08-01"

interface AmazonListing {
  sku: string
  asin?: string
  title: string
  description: string
  price: number
  images: string[]
  brand?: string
  condition: string
  package_dimensions?: {
    length: number
    width: number
    height: number
    weight: number
  }
}

function normalizeListingData(listing: any): AmazonListing | null {
  try {
    const attributes = listing.attributes || {}
    
    const title = 
      attributes.item_name?.[0]?.value ||
      attributes.product_name?.[0]?.value ||
      listing.sku ||
      "Untitled Product"
    
    const description =
      attributes.item_description?.[0]?.value ||
      attributes.product_description?.[0]?.value ||
      ""
    
    let price = 0
    const offers = attributes.purchasable_offer || []
    if (offers.length > 0) {
      const offer = offers[0]
      const ourPrice = offer.our_price || []
      if (ourPrice.length > 0) {
        const schedule = ourPrice[0].schedule || []
        if (schedule.length > 0) {
          price = schedule[0].value_with_tax || 0
        }
      }
    }
    
    const imageList = attributes.image_list || []
    const images = imageList
      .filter((img: any) => img.value)
      .map((img: any) => img.value)
      .slice(0, 5)
    
    if (images.length === 0 && attributes.main_product_image_locator?.[0]?.value) {
      images.push(attributes.main_product_image_locator[0].value)
    }
    
    const brand = attributes.brand?.[0]?.value || undefined
    
    let condition = "new"
    const conditionType = attributes.condition_type?.[0]?.value
    if (conditionType) {
      if (conditionType.includes("new")) condition = "new"
      else if (conditionType.includes("used")) condition = "used"
      else if (conditionType.includes("refurbished")) condition = "refurbished"
      else if (conditionType.includes("like_new")) condition = "like_new"
      else if (conditionType.includes("open_box")) condition = "open_box"
      else if (conditionType.includes("for_parts")) condition = "for_parts"
    }
    
    const packageDimensions = attributes.package_dimensions?.[0]
    const dimensions = packageDimensions ? {
      length: packageDimensions.length?.value || 0,
      width: packageDimensions.width?.value || 0,
      height: packageDimensions.height?.value || 0,
      weight: packageDimensions.weight?.value || 0,
    } : undefined
    
    return {
      sku: listing.sku,
      asin: listing.asin,
      title,
      description,
      price,
      images,
      brand,
      condition,
      package_dimensions: dimensions,
    }
  } catch (error) {
    console.error("[v0] Error normalizing listing:", error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const marketplaceId = searchParams.get("marketplace") || "ATVPDKIKX0DER"

    const { data: credentials } = await supabase
      .from("amazon_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("marketplace_id", marketplaceId)
      .single()

    if (!credentials) {
      return NextResponse.json(
        { error: "Amazon account not connected. Please connect your Amazon account first." },
        { status: 404 }
      )
    }

    const sellingPartnerId = credentials.selling_partner_id
    const region = credentials.region || "na"
    
    const { decryptToken } = await import("@/lib/amazon/crypto")
    const refreshToken = decryptToken(credentials.refresh_token)

    const auth = new SellingPartnerApiAuth({
      clientId: process.env.AMAZON_CLIENT_ID!,
      clientSecret: process.env.AMAZON_CLIENT_SECRET!,
      refreshToken: refreshToken,
    })

    const client = new ListingsItemsApiClient({
      auth,
      region: region as "na" | "eu" | "fe",
      rateLimiting: {
        retry: true,
      },
    })

    console.log("[v0] Fetching listings from Amazon for seller:", sellingPartnerId)

    // Note: The SP-API doesn't have a simple "list all SKUs" endpoint
    // This is a limitation of Amazon's API - you typically need to know the SKUs
    // For now, we'll return a helpful message to the user
    // In production, you'd maintain a list of SKUs or use the Reports API

    return NextResponse.json({
      success: true,
      message: "To import products from Amazon, you need to provide the SKU (Stock Keeping Unit) of each product you want to import. Amazon SP-API requires SKUs to fetch product details.",
      help_text: "You can find your SKUs in Amazon Seller Central under Inventory > Manage Inventory.",
      example_sku: "MY-PRODUCT-SKU-123",
    })

  } catch (error: any) {
    console.error("[v0] Error fetching Amazon listings:", error)
    
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { error: "Amazon account not connected" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch Amazon listings" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { sku, marketplace_id } = body

    if (!sku) {
      return NextResponse.json(
        { error: "SKU is required" },
        { status: 400 }
      )
    }

    const marketplaceId = marketplace_id || "ATVPDKIKX0DER"

    const { data: credentials } = await supabase
      .from("amazon_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("marketplace_id", marketplaceId)
      .single()

    if (!credentials) {
      return NextResponse.json(
        { error: "Amazon account not connected" },
        { status: 404 }
      )
    }

    const sellingPartnerId = credentials.selling_partner_id
    const region = credentials.region || "na"
    
    const { decryptToken } = await import("@/lib/amazon/crypto")
    const refreshToken = decryptToken(credentials.refresh_token)

    const auth = new SellingPartnerApiAuth({
      clientId: process.env.AMAZON_CLIENT_ID!,
      clientSecret: process.env.AMAZON_CLIENT_SECRET!,
      refreshToken: refreshToken,
    })

    const client = new ListingsItemsApiClient({
      auth,
      region: region as "na" | "eu" | "fe",
      rateLimiting: {
        retry: true,
      },
    })

    console.log("[v0] Fetching listing from Amazon:", sku)

    const listing = await client.getListingsItem({
      sellerId: sellingPartnerId,
      sku: sku,
      marketplaceIds: [marketplaceId],
      includedData: ["summaries", "attributes", "offers"],
    })

    const normalized = normalizeListingData(listing)

    if (!normalized) {
      return NextResponse.json(
        { error: "Failed to parse Amazon listing data" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listing: normalized,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching Amazon listing:", error)
    
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { error: "Product not found with that SKU" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch Amazon listing" },
      { status: 500 }
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { package_length, package_width, package_height, package_weight, seller_id } = body

    // Validate dimensions
    if (!package_length || !package_width || !package_height || !package_weight) {
      return NextResponse.json(
        { error: "All package dimensions (length, width, height, weight) are required" },
        { status: 400 },
      )
    }

    console.log("[v0] Estimating shipping cost for dimensions:", {
      length: package_length,
      width: package_width,
      height: package_height,
      weight: package_weight,
    })

    // Get seller's address if available
    const supabase = await createClient()
    let from_address: any = {
      name: "Seller",
      street1: "123 Main St",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "US",
    }

    if (seller_id) {
      const { data: seller } = await supabase
        .from("users")
        .select("seller_address, store_name, full_name, email, phone")
        .eq("id", seller_id)
        .single()

      if (seller && seller.seller_address) {
        let sellerAddressData = seller.seller_address
        if (typeof sellerAddressData === "string") {
          try {
            sellerAddressData = JSON.parse(sellerAddressData)
          } catch (e) {
            console.error("[v0] Error parsing seller_address:", e)
          }
        }

        if (sellerAddressData && sellerAddressData.street1) {
          const displayName = seller.store_name || seller.full_name || (seller.email ? seller.email.split('@')[0] : 'Seller')
          
          from_address = {
            name: displayName,
            street1: sellerAddressData.street1 || sellerAddressData.address_line1,
            city: sellerAddressData.city,
            state: sellerAddressData.state,
            zip: sellerAddressData.zip || sellerAddressData.postal_code,
            country: sellerAddressData.country || "US",
            phone: seller.phone || "",
            email: seller.email || "",
          }
        }
      }
    }

    // Use a central US destination for estimation (Chicago area)
    const to_address = {
      name: "Sample Customer",
      street1: "100 N State St",
      city: "Chicago",
      state: "IL",
      zip: "60602",
      country: "US",
    }

    const parcel = {
      length: package_length.toString(),
      width: package_width.toString(),
      height: package_height.toString(),
      weight: package_weight.toString(),
      distance_unit: "in",
      mass_unit: "lb",
    }

    // Call Shippo API to get rates
    const shippoResponse = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
      },
      body: JSON.stringify({
        address_from: from_address,
        address_to: to_address,
        parcels: [parcel],
        async: false,
      }),
    })

    const shippoData = await shippoResponse.json()

    if (!shippoResponse.ok) {
      console.error("[v0] Shippo API error:", shippoData)
      throw new Error(shippoData.detail || "Error fetching shipping rates from Shippo")
    }

    const rates = shippoData.rates || []
    
    if (rates.length === 0) {
      return NextResponse.json(
        { error: "No shipping rates available for these dimensions" },
        { status: 400 },
      )
    }

    // Find the cheapest rate
    const cheapestRate = rates.reduce((min: any, rate: any) => {
      const price = parseFloat(rate.amount)
      return price < parseFloat(min.amount) ? rate : min
    }, rates[0])

    const estimatedCost = parseFloat(cheapestRate.amount)
    const roundedCost = Math.ceil(estimatedCost) // Round up to nearest dollar

    console.log("[v0] Estimated shipping cost:", {
      raw: estimatedCost,
      rounded: roundedCost,
      carrier: cheapestRate.provider,
      service: cheapestRate.servicelevel?.name,
    })

    return NextResponse.json({
      success: true,
      estimated_cost: roundedCost,
      raw_cost: estimatedCost,
      carrier: cheapestRate.provider,
      service: cheapestRate.servicelevel?.name || "Standard",
    })
  } catch (error) {
    console.error("[v0] Error in estimate-shipping:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error estimating shipping cost" },
      { status: 500 },
    )
  }
}

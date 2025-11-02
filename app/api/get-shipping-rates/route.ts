import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to_address, from_address, parcel } = body

    console.log("[v0] Fetching shipping rates from Shippo...")

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

    console.log("[v0] Shippo rates received:", shippoData.rates?.length || 0, "rates")

    return NextResponse.json({
      success: true,
      rates: shippoData.rates || [],
      shipment_id: shippoData.object_id,
    })
  } catch (error) {
    console.error("[v0] Error in get-shipping-rates:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching shipping rates" },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipFrom, shipTo, packages } = body

    console.log("[v0] ShipEngine rates request:", JSON.stringify(body, null, 2))

    // First, get the list of carriers
    const carriersResponse = await fetch("https://api.shipengine.com/v1/carriers", {
      method: "GET",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY!,
        "Content-Type": "application/json",
      },
    })

    if (!carriersResponse.ok) {
      const errorText = await carriersResponse.text()
      console.error("[v0] Failed to fetch carriers:", errorText)
      throw new Error(`Failed to fetch carriers: ${carriersResponse.status}`)
    }

    const carriersData = await carriersResponse.json()
    const carrierIds = carriersData.carriers.map((c: any) => c.carrier_id)

    console.log("[v0] Available carrier IDs:", carrierIds)

    // Build the shipment request
    const shipmentRequest = {
      shipment: {
        ship_from: {
          name: shipFrom.name || "Sender",
          phone: shipFrom.phone || "0000000000",
          address_line1: shipFrom.address_line1,
          city_locality: shipFrom.city_locality || shipFrom.city,
          state_province: shipFrom.state_province || shipFrom.state,
          postal_code: shipFrom.postal_code,
          country_code: shipFrom.country_code || "US",
        },
        ship_to: {
          name: shipTo.name || shipTo.full_name || "Recipient",
          phone: shipTo.phone || "0000000000",
          address_line1: shipTo.address_line1,
          city_locality: shipTo.city_locality || shipTo.city,
          state_province: shipTo.state_province || shipTo.state,
          postal_code: shipTo.postal_code,
          country_code: shipTo.country_code || "US",
        },
        packages: packages.map((pkg: any) => ({
          weight: {
            value: pkg.weight.value,
            unit: pkg.weight.unit,
          },
          dimensions: {
            length: pkg.dimensions.length,
            width: pkg.dimensions.width,
            height: pkg.dimensions.height,
            unit: pkg.dimensions.unit,
          },
        })),
      },
      rate_options: {
        carrier_ids: carrierIds,
      },
    }

    console.log("[v0] Sending to ShipEngine:", JSON.stringify(shipmentRequest, null, 2))

    const response = await fetch("https://api.shipengine.com/v1/rates", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentRequest),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error(
        `[v0] ShipEngine API error: fetch to https://api.shipengine.com/v1/rates failed with status ${response.status} and body: ${responseText}`,
      )
      return NextResponse.json(
        { error: "Failed to get shipping rates", details: responseText },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)
    console.log("[v0] ShipEngine rates response:", JSON.stringify(data, null, 2))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in rates API:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}

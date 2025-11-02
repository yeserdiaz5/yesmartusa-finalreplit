"use server"

interface ShipmentData {
  orderId: string
  shipTo: {
    name: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  items: Array<{
    name: string
    quantity: number
  }>
}

export async function createShipEngineShipment(data: ShipmentData) {
  const apiKey = process.env.SHIPENGINE_API_KEY

  if (!apiKey) {
    console.error("[v0] ShipEngine API key not configured")
    return { success: false, error: "ShipEngine not configured" }
  }

  try {
    console.log("[v0] Creating ShipEngine shipment for order:", data.orderId)

    // Create shipment in ShipEngine
    const response = await fetch("https://api.shipengine.com/v1/shipments", {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipment: {
          service_code: "usps_priority_mail",
          ship_to: {
            name: data.shipTo.name,
            phone: data.shipTo.phone,
            address_line1: data.shipTo.addressLine1,
            address_line2: data.shipTo.addressLine2 || "",
            city_locality: data.shipTo.city,
            state_province: data.shipTo.state,
            postal_code: data.shipTo.postalCode,
            country_code: data.shipTo.country,
          },
          packages: [
            {
              weight: {
                value: 1,
                unit: "pound",
              },
            },
          ],
        },
        external_order_id: data.orderId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] ShipEngine API error:", errorData)
      return { success: false, error: "Failed to create shipment in ShipEngine" }
    }

    const result = await response.json()
    console.log("[v0] ShipEngine shipment created:", result.shipment_id)

    return {
      success: true,
      shipmentId: result.shipment_id,
      message: "Shipment created in ShipEngine dashboard",
    }
  } catch (error: any) {
    console.error("[v0] Error creating ShipEngine shipment:", error)
    return { success: false, error: error.message }
  }
}

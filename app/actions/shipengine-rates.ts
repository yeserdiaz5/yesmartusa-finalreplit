"use server"

import { isShipEngineConfigured } from "@/lib/shipengine"
import { unstable_noStore } from "next/cache"

function formatPhone(phone: string | undefined): string {
  if (!phone) return "+1 555-555-5555"
  const digits = phone.replace(/\D/g, "")
  if (phone.startsWith("+")) return phone
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11) return `+${digits}`
  return "+1 555-555-5555"
}

export async function getShipEngineCarriers() {
  try {
    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const response = await fetch("https://api.shipengine.com/v1/carriers", {
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`ShipEngine API error: ${response.statusText}`)
    }

    const data = await response.json()
    const carriers = data.carriers || []

    return {
      success: true,
      carriers: carriers,
      message: `Found ${carriers.length} carriers in your ShipEngine account`,
    }
  } catch (error: any) {
    console.error("[v0] ShipEngine carriers error:", error)
    return {
      success: false,
      error: error.message || "Failed to get carriers from ShipEngine",
    }
  }
}

export async function getRatesForOrder(
  orderId: string,
  length: number,
  width: number,
  height: number,
  weight: number,
  buyerAddress: any,
  sellerAddress: any,
  sellerName: string,
  sellerPhone: string,
) {
  unstable_noStore()

  try {
    console.log("[v0] ===== GETTING RATES FROM SHIPENGINE =====")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] Package:", { length, width, height, weight })

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const carriersResponse = await fetch("https://api.shipengine.com/v1/carriers", {
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
    })

    if (!carriersResponse.ok) {
      console.error("[v0] ❌ Failed to get carriers")
      return {
        success: false,
        error: "Failed to get carriers from ShipEngine",
      }
    }

    const carriersData = await carriersResponse.json()
    const carriers = carriersData.carriers || []
    const carrierIds = carriers.map((c: any) => c.carrier_id)

    console.log("[v0] ✅ Found carriers:", carriers.length)
    console.log("[v0] ✅ Carrier IDs:", carrierIds)

    const ratesRequest = {
      rate_options: {
        carrier_ids: carrierIds, // Use all carriers from the account
      },
      shipment: {
        validate_address: "no_validation",
        ship_to: {
          name: buyerAddress.full_name || "Customer",
          phone: formatPhone(buyerAddress.phone),
          address_line1: buyerAddress.address_line1,
          ...(buyerAddress.address_line2 && { address_line2: buyerAddress.address_line2 }),
          city_locality: buyerAddress.city,
          state_province: buyerAddress.state,
          postal_code: buyerAddress.postal_code,
          country_code: buyerAddress.country === "USA" ? "US" : buyerAddress.country.substring(0, 2).toUpperCase(),
        },
        ship_from: {
          name: sellerName,
          phone: formatPhone(sellerPhone),
          address_line1: sellerAddress.address_line1,
          ...(sellerAddress.address_line2 && { address_line2: sellerAddress.address_line2 }),
          city_locality: sellerAddress.city,
          state_province: sellerAddress.state,
          postal_code: sellerAddress.postal_code,
          country_code: sellerAddress.country === "USA" ? "US" : sellerAddress.country.substring(0, 2).toUpperCase(),
        },
        packages: [
          {
            weight: {
              value: weight,
              unit: "ounce",
            },
            dimensions: {
              length: length,
              width: width,
              height: height,
              unit: "inch",
            },
          },
        ],
      },
    }

    console.log("[v0] 📦 Requesting rates from ShipEngine...")

    const ratesResponse = await fetch("https://api.shipengine.com/v1/rates", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ratesRequest),
    })

    console.log("[v0] ShipEngine Response Status:", ratesResponse.status)

    if (!ratesResponse.ok) {
      const errorText = await ratesResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.log("[v0] ❌ ShipEngine Error:", JSON.stringify(errorData, null, 2))

      return {
        success: false,
        error: `ShipEngine API error: ${errorData.message || ratesResponse.statusText}`,
        errorDetails: errorData,
      }
    }

    const ratesResult = await ratesResponse.json()
    const rates = ratesResult.rate_response?.rates || []

    console.log("[v0] ✅ ShipEngine returned ${rates.length} rates")

    const sortedRates = rates.sort((a: any, b: any) => {
      const priceA = Number.parseFloat(a.shipping_amount?.amount || "0")
      const priceB = Number.parseFloat(b.shipping_amount?.amount || "0")
      return priceA - priceB
    })

    return {
      success: true,
      rates: sortedRates,
      message: `ShipEngine found ${sortedRates.length} shipping options`,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in getRatesForOrder:", error)
    console.error("[v0] ❌ Error stack:", error.stack)
    return {
      success: false,
      error: error.message || "Failed to get rates from ShipEngine",
    }
  }
}

export async function validateAddress(address: any) {
  try {
    console.log("[v0] 🔍 Validating address with ShipEngine...")

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const response = await fetch("https://api.shipengine.com/v1/addresses/validate", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          name: address.full_name || address.name,
          phone: formatPhone(address.phone),
          address_line1: address.address_line1,
          ...(address.address_line2 && { address_line2: address.address_line2 }),
          city_locality: address.city || address.city_locality,
          state_province: address.state || address.state_province,
          postal_code: address.postal_code,
          country_code:
            address.country === "USA" ? "US" : (address.country_code || address.country).substring(0, 2).toUpperCase(),
        },
      ]),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] ❌ Address validation error:", errorText)
      return {
        success: false,
        error: "Could not validate address with ShipEngine",
      }
    }

    const result = await response.json()
    const validation = result[0]

    console.log("[v0] ✅ ShipEngine validation result:", validation.status)

    return {
      success: true,
      validation: validation,
      isValid: validation.status === "verified",
      messages: validation.messages || [],
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in validateAddress:", error)
    return {
      success: false,
      error: error.message || "Error validating address",
    }
  }
}

export async function testShipEngineConnection() {
  try {
    console.log("[v0] Testing ShipEngine connection...")

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured. Please add SHIPENGINE_API_KEY to your environment variables.",
      }
    }

    const response = await fetch("https://api.shipengine.com/v1/carriers", {
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`ShipEngine API error: ${response.statusText}`)
    }

    const data = await response.json()
    const carriers = data.carriers || []

    console.log("[v0] ShipEngine connection successful. Carriers:", carriers.length)

    return {
      success: true,
      message: `ShipEngine connected successfully! Found ${carriers.length} carriers in your account.`,
      carriers: carriers.map((c: any) => ({
        name: c.friendly_name,
        code: c.carrier_code,
        id: c.carrier_id,
      })),
    }
  } catch (error: any) {
    console.error("[v0] ShipEngine connection error:", error)
    return {
      success: false,
      error: error.message || "Failed to connect to ShipEngine",
    }
  }
}

export async function testShippingRates() {
  try {
    console.log("[v0] ===== TESTING SHIPPING RATES =====")

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const carriersResponse = await fetch("https://api.shipengine.com/v1/carriers", {
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
    })

    if (!carriersResponse.ok) {
      return {
        success: false,
        error: "Failed to get carriers from ShipEngine",
      }
    }

    const carriersData = await carriersResponse.json()
    const carriers = carriersData.carriers || []
    const carrierIds = carriers.map((c: any) => c.carrier_id)

    const testRatesRequest = {
      rate_options: {
        carrier_ids: carrierIds,
      },
      shipment: {
        validate_address: "no_validation",
        ship_to: {
          name: "Jane Doe",
          phone: "+1 444-444-4444",
          address_line1: "525 S Winchester Blvd",
          city_locality: "San Jose",
          state_province: "CA",
          postal_code: "95128",
          country_code: "US",
        },
        ship_from: {
          name: "John Doe",
          company_name: "Example Corp",
          phone: "+1 555-555-5555",
          address_line1: "4301 Bull Creek Rd",
          city_locality: "Austin",
          state_province: "TX",
          postal_code: "78731",
          country_code: "US",
        },
        packages: [
          {
            weight: {
              value: 20,
              unit: "ounce",
            },
            dimensions: {
              height: 6,
              width: 12,
              length: 24,
              unit: "inch",
            },
          },
        ],
      },
    }

    const response = await fetch("https://api.shipengine.com/v1/rates", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testRatesRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return {
        success: false,
        error: `ShipEngine API error: ${errorData.message || response.statusText}`,
        errorDetails: errorData,
      }
    }

    const result = await response.json()
    const rates = result.rate_response?.rates || []

    return {
      success: true,
      rates: rates,
      message: `Successfully retrieved ${rates.length} shipping rates from ShipEngine!`,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in testShippingRates:", error)
    return {
      success: false,
      error: error.message || "Failed to get test shipping rates",
    }
  }
}

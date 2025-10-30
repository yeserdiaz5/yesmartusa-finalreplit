"use server"

import { isShipEngineConfigured } from "@/lib/shipengine"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath, unstable_noStore } from "next/cache"

// Declare variables before using them
const v0 = "some value"
const no = "another value"
const op = "operation"
const code = "code snippet"
const block = "block of code"
const prefix = "prefix value"

// Helper function to format phone numbers for ShipEngine
function formatPhone(phone: string | undefined): string {
  if (!phone) return "+1 555-555-5555"
  const digits = phone.replace(/\D/g, "")
  if (phone.startsWith("+")) return phone
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11) return `+${digits}`
  return "+1 555-555-5555"
}

function validateShipEngineAddress(address: any, type: "ship_to" | "ship_from"): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!address.name || address.name.trim().length === 0) {
    errors.push(`${type}: Name is required`)
  }

  if (!address.address_line1 || address.address_line1.trim().length === 0) {
    errors.push(`${type}: Address line 1 is required`)
  }

  if (!address.city_locality || address.city_locality.trim().length === 0) {
    errors.push(`${type}: City is required`)
  }

  if (!address.state_province || address.state_province.trim().length === 0) {
    errors.push(`${type}: State is required`)
  }

  if (!address.postal_code || address.postal_code.trim().length === 0) {
    errors.push(`${type}: Postal code is required`)
  }

  if (!address.country_code || address.country_code.length !== 2) {
    errors.push(`${type}: Country code must be 2 letters (e.g., US)`)
  }

  if (!address.phone || address.phone.trim().length === 0) {
    errors.push(`${type}: Phone number is required`)
  }

  return { valid: errors.length === 0, errors }
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
      message: `ShipEngine connected successfully! Found ${carriers.length} carriers.`,
      carriers: carriers.map((c: any) => c.friendly_name),
    }
  } catch (error: any) {
    console.error("[v0] ShipEngine connection error:", error)
    return {
      success: false,
      error: error.message || "Failed to connect to ShipEngine",
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
    console.log("[v0] ===== GETTING RATES FOR ORDER =====")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] Package:", { length, width, height, weight })

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    console.log("[v0] 📤 Seller name:", sellerName)
    console.log("[v0] 📤 Seller address:", sellerAddress)
    console.log("[v0] 📥 Buyer address:", buyerAddress)

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

    const ratesRequest = {
      rate_options: {
        carrier_ids: carrierIds,
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

    console.log("[v0] 📦 Rates Request:")
    console.log(JSON.stringify(ratesRequest, null, 2))

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
        errorData = JSON.stringify(JSON.parse(errorText), null, 2)
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

    console.log("[v0] ✅ Rates retrieved:", rates.length)

    return {
      success: true,
      rates: rates,
      message: `Se encontraron ${rates.length} tarifas`,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in getRatesForOrder:", error)
    console.error("[v0] ❌ Error stack:", error.stack)
    return {
      success: false,
      error: error.message || "Failed to get rates",
    }
  }
}

export async function purchaseLabelForOrder(
  orderId: string,
  rateId: string,
  length: number,
  width: number,
  height: number,
  weight: number,
) {
  unstable_noStore()

  try {
    console.log("[v0] 🏷️ ===== PURCHASING LABEL FOR ORDER =====")
    console.log("[v0] Order ID:", orderId)
    console.log("[v0] Rate ID:", rateId)

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select(`
        order_id,
        product_id,
        products (
          seller_id
        )
      `)
      .eq("order_id", orderId)
      .limit(1)

    if (orderItemsError || !orderItems || orderItems.length === 0) {
      console.error("[v0] ❌ Order items not found:", orderItemsError)
      return {
        success: false,
        error: "Pedido no encontrado o sin productos",
      }
    }

    const sellerId = (orderItems[0].products as any)?.seller_id
    if (!sellerId) {
      console.error("[v0] ❌ Seller ID not found in product")
      return {
        success: false,
        error: "No se pudo encontrar el vendedor del producto",
      }
    }
    console.log("[v0] ✅ Seller ID:", sellerId)

    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (!order) {
      console.error("[v0] ❌ Order not found")
      return {
        success: false,
        error: "Pedido no encontrado",
      }
    }

    console.log("[v0] ✅ Order found:", order.id)

    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("full_name, phone, seller_address")
      .eq("id", sellerId)
      .single()

    if (!seller || !seller.seller_address) {
      console.error("[v0] ❌ Seller not found or no address")
      return {
        success: false,
        error: "Vendedor no encontrado o sin dirección configurada",
      }
    }

    console.log("[v0] ✅ Seller found:", seller.full_name)

    const buyerAddress = order.shipping_address as any
    const sellerAddress = seller.seller_address as any
    const sellerName = sellerAddress.full_name || seller.full_name || ""

    const labelRequest = {
      shipment: {
        service_code: order.selected_service_code,
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
          phone: formatPhone(seller.phone || sellerAddress.phone),
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
      rate_id: rateId,
      validate_address: "no_validation",
      label_format: "pdf",
      label_layout: "4x6",
    }

    console.log("[v0] 📦 Label Request:")
    console.log(JSON.stringify(labelRequest, null, 2))

    const labelResponse = await fetch("https://api.shipengine.com/v1/labels", {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(labelRequest),
    })

    console.log("[v0] ShipEngine Response Status:", labelResponse.status)

    if (!labelResponse.ok) {
      const errorText = await labelResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.log("[v0] ❌ ShipEngine Error:", JSON.stringify(errorData, null, 2))

      return {
        success: false,
        error: `Error de ShipEngine: ${errorData.message || labelResponse.statusText}`,
        errorDetails: errorData,
      }
    }

    const label = await labelResponse.json()
    console.log("[v0] ✅ Label purchased successfully!")
    console.log("[v0] ✅ Tracking:", label.tracking_number)
    console.log("[v0] ✅ PDF URL:", label.label_download?.pdf)

    console.log("[v0] 💾 Starting database operations...")

    const { data: existingShipment, error: existingShipmentError } = await supabase
      .from("shipments")
      .select("id, tracking_number")
      .eq("order_id", orderId)
      .limit(1)

    console.log("[v0] 🔍 Existing shipment check result:", {
      found: existingShipment && existingShipment.length > 0,
      error: existingShipmentError?.message,
    })

    if (existingShipment && existingShipment.length > 0) {
      console.log("[v0] ⚠️ Order already has a shipment:", existingShipment[0].tracking_number)
      return {
        success: false,
        error: "Este pedido ya tiene una etiqueta de envío. No se pueden crear etiquetas duplicadas.",
        errorDetails: {
          existingTracking: existingShipment[0].tracking_number,
        },
      }
    }

    const shipmentData = {
      order_id: orderId,
      tracking_number: label.tracking_number,
      carrier: label.carrier_code,
      label_url: label.label_download?.pdf,
      label_id: label.label_id,
      status: "pending",
      shipped_at: new Date().toISOString(),
    }
    console.log("[v0] 💾 Shipment data:", shipmentData)

    const { data: insertedShipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert(shipmentData)
      .select()

    if (shipmentError) {
      console.error("[v0] ❌ Error saving shipment:", shipmentError)
      console.error("[v0] ❌ Shipment error details:", {
        message: shipmentError.message,
        details: shipmentError.details,
        hint: shipmentError.hint,
      })
    } else {
      console.log("[v0] ✅ Shipment saved successfully:", insertedShipment)
    }

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from("orders")
      .update({ status: "shipped" })
      .eq("id", orderId)
      .select()

    if (updateOrderError) {
      console.error("[v0] ❌ Error updating order status:", updateOrderError)
      console.error("[v0] ❌ Order error details:", {
        message: updateOrderError.message,
        details: updateOrderError.details,
        hint: updateOrderError.hint,
      })
    } else {
      console.log("[v0] ✅ Order status updated successfully:", updatedOrder)
    }

    console.log("[v0] 💾 Database operations completed")

    revalidatePath("/orders")
    revalidatePath("/seller")
    revalidatePath("/createlabelplus")

    console.log("[v0] 🏁 ===== PURCHASING LABEL - END =====")

    return {
      success: true,
      label: label,
      tracking_number: label.tracking_number,
      label_url: label.label_download?.pdf,
      message: "¡Etiqueta comprada exitosamente!",
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in purchaseLabelForOrder:", error)
    console.error("[v0] ❌ Error stack:", error.stack)
    return {
      success: false,
      error: error.message || "Error al comprar etiqueta",
      errorDetails: {
        exception: error.message,
        stack: error.stack,
      },
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
      message: `Successfully retrieved ${rates.length} shipping rates!`,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in testShippingRates:", error)
    return {
      success: false,
      error: error.message || "Failed to get test shipping rates",
    }
  }
}

export async function updateTrackingStatus(shipmentId: string) {
  unstable_noStore()

  try {
    console.log("[v0] 📍 Updating tracking status for shipment:", shipmentId)

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const supabase = await createClient()

    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single()

    if (shipmentError || !shipment) {
      console.error("[v0] ❌ Shipment not found:", shipmentError)
      return {
        success: false,
        error: "Envío no encontrado",
      }
    }

    const response = await fetch(
      `https://api.shipengine.com/v1/tracking?carrier_code=${shipment.carrier}&tracking_number=${shipment.tracking_number}`,
      {
        headers: {
          "API-Key": process.env.SHIPENGINE_API_KEY as string,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] ❌ ShipEngine tracking error:", errorText)
      return {
        success: false,
        error: "No se pudo obtener información de rastreo",
      }
    }

    const trackingData = await response.json()
    console.log("[v0] ✅ Tracking data received:", trackingData)

    const statusMap: Record<string, string> = {
      DE: "delivered",
      IT: "in_transit",
      UN: "pending",
      EX: "failed",
      AT: "in_transit",
    }
    const updates: any = {}

    if (trackingData.status_code) {
      updates.status = statusMap[trackingData.status_code] || "pending"
    }

    if (trackingData.actual_delivery_date) {
      updates.delivered_at = trackingData.actual_delivery_date
    }

    if (trackingData.estimated_delivery_date) {
      updates.estimated_delivery = trackingData.estimated_delivery_date
    }

    const { error: updateError } = await supabase.from("shipments").update(updates).eq("id", shipmentId)

    if (updateError) {
      console.error("[v0] ❌ Error updating shipment:", updateError)
      return {
        success: false,
        error: "Error al actualizar el estado del envío",
      }
    }

    revalidatePath("/orders")

    return {
      success: true,
      message: "Estado de rastreo actualizado",
      trackingData: trackingData,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in updateTrackingStatus:", error)
    return {
      success: false,
      error: error.message || "Error al actualizar el estado de rastreo",
    }
  }
}

export async function validateAddress(address: any) {
  try {
    console.log("[v0] 🔍 Validating address:", address)

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
        error: "No se pudo validar la dirección",
      }
    }

    const result = await response.json()
    const validation = result[0]

    console.log("[v0] ✅ Address validation result:", validation)

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
      error: error.message || "Error al validar la dirección",
    }
  }
}

export async function voidLabel(labelId: string, orderId: string) {
  unstable_noStore()

  try {
    console.log("[v0] 🚫 ===== VOIDING LABEL =====")
    console.log("[v0] Label ID:", labelId)
    console.log("[v0] Order ID:", orderId)

    if (!isShipEngineConfigured()) {
      return {
        success: false,
        error: "ShipEngine API key is not configured.",
      }
    }

    const supabase = await createClient()

    const response = await fetch(`https://api.shipengine.com/v1/labels/${labelId}/void`, {
      method: "PUT",
      headers: {
        "API-Key": process.env.SHIPENGINE_API_KEY as string,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] ShipEngine Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.stringify(JSON.parse(errorText), null, 2)
      } catch {
        errorData = { message: errorText }
      }

      console.log("[v0] ❌ ShipEngine Error:", JSON.stringify(errorData, null, 2))

      return {
        success: false,
        error: `Error al anular etiqueta: ${errorData.message || response.statusText}`,
        errorDetails: errorData,
      }
    }

    const voidResult = await response.json()
    console.log("[v0] ✅ Label voided successfully!")
    console.log("[v0] ✅ Void result:", voidResult)

    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({
        status: "voided",
        notes: "Etiqueta anulada",
      })
      .eq("label_id", labelId)

    if (shipmentError) {
      console.error("[v0] ⚠️ Error updating shipment:", shipmentError)
    }

    const { error: orderError } = await supabase.from("orders").update({ status: "paid" }).eq("id", orderId)

    if (orderError) {
      console.error("[v0] ⚠️ Error updating order:", orderError)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")

    return {
      success: true,
      message: "Etiqueta anulada exitosamente. El costo será reembolsado.",
      voidResult: voidResult,
    }
  } catch (error: any) {
    console.error("[v0] ❌ Exception in voidLabel:", error)
    console.error("[v0] ❌ Error stack:", error.stack)
    return {
      success: false,
      error: error.message || "Error al anular etiqueta",
      errorDetails: {
        exception: error.message,
        stack: error.stack,
      },
    }
  }
}

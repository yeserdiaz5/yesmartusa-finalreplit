"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "failed" | "returned"

export interface Shipment {
  id: string
  order_id: string
  tracking_number: string
  carrier: string
  status: ShipmentStatus
  shipped_at: string
  estimated_delivery?: string
  delivered_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateShipmentData {
  order_id: string
  tracking_number: string
  carrier: string
  estimated_delivery?: string
  notes?: string
}

export interface UpdateShipmentData {
  status?: ShipmentStatus
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  delivered_at?: string
  notes?: string
}

/**
 * Create a new shipment for an order
 */
export async function createShipment(data: CreateShipmentData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "No autenticado" }
    }

    // Verify user is the seller of products in this order
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, products!inner(seller_id)")
      .eq("order_id", data.order_id)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return { success: false, error: "Orden no encontrada" }
    }

    // Check if user is seller of any product in the order
    const isSeller = orderItems.some((item: any) => item.products.seller_id === user.id)

    if (!isSeller) {
      return { success: false, error: "No tienes permiso para crear envíos para esta orden" }
    }

    // Create shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert({
        order_id: data.order_id,
        tracking_number: data.tracking_number,
        carrier: data.carrier,
        estimated_delivery: data.estimated_delivery,
        notes: data.notes,
        status: "in_transit",
      })
      .select()
      .single()

    if (shipmentError) {
      console.error("[v0] Error creating shipment:", shipmentError)
      return { success: false, error: "Error al crear el envío" }
    }

    // Update order status to shipped
    await supabase
      .from("orders")
      .update({
        status: "shipped",
        shipping_carrier: data.carrier,
        tracking_number: data.tracking_number,
      })
      .eq("id", data.order_id)

    revalidatePath("/orders")
    revalidatePath("/seller")

    return { success: true, data: shipment }
  } catch (error) {
    console.error("[v0] Error in createShipment:", error)
    return { success: false, error: "Error al crear el envío" }
  }
}

/**
 * Get all shipments for an order
 */
export async function getOrderShipments(orderId: string) {
  try {
    const supabase = await createClient()

    const { data: shipments, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching shipments:", error)
      return { success: false, error: "Error al obtener envíos" }
    }

    return { success: true, data: shipments as Shipment[] }
  } catch (error) {
    console.error("[v0] Error in getOrderShipments:", error)
    return { success: false, error: "Error al obtener envíos" }
  }
}

/**
 * Update a shipment
 */
export async function updateShipment(shipmentId: string, data: UpdateShipmentData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "No autenticado" }
    }

    // Update shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .update(data)
      .eq("id", shipmentId)
      .select()
      .single()

    if (shipmentError) {
      console.error("[v0] Error updating shipment:", shipmentError)
      return { success: false, error: "Error al actualizar el envío" }
    }

    // If status is delivered, update delivered_at
    if (data.status === "delivered" && !data.delivered_at) {
      await supabase.from("shipments").update({ delivered_at: new Date().toISOString() }).eq("id", shipmentId)
    }

    revalidatePath("/orders")
    revalidatePath("/seller")

    return { success: true, data: shipment }
  } catch (error) {
    console.error("[v0] Error in updateShipment:", error)
    return { success: false, error: "Error al actualizar el envío" }
  }
}

/**
 * Get shipment by tracking number
 */
export async function getShipmentByTracking(trackingNumber: string) {
  try {
    const supabase = await createClient()

    const { data: shipment, error } = await supabase
      .from("shipments")
      .select(`
        *,
        orders (
          id,
          total_amount,
          status,
          created_at
        )
      `)
      .eq("tracking_number", trackingNumber)
      .single()

    if (error) {
      console.error("[v0] Error fetching shipment:", error)
      return { success: false, error: "Envío no encontrado" }
    }

    return { success: true, data: shipment }
  } catch (error) {
    console.error("[v0] Error in getShipmentByTracking:", error)
    return { success: false, error: "Error al buscar envío" }
  }
}

interface ShipEngineShipmentData {
  orderId: string
  shipFrom: {
    name: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
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

export async function createShipEngineShipment(data: ShipEngineShipmentData) {
  const apiKey = process.env.SHIPENGINE_API_KEY

  if (!apiKey) {
    console.error("[v0] ShipEngine API key not configured")
    return { success: false, error: "ShipEngine not configured" }
  }

  try {
    console.log("[v0] Creating ShipEngine shipment for order:", data.orderId)

    const response = await fetch("https://api.shipengine.com/v1/shipments", {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipments: [
          {
            service_code: "usps_priority_mail",
            ship_from: {
              name: data.shipFrom.name,
              phone: data.shipFrom.phone,
              address_line1: data.shipFrom.addressLine1,
              address_line2: data.shipFrom.addressLine2 || "",
              city_locality: data.shipFrom.city,
              state_province: data.shipFrom.state,
              postal_code: data.shipFrom.postalCode,
              country_code: data.shipFrom.country,
            },
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
            external_order_id: data.orderId,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] ShipEngine API error:", errorData)
      return { success: false, error: "Failed to create shipment in ShipEngine" }
    }

    const result = await response.json()
    const shipmentId = result.shipments?.[0]?.shipment_id

    if (!shipmentId) {
      console.error("[v0] No shipment ID in response:", result)
      return { success: false, error: "No shipment ID returned" }
    }

    console.log("[v0] ShipEngine shipment created:", shipmentId)

    return {
      success: true,
      shipmentId,
      message: "Shipment created in ShipEngine dashboard",
    }
  } catch (error: any) {
    console.error("[v0] Error creating ShipEngine shipment:", error)
    return { success: false, error: error.message }
  }
}

export async function createShipEngineShipmentAndRedirect(data: ShipEngineShipmentData) {
  const apiKey = process.env.SHIPENGINE_API_KEY

  if (!apiKey) {
    console.error("[v0] ShipEngine API key not configured")
    return { success: false, error: "ShipEngine not configured" }
  }

  try {
    console.log("[v0] Creating ShipEngine shipment for order:", data.orderId)

    const response = await fetch("https://api.shipengine.com/v1/shipments", {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipments: [
          {
            service_code: "usps_priority_mail",
            ship_from: {
              name: data.shipFrom.name,
              phone: data.shipFrom.phone,
              address_line1: data.shipFrom.addressLine1,
              address_line2: data.shipFrom.addressLine2 || "",
              city_locality: data.shipFrom.city,
              state_province: data.shipFrom.state,
              postal_code: data.shipFrom.postalCode,
              country_code: data.shipFrom.country,
            },
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
            external_order_id: data.orderId,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] ShipEngine API error:", errorData)
      return { success: false, error: "Failed to create shipment in ShipEngine" }
    }

    const result = await response.json()
    const shipmentId = result.shipments?.[0]?.shipment_id

    if (!shipmentId) {
      console.error("[v0] No shipment ID in response:", result)
      return { success: false, error: "No shipment ID returned" }
    }

    console.log("[v0] ShipEngine shipment created:", shipmentId)

    const shipEngineUrl = `https://dashboard.shipengine.com/shipments/${shipmentId}`

    return {
      success: true,
      shipmentId,
      redirectUrl: shipEngineUrl,
      message: "Shipment created in ShipEngine dashboard",
    }
  } catch (error: any) {
    console.error("[v0] Error creating ShipEngine shipment:", error)
    return { success: false, error: error.message }
  }
}

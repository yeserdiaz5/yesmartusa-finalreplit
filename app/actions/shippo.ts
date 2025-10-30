"use server"

import { shippo } from "@/lib/shippo"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function testShippoConnection() {
  try {
    console.log("[v0] Shippo Test - Starting connection test")

    if (!process.env.SHIPPO_API_KEY) {
      console.error("[v0] Shippo Test - API key is missing!")
      return {
        success: false,
        error: "SHIPPO_API_KEY no está configurada",
        details: "Por favor agrega la variable de entorno SHIPPO_API_KEY en tu proyecto Vercel",
      }
    }

    console.log("[v0] Shippo Test - API key found, testing connection...")

    // Test with a simple address validation
    const testAddress = await shippo.addresses.create({
      name: "Test User",
      street1: "123 Test St",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
      country: "US",
    })

    console.log("[v0] Shippo Test - Connection successful!")
    console.log("[v0] Shippo Test - Test address created:", testAddress.objectId)

    return {
      success: true,
      message: "Conexión exitosa con Shippo API",
      details: `Address ID: ${testAddress.objectId}`,
    }
  } catch (error: any) {
    console.error("[v0] Shippo Test - Connection failed:", error)
    console.error("[v0] Shippo Test - Error message:", error.message)
    console.error("[v0] Shippo Test - Error details:", JSON.stringify(error, null, 2))

    return {
      success: false,
      error: "Error al conectar con Shippo",
      details: error.message || "Error desconocido",
    }
  }
}

export async function createShippoShipment(orderId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    const userProducts = order.order_items.filter((item: any) => item.products.seller_id === user.id)

    if (userProducts.length === 0) {
      return { success: false, error: "No autorizado" }
    }

    const { data: seller } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (!seller) {
      return { success: false, error: "Perfil de vendedor no encontrado" }
    }

    const shippingAddress = order.shipping_address as any

    // Calculate total weight (in ounces) - default 16oz per item
    const totalWeight = order.order_items.reduce((sum: number, item: any) => {
      return sum + item.quantity * 16 // 16oz = 1lb per item
    }, 0)

    // Create shipment in Shippo
    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: seller.name || "YesMart USA Seller",
        street1: seller.address || "123 Seller St",
        city: seller.city || "San Francisco",
        state: seller.state || "CA",
        zip: seller.zip || "94103",
        country: "US",
      },
      addressTo: {
        name: shippingAddress.name || "Customer",
        street1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || "US",
      },
      parcels: [
        {
          length: "10",
          width: "8",
          height: "6",
          distanceUnit: "in",
          weight: totalWeight.toString(),
          massUnit: "oz",
        },
      ],
      async: false,
    })

    if (!shipment.rates || shipment.rates.length === 0) {
      return { success: false, error: "No se encontraron tarifas de envío" }
    }

    return {
      success: true,
      shipment: {
        id: shipment.objectId,
        rates: shipment.rates.map((rate: any) => ({
          id: rate.objectId,
          provider: rate.provider,
          servicelevel: rate.servicelevel.name,
          amount: rate.amount,
          currency: rate.currency,
          estimatedDays: rate.estimatedDays,
        })),
      },
    }
  } catch (error: any) {
    console.error("[v0] Error creating Shippo shipment:", error)
    return { success: false, error: error.message || "Error al crear envío" }
  }
}

export async function createShippoShipmentWithDimensions(
  orderId: string,
  dimensions: {
    length: string
    width: string
    height: string
    weight: string
  },
) {
  try {
    console.log("[v0] Shippo - Starting createShippoShipmentWithDimensions")
    console.log("[v0] Shippo - Order ID:", orderId)
    console.log("[v0] Shippo - Dimensions:", dimensions)

    if (!process.env.SHIPPO_API_KEY) {
      console.error("[v0] Shippo - API key is missing!")
      return {
        success: false,
        error: "La API key de Shippo no está configurada. Por favor agrega SHIPPO_API_KEY a las variables de entorno.",
      }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Shippo - User:", user?.id)

    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", orderId)
      .single()

    console.log("[v0] Shippo - Order found:", !!order)
    console.log("[v0] Shippo - Order error:", orderError)

    if (orderError || !order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    const userProducts = order.order_items.filter((item: any) => item.products.seller_id === user.id)

    console.log("[v0] Shippo - User products count:", userProducts.length)

    if (userProducts.length === 0) {
      return { success: false, error: "No autorizado" }
    }

    const { data: seller } = await supabase.from("users").select("*").eq("id", user.id).single()

    console.log("[v0] Shippo - Seller found:", !!seller)

    if (!seller) {
      return { success: false, error: "Perfil de vendedor no encontrado" }
    }

    const shippingAddress = order.shipping_address as any

    console.log("[v0] Shippo - Shipping address:", shippingAddress)

    const shipmentData = {
      addressFrom: {
        name: seller.name || "YesMart USA Seller",
        street1: seller.address || "123 Seller St",
        city: seller.city || "San Francisco",
        state: seller.state || "CA",
        zip: seller.zip || "94103",
        country: "US",
      },
      addressTo: {
        name: shippingAddress.full_name || "Customer",
        street1: shippingAddress.address_line1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.postal_code,
        country: shippingAddress.country || "US",
      },
      parcels: [
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          distanceUnit: "in",
          weight: dimensions.weight,
          massUnit: "oz",
        },
      ],
      async: false,
    }

    console.log("[v0] Shippo - Creating shipment with data:", JSON.stringify(shipmentData, null, 2))

    const shipment = await shippo.shipments.create(shipmentData)

    console.log("[v0] Shippo - Shipment created:", shipment.objectId)
    console.log("[v0] Shippo - Rates count:", shipment.rates?.length || 0)

    if (!shipment.rates || shipment.rates.length === 0) {
      console.error("[v0] Shippo - No rates found in response")
      return { success: false, error: "No se encontraron tarifas de envío" }
    }

    const rates = shipment.rates.map((rate: any) => ({
      id: rate.objectId,
      provider: rate.provider,
      servicelevel: rate.servicelevel.name,
      amount: rate.amount,
      currency: rate.currency,
      estimatedDays: rate.estimatedDays,
    }))

    console.log("[v0] Shippo - Rates:", JSON.stringify(rates, null, 2))

    return {
      success: true,
      shipment: {
        id: shipment.objectId,
        rates,
      },
    }
  } catch (error: any) {
    console.error("[v0] Shippo - Error creating shipment:", error)
    console.error("[v0] Shippo - Error details:", error.message)
    console.error("[v0] Shippo - Error stack:", error.stack)
    return { success: false, error: error.message || "Error al crear envío" }
  }
}

export async function purchaseShippingLabel(orderId: string, rateId: string, shipmentId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    // Verify user owns this order
    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          products (seller_id)
        )
      `)
      .eq("id", orderId)
      .single()

    if (!order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    // Purchase the label
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: "PDF",
      async: false,
    })

    if (transaction.status !== "SUCCESS") {
      return { success: false, error: "Error al crear etiqueta de envío" }
    }

    // Create shipment record in database
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert({
        order_id: orderId,
        tracking_number: transaction.trackingNumber || "",
        carrier: transaction.rate?.provider || "",
        status: "in_transit",
        label_url: transaction.labelUrl,
        tracking_url: transaction.trackingUrlProvider,
      })
      .select()
      .single()

    if (shipmentError) {
      console.error("[v0] Error saving shipment:", shipmentError)
      return { success: false, error: "Error al guardar información de envío" }
    }

    // Update order status to shipped
    await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: transaction.trackingNumber,
        shipping_carrier: transaction.rate?.provider,
      })
      .eq("id", orderId)

    revalidatePath("/orders")
    revalidatePath("/seller")

    return {
      success: true,
      shipment: {
        id: shipment.id,
        trackingNumber: transaction.trackingNumber,
        labelUrl: transaction.labelUrl,
        trackingUrl: transaction.trackingUrlProvider,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error purchasing label:", error)
    return { success: false, error: error.message || "Error al comprar etiqueta" }
  }
}

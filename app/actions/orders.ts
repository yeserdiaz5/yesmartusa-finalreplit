"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { clearCart } from "./cart"
import { createNotification } from "./notifications"
import { createShipment, createShipEngineShipment } from "./shipments"

export interface CreateOrderData {
  shipping_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone: string
  }
}

export async function createOrder(orderData: CreateOrderData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Debes iniciar sesión para crear un pedido" }
  }

  // Get cart items
  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(
        id,
        title,
        price,
        stock_quantity,
        seller_id
      )
    `)
    .eq("user_id", user.id)

  if (cartError || !cartItems || cartItems.length === 0) {
    return { success: false, error: "El carrito está vacío" }
  }

  // Calculate total
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity
  }, 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: orderData.shipping_address,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error("[v0] Error creating order:", orderError)
    return { success: false, error: "Error al crear el pedido" }
  }

  // Create order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    seller_id: item.product.seller_id,
    quantity: item.quantity,
    price_at_purchase: item.product.price,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    console.error("[v0] Error creating order items:", itemsError)
    // Rollback order
    await supabase.from("orders").delete().eq("id", order.id)
    return { success: false, error: "Error al crear los items del pedido" }
  }

  // Clear cart
  await clearCart()

  const uniqueSellerIds = [...new Set(cartItems.map((item) => item.product.seller_id))]
  for (const sellerId of uniqueSellerIds) {
    await createNotification(
      sellerId,
      "new_order",
      "Nuevo Pedido Recibido",
      `Has recibido un nuevo pedido por $${totalAmount.toFixed(2)}`,
      order.id,
    )
  }

  await createShipEngineShipment({
    orderId: order.id,
    shipTo: {
      name: orderData.shipping_address.full_name,
      phone: orderData.shipping_address.phone,
      addressLine1: orderData.shipping_address.address_line1,
      addressLine2: orderData.shipping_address.address_line2,
      city: orderData.shipping_address.city,
      state: orderData.shipping_address.state,
      postalCode: orderData.shipping_address.postal_code,
      country: orderData.shipping_address.country,
    },
    items: cartItems.map((item) => ({
      name: item.product.title,
      quantity: item.quantity,
    })),
  })

  revalidatePath("/orders")
  return { success: true, orderId: order.id }
}

export async function createGuestOrder(
  cartItems: Array<{
    product_id: string
    quantity: number
    price: number
    seller_id: string
  }>,
  shippingInfo: {
    customerName: string
    customerEmail: string
    phone: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  },
) {
  console.log("[v0] createGuestOrder - Starting")
  const supabase = await createClient()

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "El carrito está vacío" }
  }

  // Calculate total
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)

  console.log("[v0] createGuestOrder - Total amount:", totalAmount)

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      buyer_email: shippingInfo.customerEmail,
      status: "paid",
      total_amount: totalAmount,
      shipping_address: {
        full_name: shippingInfo.customerName,
        address_line1: shippingInfo.street,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.zip,
        country: shippingInfo.country,
        phone: shippingInfo.phone,
      },
      payment_intent_id: "guest_test_" + Date.now(),
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error("[v0] Error creating guest order:", orderError)
    return { success: false, error: "Error al crear el pedido: " + (orderError?.message || "Unknown error") }
  }

  console.log("[v0] createGuestOrder - Order created:", order.id)

  // Create order items
  const orderItemsData = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

  if (itemsError) {
    console.error("[v0] Error creating order items:", itemsError)
    await supabase.from("orders").delete().eq("id", order.id)
    return { success: false, error: "Error al crear los items del pedido" }
  }

  console.log("[v0] createGuestOrder - Order complete, ID:", order.id)

  const uniqueSellerIds = [...new Set(cartItems.map((item) => item.seller_id))]
  for (const sellerId of uniqueSellerIds) {
    await createNotification(
      sellerId,
      "new_order",
      "Nuevo Pedido Recibido",
      `Has recibido un nuevo pedido por $${totalAmount.toFixed(2)}`,
      order.id,
    )
  }

  await createShipEngineShipment({
    orderId: order.id,
    shipTo: {
      name: shippingInfo.customerName,
      phone: shippingInfo.phone,
      addressLine1: shippingInfo.street,
      city: shippingInfo.city,
      state: shippingInfo.state,
      postalCode: shippingInfo.zip,
      country: shippingInfo.country,
    },
    items: cartItems.map((item) => ({
      name: `Product ${item.product_id}`,
      quantity: item.quantity,
    })),
  })

  revalidatePath("/orders")
  revalidatePath("/seller")
  return { success: true, orderId: order.id }
}

export async function createTestOrder(shippingInfo: {
  customerName: string
  customerEmail: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}) {
  console.log("[v0] createTestOrder - Starting")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] createTestOrder - User:", user?.id || "Guest user")

  if (user) {
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
      *,
      product:products(
        id,
        title,
        price,
        stock_quantity,
        seller_id
      )
    `)
      .eq("user_id", user.id)

    console.log("[v0] createTestOrder - Cart items:", cartItems?.length || 0)

    if (cartError || !cartItems || cartItems.length === 0) {
      console.log("[v0] createTestOrder - Cart error:", cartError)
      return { success: false, error: "El carrito está vacío" }
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity
    }, 0)

    console.log("[v0] createTestOrder - Total amount:", totalAmount)

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        status: "paid",
        total_amount: totalAmount,
        shipping_address: {
          full_name: shippingInfo.customerName,
          address_line1: shippingInfo.street,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zip,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
        },
        payment_intent_id: "test_" + Date.now(),
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("[v0] Error creating order:", orderError)
      return { success: false, error: "Error al crear el pedido: " + (orderError?.message || "Unknown error") }
    }

    console.log("[v0] createTestOrder - Order created:", order.id)

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      seller_id: item.product.seller_id,
      quantity: item.quantity,
      price_at_purchase: item.product.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("[v0] Error creating order items:", itemsError)
      await supabase.from("orders").delete().eq("id", order.id)
      return { success: false, error: "Error al crear los items del pedido" }
    }

    console.log("[v0] createTestOrder - Order items created")

    const clearResult = await clearCart()
    if (!clearResult.success) {
      console.error("[v0] Warning: Failed to clear cart after order creation")
    } else {
      console.log("[v0] createTestOrder - Cart cleared successfully")
    }

    console.log("[v0] createTestOrder - Order complete, ID:", order.id)

    const uniqueSellerIds = [...new Set(cartItems.map((item) => item.product.seller_id))]
    for (const sellerId of uniqueSellerIds) {
      await createNotification(
        sellerId,
        "new_order",
        "Nuevo Pedido Recibido",
        `Has recibido un nuevo pedido por $${totalAmount.toFixed(2)}`,
        order.id,
      )
    }

    await createShipEngineShipment({
      orderId: order.id,
      shipTo: {
        name: shippingInfo.customerName,
        phone: shippingInfo.phone,
        addressLine1: shippingInfo.street,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postalCode: shippingInfo.zip,
        country: shippingInfo.country,
      },
      items: cartItems.map((item) => ({
        name: item.product.title,
        quantity: item.quantity,
      })),
    })

    revalidatePath("/orders")
    revalidatePath("/seller")
    revalidatePath("/cartplus")
    return { success: true, orderId: order.id }
  }

  return {
    success: false,
    error: "Por favor usa la función de pedido de invitado",
  }
}

export async function getOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          id,
          title,
          image_url,
          images
        )
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching orders:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Guest user - fetch order without buyer_id filter
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            title,
            image_url,
            images,
            description
          )
        )
      `)
      .eq("id", orderId)
      .is("buyer_id", null) // Only fetch guest orders
      .single()

    if (error) {
      console.error("[v0] Error fetching guest order:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  // Authenticated user - fetch their order
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          id,
          title,
          image_url,
          images,
          description
        )
      )
    `)
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .single()

  if (error) {
    console.error("[v0] Error fetching order:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getSellerOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  console.log("[v0] Fetching seller orders for user:", user.id)

  // Get order items for this seller's products
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      order:orders(
        id,
        status,
        total_amount,
        buyer_email,
        shipping_address,
        created_at
      ),
      product:products(
        id,
        title,
        image_url,
        images
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  console.log("[v0] Order items found:", orderItems?.length || 0)

  if (itemsError) {
    console.error("[v0] Error fetching seller orders:", itemsError)
    return { success: false, error: itemsError.message }
  }

  // Group by order
  const ordersMap = new Map()
  orderItems?.forEach((item) => {
    if (!ordersMap.has(item.order.id)) {
      ordersMap.set(item.order.id, {
        ...item.order,
        items: [],
      })
    }
    ordersMap.get(item.order.id).items.push({
      id: item.id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      product: item.product,
    })
  })

  const orders = Array.from(ordersMap.values())

  console.log("[v0] Grouped orders:", orders.length)

  return { success: true, data: orders }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  // Verify the seller owns products in this order
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("seller_id")
    .eq("order_id", orderId)
    .eq("seller_id", user.id)
    .limit(1)

  if (!orderItems || orderItems.length === 0) {
    return { success: false, error: "No tienes permiso para actualizar este pedido" }
  }

  // Update order status
  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

  if (error) {
    console.error("[v0] Error updating order status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/seller")
  return { success: true }
}

export async function shipOrder(orderId: string, carrier: string, trackingNumber: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  // Verify the seller owns products in this order
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("seller_id")
    .eq("order_id", orderId)
    .eq("seller_id", user.id)
    .limit(1)

  if (!orderItems || orderItems.length === 0) {
    return { success: false, error: "No tienes permiso para actualizar este pedido" }
  }

  const shipmentResult = await createShipment({
    order_id: orderId,
    tracking_number: trackingNumber,
    carrier: carrier,
  })

  if (!shipmentResult.success) {
    return { success: false, error: shipmentResult.error || "Error al crear el envío" }
  }

  revalidatePath("/orders")
  revalidatePath("/seller")
  return { success: true }
}

export async function cancelOrder(orderId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  // Verify the seller owns products in this order
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("seller_id")
    .eq("order_id", orderId)
    .eq("seller_id", user.id)
    .limit(1)

  if (!orderItems || orderItems.length === 0) {
    return { success: false, error: "No tienes permiso para actualizar este pedido" }
  }

  // Update order with cancellation reason
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
    })
    .eq("id", orderId)

  if (error) {
    console.error("[v0] Error cancelling order:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/seller")
  return { success: true }
}

export async function syncOrderStatus(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  console.log("[v0] Syncing order status for:", orderId)

  // Verify the seller owns products in this order
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("seller_id")
    .eq("order_id", orderId)
    .eq("seller_id", user.id)
    .limit(1)

  if (!orderItems || orderItems.length === 0) {
    return { success: false, error: "No tienes permiso para actualizar este pedido" }
  }

  // Check if order has a shipment
  const { data: shipment } = await supabase.from("shipments").select("*").eq("order_id", orderId).maybeSingle()

  if (shipment) {
    // Order has a shipment, update status to shipped
    const { error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: shipment.tracking_number,
        shipping_carrier: shipment.carrier,
      })
      .eq("id", orderId)

    if (error) {
      console.error("[v0] Error syncing order status:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Order status synced to shipped")
    revalidatePath("/orders")
    return { success: true, message: "Estado actualizado a enviado" }
  }

  console.log("[v0] No shipment found for order")
  return { success: false, error: "Este pedido no tiene etiqueta de envío" }
}

export async function getOrdersByUserEmail(email: string) {
  const supabase = await createClient()

  console.log("[v0] Fetching orders for email:", email)

  // Get orders by buyer email
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          id,
          title,
          image_url,
          images
        )
      )
    `)
    .eq("buyer_email", email)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("[v0] Error fetching orders by email:", ordersError)
    return { success: false, error: ordersError.message, data: [] }
  }

  // Also get orders where the user is the buyer (by user ID)
  const { data: userByEmail } = await supabase.from("users").select("id").eq("email", email).maybeSingle()

  if (userByEmail) {
    const { data: userOrders, error: userOrdersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            title,
            image_url,
            images
          )
        )
      `)
      .eq("buyer_id", userByEmail.id)
      .order("created_at", { ascending: false })

    if (!userOrdersError && userOrders) {
      // Merge both results, avoiding duplicates
      const allOrders = [...(orders || []), ...userOrders]
      const uniqueOrders = Array.from(new Map(allOrders.map((order) => [order.id, order])).values())

      console.log("[v0] Total orders found:", uniqueOrders.length)
      return { success: true, data: uniqueOrders }
    }
  }

  console.log("[v0] Orders found:", orders?.length || 0)
  return { success: true, data: orders || [] }
}

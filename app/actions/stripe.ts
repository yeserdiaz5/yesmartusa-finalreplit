"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getGuestCart } from "@/lib/guest-cart"

interface CheckoutData {
  customerName: string
  customerEmail: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export async function createStripeCheckoutSession(checkoutData: CheckoutData, isGuest: boolean) {
  const supabase = await createClient()

  let cartItems: any[] = []
  let userId: string | null = null

  if (!isGuest) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Debes iniciar sesión para proceder al pago")
    }

    userId = user.id

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(
          id,
          title,
          description,
          price,
          stock_quantity,
          seller_id
        )
      `)
      .eq("user_id", user.id)

    if (error || !data || data.length === 0) {
      throw new Error("El carrito está vacío")
    }

    cartItems = data
  } else {
    cartItems = getGuestCart()

    if (cartItems.length === 0) {
      throw new Error("El carrito está vacío")
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => {
    const price = isGuest ? item.product.price : item.product.price
    return sum + price * item.quantity
  }, 0)

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: userId,
      buyer_email: isGuest ? checkoutData.customerEmail : null,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: {
        name: checkoutData.customerName,
        email: checkoutData.customerEmail,
        phone: checkoutData.phone,
        street: checkoutData.street,
        city: checkoutData.city,
        state: checkoutData.state,
        zip: checkoutData.zip,
        country: checkoutData.country,
      },
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error("Error al crear la orden: " + orderError?.message)
  }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: isGuest ? item.product_id : item.product.id,
    seller_id: item.product.seller_id,
    quantity: item.quantity,
    price_at_purchase: item.product.price,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    // Rollback order if items creation fails
    await supabase.from("orders").delete().eq("id", order.id)
    throw new Error("Error al crear los items de la orden: " + itemsError.message)
  }

  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product.title,
        description: item.product.description || "",
      },
      unit_amount: Math.round(item.product.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/checkoutplus/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/checkoutplus`,
    customer_email: checkoutData.customerEmail,
    metadata: {
      order_id: order.id,
      user_id: userId || "guest",
    },
  })

  return { sessionId: session.id, url: session.url, orderId: order.id }
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session
}

export async function updateOrderStatusToPaid(orderId: string, paymentIntentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    throw new Error("Error al actualizar el estado de la orden: " + error.message)
  }

  return { success: true }
}

"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function createStripeCheckoutSession(
  isGuest: boolean,
  guestCartItems?: any[],
  userEmail?: string | null
) {
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
          seller_id,
          shipping_policy,
          shipping_cost
        )
      `)
      .eq("user_id", user.id)

    if (error || !data || data.length === 0) {
      throw new Error("El carrito está vacío")
    }

    cartItems = data
  } else {
    // Use cart items passed from client (since we can't access localStorage on server)
    if (!guestCartItems || guestCartItems.length === 0) {
      throw new Error("El carrito está vacío")
    }
    cartItems = guestCartItems
  }

  // Calculate product total
  const productTotal = cartItems.reduce((sum, item) => {
    const price = isGuest ? item.product.price : item.product.price
    return sum + price * item.quantity
  }, 0)

  // Calculate shipping total (only when buyer pays or shared)
  const shippingTotal = cartItems.reduce((sum, item) => {
    const product = item.product
    const shippingPolicy = product.shipping_policy
    const shippingCost = product.shipping_cost || 0

    // Buyer pays full shipping
    if (shippingPolicy === 'buyer_pays') {
      return sum + shippingCost * item.quantity
    }
    // Shared: buyer pays 50%
    if (shippingPolicy === 'shared') {
      return sum + (shippingCost * 0.5) * item.quantity
    }
    // Seller pays: buyer pays nothing
    return sum
  }, 0)

  const totalAmount = productTotal + shippingTotal

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: userId,
      buyer_email: userEmail,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: null, // Stripe will collect this
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

  const lineItems = cartItems.map((item) => {
    const productData: any = {
      name: item.product.title,
    }
    
    // Only add description if it exists and is not empty
    if (item.product.description && item.product.description.trim() !== "") {
      productData.description = item.product.description
    }
    
    return {
      price_data: {
        currency: "usd",
        product_data: productData,
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }
  })

  // Add shipping as a separate line item if there's a shipping cost
  if (shippingTotal > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Shipping",
          description: "Shipping costs for your order",
        },
        unit_amount: Math.round(shippingTotal * 100), // Convert to cents
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/checkoutplus/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/checkoutplus`,
    customer_email: userEmail || undefined,
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'MX', 'GB', 'AU', 'ES', 'FR', 'DE', 'IT', 'BR', 'AR', 'CL', 'CO', 'PE'],
    },
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

export async function updateOrderWithShippingAddress(orderId: string, sessionId: string) {
  const supabase = await createClient()
  
  try {
    // Get shipping address from Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.customer_details?.address) {
      const { error } = await supabase
        .from("orders")
        .update({
          shipping_address: {
            name: session.customer_details.name || '',
            street: session.customer_details.address.line1 || '',
            street2: session.customer_details.address.line2 || undefined,
            city: session.customer_details.address.city || '',
            state: session.customer_details.address.state || '',
            zip: session.customer_details.address.postal_code || '',
            country: session.customer_details.address.country || '',
          },
          status: "paid",
          payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) {
        throw new Error("Error al actualizar la orden: " + error.message)
      }
    }

    return { success: true }
  } catch (error: any) {
    throw new Error("Error al procesar información de envío: " + error.message)
  }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export type CancellationReason = 
  // Razones para vendedores
  | "out_of_stock" 
  | "pricing_error"
  | "cannot_fulfill"
  | "duplicate_order"
  // Razones para compradores
  | "changed_mind"
  | "found_better_price"
  | "ordered_by_mistake"
  | "delivery_too_long"
  | "other"

const SELLER_REASONS: Record<string, string> = {
  out_of_stock: "Producto agotado",
  pricing_error: "Error en el precio",
  cannot_fulfill: "No puedo cumplir con el pedido",
  duplicate_order: "Pedido duplicado",
}

const BUYER_REASONS: Record<string, string> = {
  changed_mind: "Cambié de opinión",
  found_better_price: "Encontré mejor precio",
  ordered_by_mistake: "Pedido por error",
  delivery_too_long: "Tiempo de entrega muy largo",
  other: "Otra razón",
}

export async function getSellerCancellationReasons() {
  return Object.entries(SELLER_REASONS).map(([value, label]) => ({ value, label }))
}

export async function getBuyerCancellationReasons() {
  return Object.entries(BUYER_REASONS).map(([value, label]) => ({ value, label }))
}

interface CancelOrderParams {
  orderId: string
  reason: CancellationReason
  additionalNotes?: string
  userType: "seller" | "buyer"
}

export async function cancelOrder({ orderId, reason, additionalNotes, userType }: CancelOrderParams) {
  try {
    const supabase = await createClient()

    // Get the order with all details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(seller_id)
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    // Check if order can be cancelled (not shipped or delivered)
    if (order.status === "shipped" || order.status === "delivered") {
      return { success: false, error: "No se puede cancelar un pedido que ya ha sido enviado" }
    }

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para cancelar un pedido" }
    }

    if (userType === "seller") {
      // Verify user is the seller of ALL items in the order
      // A seller can only cancel if they are the seller of every single item
      const sellerIds = order.order_items?.map((item: any) => item.product?.seller_id) || []
      const uniqueSellerIds = [...new Set(sellerIds)]
      
      // If there are multiple sellers, or if the single seller is not the current user, reject
      if (uniqueSellerIds.length !== 1 || uniqueSellerIds[0] !== user.id) {
        return { 
          success: false, 
          error: uniqueSellerIds.length > 1 
            ? "Este pedido contiene productos de múltiples vendedores. No puedes cancelar todo el pedido."
            : "No tienes permiso para cancelar este pedido" 
        }
      }
    } else if (userType === "buyer") {
      // Verify user is the buyer
      if (order.buyer_id !== user.id) {
        return { success: false, error: "No tienes permiso para cancelar este pedido" }
      }
    }

    // Process refund if order was paid
    let refundId: string | null = null
    if (order.status === "paid" && order.payment_intent_id && !order.payment_intent_id.startsWith("test_") && !order.payment_intent_id.startsWith("guest_test_")) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.payment_intent_id,
          reason: "requested_by_customer",
          metadata: {
            order_id: orderId,
            cancellation_reason: reason,
            cancelled_by: userType,
          },
        })
        refundId = refund.id
      } catch (stripeError: any) {
        console.error("Error processing refund:", stripeError)
        return { 
          success: false, 
          error: `Error al procesar el reembolso: ${stripeError.message}` 
        }
      }
    }

    // Build cancellation reason text
    const reasonText = userType === "seller" 
      ? SELLER_REASONS[reason] || reason
      : BUYER_REASONS[reason] || reason
    
    const fullReason = additionalNotes 
      ? `${reasonText} - ${additionalNotes}`
      : reasonText

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: fullReason,
        refund_id: refundId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: "Error al cancelar el pedido: " + updateError.message }
    }

    return { 
      success: true, 
      refundProcessed: !!refundId,
      message: refundId 
        ? "Pedido cancelado y reembolso procesado exitosamente" 
        : "Pedido cancelado exitosamente"
    }
  } catch (error: any) {
    console.error("Error cancelling order:", error)
    return { success: false, error: error.message || "Error al cancelar el pedido" }
  }
}

// For guest users - verify by email
export async function cancelOrderByEmail({ 
  orderId, 
  email, 
  reason, 
  additionalNotes 
}: { 
  orderId: string
  email: string
  reason: CancellationReason
  additionalNotes?: string
}) {
  try {
    const supabase = await createClient()

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("buyer_email", email)
      .single()

    if (orderError || !order) {
      return { success: false, error: "Pedido no encontrado o el email no coincide" }
    }

    // Check if order can be cancelled
    if (order.status === "shipped" || order.status === "delivered") {
      return { success: false, error: "No se puede cancelar un pedido que ya ha sido enviado" }
    }

    // Process refund if order was paid
    let refundId: string | null = null
    if (order.status === "paid" && order.payment_intent_id && !order.payment_intent_id.startsWith("test_") && !order.payment_intent_id.startsWith("guest_test_")) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.payment_intent_id,
          reason: "requested_by_customer",
          metadata: {
            order_id: orderId,
            cancellation_reason: reason,
            cancelled_by: "guest_buyer",
            buyer_email: email,
          },
        })
        refundId = refund.id
      } catch (stripeError: any) {
        console.error("Error processing refund:", stripeError)
        return { 
          success: false, 
          error: `Error al procesar el reembolso: ${stripeError.message}` 
        }
      }
    }

    // Build cancellation reason text
    const reasonText = BUYER_REASONS[reason] || reason
    const fullReason = additionalNotes 
      ? `${reasonText} - ${additionalNotes}`
      : reasonText

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: fullReason,
        refund_id: refundId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: "Error al cancelar el pedido: " + updateError.message }
    }

    return { 
      success: true, 
      refundProcessed: !!refundId,
      message: refundId 
        ? "Pedido cancelado y reembolso procesado exitosamente" 
        : "Pedido cancelado exitosamente"
    }
  } catch (error: any) {
    console.error("Error cancelling order:", error)
    return { success: false, error: error.message || "Error al cancelar el pedido" }
  }
}

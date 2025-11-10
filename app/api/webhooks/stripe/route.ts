import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log("[v0] Stripe webhook event:", event.type)

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    console.log("[v0] Checkout session completed:", session.id)
    console.log("[v0] Order ID from metadata:", session.metadata?.order_id)
    console.log("[v0] Payment intent:", session.payment_intent)

    const orderId = session.metadata?.order_id
    const paymentIntentId = session.payment_intent as string

    if (orderId && paymentIntentId) {
      // Update order status to 'paid'
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
        console.error("[v0] Error updating order status:", error)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      console.log("[v0] Order status updated to 'paid' for order:", orderId)
    }
  }

  return NextResponse.json({ received: true })
}

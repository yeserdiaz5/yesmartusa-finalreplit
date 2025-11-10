import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  console.log("[v0] Webhook received at /api/webhooks/stripe")
  
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    console.error("[v0] No Stripe signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error(`[v0] Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`[v0] Stripe webhook event received: ${event.type}`)

  const supabase = await createClient()

  try {
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        console.log("[v0] Checkout session completed:", {
          sessionId: session.id,
          orderId: session.metadata?.order_id,
          paymentIntent: session.payment_intent,
        })

        const orderId = session.metadata?.order_id
        const paymentIntentId = session.payment_intent as string

        if (!orderId) {
          console.error("[v0] ERROR: No order_id in session metadata")
          break
        }

        if (!paymentIntentId) {
          console.error("[v0] ERROR: No payment_intent in session")
          break
        }

        // Update order status to 'paid'
        const { data: updatedOrder, error } = await supabase
          .from("orders")
          .update({
            status: "paid",
            payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .select()
          .single()

        if (error) {
          console.error("[v0] ERROR updating order status:", error)
          return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
        }

        console.log(`[v0] SUCCESS: Order ${orderId} status updated to 'paid'`)
        break
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account

        console.log("[v0] Stripe Connect account updated:", {
          id: account.id,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        })

        // Find user with this Stripe account
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("stripe_connect_account_id", account.id)
          .single()

        if (!user) {
          console.log("[v0] WARNING: No user found for account:", account.id)
          break
        }

        // Update verification status based on Stripe account capabilities
        const isVerified = account.charges_enabled && account.payouts_enabled

        await supabase
          .from("users")
          .update({
            stripe_account_verified: isVerified,
            stripe_account_verified_at: isVerified
              ? new Date().toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        console.log("[v0] SUCCESS: User verification status updated:", {
          userId: user.id,
          email: user.email,
          verified: isVerified,
        })

        // Send welcome email if newly verified
        if (isVerified && !user.stripe_account_verified) {
          try {
            const { sendSellerWelcomeEmail } = await import("@/lib/email/welcome-seller")
            await sendSellerWelcomeEmail({
              to: user.email,
              sellerName: user.full_name || user.email || "Seller",
            })
            console.log("[v0] SUCCESS: Welcome email sent to:", user.email)
          } catch (emailError) {
            console.error("[v0] ERROR sending welcome email:", emailError)
          }
        }

        break
      }

      case "account.application.deauthorized": {
        const account = event.data.object as any
        console.log("[v0] Account deauthorized:", account.id)

        // Find and update user
        await supabase
          .from("users")
          .update({
            stripe_account_verified: false,
            stripe_account_verified_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_connect_account_id", account.id)

        console.log("[v0] SUCCESS: User de-verified for account:", account.id)
        break
      }

      case "capability.updated": {
        const capability = event.data.object as Stripe.Capability
        console.log(`[v0] INFO: Capability ${capability.id} status: ${capability.status}`)
        break
      }

      default:
        console.log(`[v0] INFO: Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] ERROR: Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

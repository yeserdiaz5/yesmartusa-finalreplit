import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("[v0] No Stripe signature found")
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err: any) {
      console.error(`[v0] Webhook signature verification failed: ${err.message}`)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    console.log("[v0] Stripe Connect webhook event:", event.type)

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account
        
        console.log("[v0] Account updated:", {
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
          console.log("[v0] No user found for account:", account.id)
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

        console.log("[v0] Updated user verification status:", {
          userId: user.id,
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
            console.log("[v0] Welcome email sent to:", user.email)
          } catch (emailError) {
            console.error("[v0] Error sending welcome email:", emailError)
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

        break
      }

      case "capability.updated": {
        const capability = event.data.object as Stripe.Capability
        console.log(`[v0] Capability ${capability.id} status: ${capability.status}`)
        break
      }

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

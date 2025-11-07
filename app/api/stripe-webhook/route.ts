import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { sendSellerWelcomeEmail } from "@/lib/email/welcome-seller"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "No signature found" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`[v0] Webhook signature verification failed:`, err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    console.log(`[v0] Received Stripe webhook event: ${event.type}`)

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account
      const supabase = await createClient()

      // Find user by stripe account id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("stripe_connect_account_id", account.id)
        .single()

      if (userError || !user) {
        console.error(`[v0] User not found for account ${account.id}`)
        return NextResponse.json({ received: true })
      }

      // Check if account is now verified and can accept charges
      if (account.charges_enabled && account.payouts_enabled) {
        console.log(`[v0] Account ${account.id} is now verified and active`)

        // Check if already verified (avoid duplicate emails)
        if (user.stripe_account_verified) {
          console.log(`[v0] User ${user.id} already verified, skipping`)
          return NextResponse.json({ received: true })
        }

        // Update user as verified
        const { error: updateError } = await supabase
          .from("users")
          .update({
            stripe_account_verified: true,
            stripe_account_verified_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (updateError) {
          console.error(`[v0] Error updating user:`, updateError)
          return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
          )
        }

        // Send welcome email
        try {
          await sendSellerWelcomeEmail({
            to: user.email,
            sellerName: user.full_name || user.store_name || "Seller",
          })
          console.log(`[v0] Welcome email sent to ${user.email}`)
        } catch (emailError: any) {
          console.error(`[v0] Error sending welcome email:`, emailError.message)
          // Don't fail the webhook if email fails
        }

        console.log(`[v0] User ${user.id} verified and notified successfully`)
      } else if (!account.charges_enabled || !account.payouts_enabled) {
        // Account has been disabled or restricted by Stripe
        console.log(`[v0] Account ${account.id} is no longer active (charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled})`)

        // Only unverify if user was previously verified
        if (user.stripe_account_verified) {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              stripe_account_verified: false,
              stripe_account_verified_at: null,
            })
            .eq("id", user.id)

          if (updateError) {
            console.error(`[v0] Error unverifying user:`, updateError)
            return NextResponse.json(
              { error: "Failed to update user" },
              { status: 500 }
            )
          }

          console.log(`[v0] User ${user.id} unverified due to Stripe account restrictions`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

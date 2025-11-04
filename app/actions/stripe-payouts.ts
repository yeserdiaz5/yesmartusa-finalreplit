"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function getSellerPayoutStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    // Get seller's orders
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select(`
        *,
        order:orders(
          id,
          status,
          total_amount,
          created_at,
          payment_intent_id
        )
      `)
      .eq("seller_id", user.id)
      .eq("order.status", "paid")

    if (error) {
      console.error("[v0] Error fetching seller orders:", error)
      return { success: false, error: error.message }
    }

    // Calculate earnings
    const totalEarnings =
      orderItems?.reduce((sum, item) => {
        return sum + item.price_at_purchase * item.quantity
      }, 0) || 0

    // Get recent payments
    const recentPayments =
      orderItems?.slice(0, 10).map((item) => ({
        id: item.order.id,
        amount: item.price_at_purchase * item.quantity,
        date: item.order.created_at,
        status: item.order.status,
        paymentIntentId: item.order.payment_intent_id,
      })) || []

    return {
      success: true,
      data: {
        totalEarnings,
        pendingPayouts: 0, // This would come from Stripe Connect
        recentPayments,
        orderCount: orderItems?.length || 0,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error in getSellerPayoutStats:", error)
    return { success: false, error: error.message }
  }
}

export async function createStripeConnectAccount(email: string) {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    return { success: true, accountId: account.id }
  } catch (error: any) {
    console.error("[v0] Error creating Stripe Connect account:", error)
    return { success: false, error: error.message }
  }
}

export async function createStripeAccountLink(accountId: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/seller/pagos`,
      return_url: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"}/seller/pagos?setup=complete`,
      type: "account_onboarding",
    })

    return { success: true, url: accountLink.url }
  } catch (error: any) {
    console.error("[v0] Error creating account link:", error)
    return { success: false, error: error.message }
  }
}

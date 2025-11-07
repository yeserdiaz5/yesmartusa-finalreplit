import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Check if already has an account
    if (userData.stripe_connect_account_id) {
      return NextResponse.json({
        accountId: userData.stripe_connect_account_id,
        exists: true,
      })
    }

    // Create Express connected account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    // Save to database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        stripe_connect_account_id: account.id,
        stripe_account_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error saving Stripe account:", updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log("[v0] Created Stripe Connect account:", account.id)

    return NextResponse.json({
      accountId: account.id,
      exists: false,
    })
  } catch (error: any) {
    console.error("[v0] Error creating Stripe Connect account:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

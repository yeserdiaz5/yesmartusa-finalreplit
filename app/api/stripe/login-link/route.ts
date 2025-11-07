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

    if (!userData || !userData.stripe_connect_account_id) {
      return NextResponse.json(
        { error: "No tienes una cuenta de Stripe Connect" },
        { status: 404 }
      )
    }

    // Create login link to Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(
      userData.stripe_connect_account_id
    )

    console.log("[v0] Created login link for account:", userData.stripe_connect_account_id)

    return NextResponse.json({
      url: loginLink.url,
    })
  } catch (error: any) {
    console.error("[v0] Error creating login link:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

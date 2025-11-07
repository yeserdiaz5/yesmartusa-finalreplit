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

    // Get user data - NEVER trust client-supplied account IDs for security
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!userData || !userData.stripe_connect_account_id) {
      return NextResponse.json(
        { error: "No tienes una cuenta de Stripe Connect. Por favor crea una primero." },
        { status: 404 }
      )
    }

    const accountId = userData.stripe_connect_account_id

    // Determine base URL based on environment
    let baseUrl: string
    
    if (process.env.REPLIT_DEPLOYMENT === "1") {
      // Production - use APP_URL environment variable
      baseUrl = process.env.APP_URL || "https://yesmartusa.com"
    } else {
      // Development - use Replit dev URL or localhost
      baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
                (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/onboarding/refresh`,
      return_url: `${baseUrl}/onboarding/complete`,
      type: "account_onboarding",
    })

    console.log("[v0] Created onboarding link for account:", accountId)
    console.log("[v0] Base URL:", baseUrl)

    return NextResponse.json({
      url: accountLink.url,
    })
  } catch (error: any) {
    console.error("[v0] Error creating onboarding link:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

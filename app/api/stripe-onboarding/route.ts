import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getOrCreateStripeAccount,
  createStripeAccountLink,
} from "@/app/actions/stripe-payouts"

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    // Obtener o crear cuenta de Stripe
    const accountResult = await getOrCreateStripeAccount(user.id, user.email!)
    
    if (!accountResult.success) {
      return NextResponse.json(
        { error: accountResult.error },
        { status: 400 }
      )
    }

    // Crear link de onboarding
    const linkResult = await createStripeAccountLink(accountResult.accountId!)
    
    if (!linkResult.success) {
      return NextResponse.json(
        { error: linkResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      url: linkResult.url,
    })
  } catch (error: any) {
    console.error("[v0] Error in stripe onboarding:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateState } from "@/lib/amazon/crypto"
import { cookies } from "next/headers"

const AMAZON_OAUTH_URL = "https://sellercentral.amazon.com/apps/authorize/consent"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = process.env.AMAZON_CLIENT_ID
    const redirectUri = process.env.AMAZON_REDIRECT_URI

    if (!clientId || !redirectUri) {
      console.error("[v0] Amazon OAuth credentials not configured")
      return NextResponse.json(
        { error: "Amazon integration not configured" },
        { status: 500 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const marketplaceId = searchParams.get("marketplace") || "ATVPDKIKX0DER"

    const state = generateState()

    const cookieStore = await cookies()
    cookieStore.set("amazon_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    })

    cookieStore.set("amazon_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    })

    cookieStore.set("amazon_oauth_marketplace", marketplaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    })

    const params = new URLSearchParams({
      application_id: clientId,
      state: state,
      redirect_uri: redirectUri,
    })

    const authorizeUrl = `${AMAZON_OAUTH_URL}?${params.toString()}`

    return NextResponse.json({
      success: true,
      authorize_url: authorizeUrl,
    })
  } catch (error: any) {
    console.error("[v0] Error generating Amazon OAuth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    )
  }
}

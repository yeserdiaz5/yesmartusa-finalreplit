import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyState } from "@/lib/amazon/crypto"
import { saveAmazonCredentials } from "@/lib/amazon/token-manager"

const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token"

function getRegionFromMarketplace(marketplaceId: string): string {
  const naMarketplaces = ["ATVPDKIKX0DER", "A2EUQ1WTGCTBG2", "A1AM78C64UM0Y8"]
  const euMarketplaces = [
    "A1PA6795UKMFR9",
    "A1F83G8C2ARO7P",
    "A13V1IB3VIYZZH",
    "A1805IZSGTT6HS",
    "APJ6JRA9NG5V4",
    "A1C3SOZRARQ6R3",
    "AMEN7PMS3EDWL",
    "A1RKKUPIHCS9HS",
    "A33AVAJ2PDY3EV",
  ]
  
  if (naMarketplaces.includes(marketplaceId)) {
    return "na"
  } else if (euMarketplaces.includes(marketplaceId)) {
    return "eu"
  } else {
    return "fe"
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get("spapi_oauth_code")
    const state = searchParams.get("state")
    const sellingPartnerId = searchParams.get("selling_partner_id")

    if (!code || !state || !sellingPartnerId) {
      console.error("[v0] Missing OAuth parameters")
      return NextResponse.redirect(
        new URL("/seller/products/new?error=amazon_auth_failed", req.url)
      )
    }

    const cookieStore = await cookies()
    const savedState = cookieStore.get("amazon_oauth_state")?.value
    const userId = cookieStore.get("amazon_oauth_user")?.value
    const marketplaceId = cookieStore.get("amazon_oauth_marketplace")?.value || "ATVPDKIKX0DER"

    if (!savedState || !userId) {
      console.error("[v0] Missing OAuth state or user ID")
      return NextResponse.redirect(
        new URL("/seller/products/new?error=amazon_auth_failed", req.url)
      )
    }

    if (!verifyState(state, savedState)) {
      console.error("[v0] Invalid OAuth state")
      return NextResponse.redirect(
        new URL("/seller/products/new?error=amazon_auth_failed", req.url)
      )
    }

    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET
    const redirectUri = process.env.AMAZON_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("[v0] Amazon OAuth credentials not configured")
      return NextResponse.redirect(
        new URL("/seller/products/new?error=amazon_config_error", req.url)
      )
    }

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log("[v0] Exchanging authorization code for tokens...")

    const tokenResponse = await fetch(LWA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Failed to exchange code for tokens:", errorText)
      return NextResponse.redirect(
        new URL("/seller/products/new?error=amazon_token_exchange_failed", req.url)
      )
    }

    const tokenData = await tokenResponse.json()

    const region = getRegionFromMarketplace(marketplaceId)

    await saveAmazonCredentials({
      userId: userId,
      sellingPartnerId: sellingPartnerId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      marketplaceId: marketplaceId,
      region: region,
    })

    cookieStore.delete("amazon_oauth_state")
    cookieStore.delete("amazon_oauth_user")
    cookieStore.delete("amazon_oauth_marketplace")

    console.log("[v0] Amazon OAuth completed successfully")

    return NextResponse.redirect(
      new URL("/seller/products/new?amazon_connected=true", req.url)
    )
  } catch (error: any) {
    console.error("[v0] Error in Amazon OAuth callback:", error)
    return NextResponse.redirect(
      new URL("/seller/products/new?error=amazon_auth_error", req.url)
    )
  }
}

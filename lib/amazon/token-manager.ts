import { createClient } from "@/lib/supabase/server"
import { encryptToken, decryptToken } from "./crypto"

const TOKEN_BUFFER_MINUTES = 5
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token"

interface AmazonCredentials {
  id: number
  user_id: string
  selling_partner_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  marketplace_id: string
  region: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

function isTokenExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const bufferMs = TOKEN_BUFFER_MINUTES * 60 * 1000
  
  return now >= expiryTime - bufferMs
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.AMAZON_CLIENT_ID
  const clientSecret = process.env.AMAZON_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Amazon credentials not configured")
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(LWA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] Failed to refresh Amazon token:", error)
    throw new Error("Failed to refresh Amazon access token")
  }

  return response.json()
}

export async function getValidAccessToken(
  userId: string,
  marketplaceId: string = "ATVPDKIKX0DER"
): Promise<string> {
  const supabase = await createClient()

  const { data: credentials, error } = await supabase
    .from("amazon_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("marketplace_id", marketplaceId)
    .single()

  if (error || !credentials) {
    throw new Error("Amazon credentials not found. Please connect your Amazon account first.")
  }

  const creds = credentials as unknown as AmazonCredentials

  let accessToken = decryptToken(creds.access_token)
  const needsRefresh = isTokenExpired(creds.token_expires_at)

  if (needsRefresh) {
    console.log("[v0] Access token expired, refreshing...")
    
    const refreshToken = decryptToken(creds.refresh_token)
    const tokenResponse = await refreshAccessToken(refreshToken)

    const newAccessToken = tokenResponse.access_token
    const expiresIn = tokenResponse.expires_in
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const encryptedAccessToken = encryptToken(newAccessToken)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : creds.refresh_token

    const { error: updateError } = await supabase
      .from("amazon_credentials")
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: newExpiresAt,
      })
      .eq("id", creds.id)

    if (updateError) {
      console.error("[v0] Failed to update refreshed token:", updateError)
      throw new Error("Failed to save refreshed token")
    }

    console.log("[v0] Access token refreshed successfully")
    accessToken = newAccessToken
  }

  return accessToken
}

export async function saveAmazonCredentials(params: {
  userId: string
  sellingPartnerId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  marketplaceId: string
  region: string
}): Promise<void> {
  const supabase = await createClient()

  const encryptedAccessToken = encryptToken(params.accessToken)
  const encryptedRefreshToken = encryptToken(params.refreshToken)
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString()

  const { error } = await supabase.from("amazon_credentials").upsert(
    {
      user_id: params.userId,
      selling_partner_id: params.sellingPartnerId,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt,
      marketplace_id: params.marketplaceId,
      region: params.region,
    },
    {
      onConflict: "user_id,marketplace_id",
    }
  )

  if (error) {
    console.error("[v0] Failed to save Amazon credentials:", error)
    throw new Error("Failed to save Amazon credentials")
  }

  console.log("[v0] Amazon credentials saved successfully")
}

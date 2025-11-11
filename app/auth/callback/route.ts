import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Auth callback started")
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next")
  const origin = requestUrl.origin

  console.log("[v0] Callback params:", {
    token_hash: token_hash ? "present" : "missing",
    type,
    next,
  })

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log("[v0] VerifyOtp result:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      error: error?.message,
    })

    if (error) {
      console.log("[v0] Error verifying OTP:", error.message)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`)
    }

    if (data.session) {
      console.log("[v0] Valid session created, redirecting to update-password")
      return NextResponse.redirect(`${origin}/auth/update-password`)
    }
  }

  if (next) {
    console.log("[v0] Redirecting to next:", next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.log("[v0] No valid params, redirecting to home")
  return NextResponse.redirect(`${origin}/`)
}

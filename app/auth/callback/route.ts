import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Password reset callback started")
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const origin = requestUrl.origin

  console.log("[v0] Callback params:", { code: code ? "present" : "missing", next })

  if (code) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log("[v0] Exchange result:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      error: error?.message,
    })

    if (error) {
      console.log("[v0] Error exchanging code:", error.message)
      return NextResponse.redirect(`${origin}/auth/error?error=${error.message}`)
    }

    if (data.session) {
      console.log("[v0] Valid session found, redirecting to update-password")
      return NextResponse.redirect(`${origin}/auth/update-password`)
    }
  }

  if (next) {
    console.log("[v0] Redirecting to next:", next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.log("[v0] No code or next param, redirecting to home")
  return NextResponse.redirect(`${origin}/`)
}

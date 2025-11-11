import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/auth/update-password"

  console.log('[AUTH CONFIRM] Token hash:', token_hash ? 'EXISTS' : 'MISSING')
  console.log('[AUTH CONFIRM] Type:', type)
  console.log('[AUTH CONFIRM] Next:', next)

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log('[AUTH CONFIRM] Verify result - Error:', error?.message || 'NONE')
    console.log('[AUTH CONFIRM] Verify result - Session:', data?.session ? 'EXISTS' : 'NONE')

    if (!error && data?.session) {
      console.log('[AUTH CONFIRM] ✅ Redirecting to:', next)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
    
    console.log('[AUTH CONFIRM] ❌ Verification failed')
  }

  console.log('[AUTH CONFIRM] ⚠️ Missing parameters or verification failed, redirecting to error page')
  return NextResponse.redirect(new URL("/auth/update-password?error=invalid_link", requestUrl.origin))
}

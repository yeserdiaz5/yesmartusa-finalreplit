import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendUserWelcomeEmail } from "@/lib/email/welcome-user"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next")
  const origin = requestUrl.origin

  console.log('[AUTH CALLBACK] Code:', code ? 'EXISTS' : 'NONE')
  console.log('[AUTH CALLBACK] Token hash:', token_hash ? 'EXISTS' : 'NONE')
  console.log('[AUTH CALLBACK] Type:', type)
  console.log('[AUTH CALLBACK] Next:', next)

  // Handle password recovery/reset
  if (token_hash && type === 'recovery') {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log('[AUTH CALLBACK] Recovery - Error:', error?.message || 'NONE')
    console.log('[AUTH CALLBACK] Recovery - Session:', data?.session ? 'EXISTS' : 'NONE')

    if (!error && data?.session) {
      console.log('[AUTH CALLBACK] ✅ Recovery successful, redirecting to update-password')
      return NextResponse.redirect(`${origin}/auth/update-password`)
    }
    
    console.log('[AUTH CALLBACK] ❌ Recovery failed, redirecting to update-password with error')
    return NextResponse.redirect(`${origin}/auth/update-password?error=invalid_link`)
  }

  // Handle OAuth callback
  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Send welcome email for new OAuth users (fire-and-forget)
    if (data?.user) {
      const isNewUser = data.user.created_at === data.user.last_sign_in_at
      
      if (isNewUser && data.user.email) {
        const userName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email.split('@')[0]
        
        // Send welcome email asynchronously (don't block redirect)
        sendUserWelcomeEmail({
          to: data.user.email,
          userName: userName,
        }).catch((error) => {
          console.warn("[v0] Failed to send OAuth welcome email:", error)
        })
      }
    }
  }

  console.log('[AUTH CALLBACK] Redirecting to homepage')
  return NextResponse.redirect(`${origin}/`)
}

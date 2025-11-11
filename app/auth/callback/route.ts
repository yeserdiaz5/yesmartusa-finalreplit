import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendUserWelcomeEmail } from "@/lib/email/welcome-user"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

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

  return NextResponse.redirect(`${origin}/`)
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      cookies: allCookies.map((c) => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
      cookieCount: allCookies.length,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

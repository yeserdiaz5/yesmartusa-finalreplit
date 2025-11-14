import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If Supabase is not configured, allow public access but block protected routes
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("[v0] Supabase not configured - authentication features disabled")
      
      // Define routes that require authentication
      const protectedRoutes = ["/seller", "/admin", "/orders"]
      const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

      // Redirect to login for protected routes when Supabase is not configured
      if (isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Define routes that require authentication
    const protectedRoutes = ["/seller", "/admin", "/orders"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Redirect to login only if accessing protected routes without authentication
    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check admin role for admin routes
    if (user && request.nextUrl.pathname.startsWith("/admin")) {
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (userProfile?.role !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = "/"
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return supabaseResponse
  }
}

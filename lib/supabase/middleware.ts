import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // CRITICAL: Only write to supabaseResponse.cookies for production edge runtime
          // Writing to request.cookies causes issues in production deployments
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // CRITICAL: Only write to supabaseResponse.cookies for production edge runtime
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (error: any) {
    // Handle rate limit errors - don't kick user out, just log it
    if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
      console.log('[Middleware] Rate limit reached - allowing through without re-auth')
      // Don't set user to null, instead skip authentication check for this request
      // This prevents kicking users out when rate limit is hit
      return supabaseResponse
    }
    console.error('[Middleware] Auth error:', error)
  }

  // Debug logging
  console.log('[Middleware] Path:', request.nextUrl.pathname)
  console.log('[Middleware] User:', user ? `Found (${user.id})` : 'Not found')
  console.log('[Middleware] Cookies:', request.cookies.getAll().map(c => c.name).join(', '))

  // Define routes that require authentication
  const protectedRoutes = ["/seller", "/admin", "/orders"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Redirect to login only if accessing protected routes without authentication
  if (!user && isProtectedRoute && !request.nextUrl.pathname.startsWith("/auth")) {
    console.log('[Middleware] Redirecting to login - no user found for protected route')
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

  // IMPORTANT: You must return the supabaseResponse object as it is
  return supabaseResponse
}

import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname
  
  // Redirect only seller-related routes from www to non-www for Stripe compatibility
  const isSellerRoute = pathname.startsWith("/seller/pagos") || 
                       pathname.startsWith("/onboarding/")
  
  if (hostname === "www.yesmartusa.com" && isSellerRoute) {
    const url = request.nextUrl.clone()
    url.host = "yesmartusa.com"
    url.protocol = "https"
    return NextResponse.redirect(url, 301)
  }

  if (request.method === "POST") {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

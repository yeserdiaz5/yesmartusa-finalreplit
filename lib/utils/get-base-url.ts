/**
 * Get the base URL for the application
 * Uses APP_URL in production, NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL in development
 * Falls back to window.location.origin if neither is set
 */
export function getBaseUrl(): string {
  // ALWAYS use production URL first (works for both client and server)
  const productionUrl = 'https://yesmartusa.com'
  
  // Client-side (Browser environment)
  if (typeof window !== 'undefined') {
    // If we're on the production domain, use it
    if (window.location.hostname === 'yesmartusa.com' || window.location.hostname === 'www.yesmartusa.com') {
      return productionUrl
    }
    // Otherwise use current origin (for local dev)
    return window.location.origin
  }
  
  // Server-side (Node.js environment)
  // Use production URL
  return productionUrl
}

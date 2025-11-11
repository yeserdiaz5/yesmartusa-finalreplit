/**
 * Get the base URL for the application
 * Uses APP_URL in production, NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL in development
 * Falls back to window.location.origin if neither is set
 */
export function getBaseUrl(): string {
  // Client-side (Browser environment) - Always use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server-side (Node.js environment)
  // Production URL from environment variable
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }
  
  // Replit domain
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0]
    return `https://${domain}`
  }
  
  // Development URL
  if (process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL) {
    return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  }
  
  // Fallback
  return 'http://localhost:3000'
}

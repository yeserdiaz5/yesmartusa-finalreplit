import { createClient } from "@/lib/supabase/server"
import type { User, UserRole } from "@/lib/types/database"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      console.log("[v0] No authenticated user found")
      return null
    }

    try {
      const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userError) {
        console.error("[v0] Error fetching user profile:", userError)
        return null
      }

      return user
    } catch (error) {
      console.error("[v0] Exception fetching user profile:", error)
      return null
    }
  } catch (error) {
    console.error("[v0] Critical error in getCurrentUser:", error)
    return null
  }
}

// Only admin role is still restricted
export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Only check roles if admin is required
  if (allowedRoles && allowedRoles.includes("admin") && user.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }

  return user
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

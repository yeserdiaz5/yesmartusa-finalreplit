"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer - Validates auth at data access point, not in middleware
export const verifySession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { isAuth: false, user: null, userId: null }
  }

  return { isAuth: true, user, userId: user.id }
})

// Get current user or throw error
export async function getCurrentUser() {
  const session = await verifySession()

  if (!session.isAuth || !session.user) {
    throw new Error("Unauthorized")
  }

  return session.user
}

// Get current user ID or throw error
export async function getCurrentUserId() {
  const session = await verifySession()

  if (!session.isAuth || !session.userId) {
    throw new Error("Unauthorized")
  }

  return session.userId
}

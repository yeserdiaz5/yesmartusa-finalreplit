"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("[v0] Error fetching notifications:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, count: 0 }
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error("[v0] Error fetching notification count:", error)
    return { success: false, count: 0 }
  }

  return { success: true, count: count || 0 }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/seller")
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

  if (error) {
    console.error("[v0] Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/seller")
  return { success: true }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  orderId?: string,
) {
  const supabase = await createClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    order_id: orderId,
  })

  if (error) {
    console.error("[v0] Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

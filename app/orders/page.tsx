import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSellerOrders } from "@/app/actions/orders"
import OrdersPageClient from "./orders-page-client"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const ordersResult = await getSellerOrders()
  const orders = ordersResult.success ? ordersResult.data || [] : []

  return <OrdersPageClient user={userProfile} orders={orders} />
}

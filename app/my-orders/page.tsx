import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrders } from "@/app/actions/orders"
import MyOrdersClient from "./my-orders-client"

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const ordersResult = await getOrders()
  const orders = ordersResult.success ? ordersResult.data || [] : []

  return <MyOrdersClient user={userProfile} orders={orders} />
}

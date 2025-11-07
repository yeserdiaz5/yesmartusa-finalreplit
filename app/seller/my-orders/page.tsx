import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSellerOrders } from "@/app/actions/orders"
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

  const ordersResult = await getSellerOrders()
  const allOrders = ordersResult.success ? ordersResult.data || [] : []
  
  // Filtrar pedidos pendientes
  const orders = allOrders.filter((order: any) => order.status !== "pending")

  return <MyOrdersClient user={userProfile} orders={orders} />
}

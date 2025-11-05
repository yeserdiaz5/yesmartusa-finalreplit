import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrders } from "@/app/actions/orders"
import MisComprasClient from "./mis-compras-client"

export default async function MisComprasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const ordersResult = await getOrders()
  const allOrders = ordersResult.success ? ordersResult.data || [] : []
  
  // Filtrar pedidos pendientes
  const orders = allOrders.filter((order: any) => order.status !== "pending")

  return <MisComprasClient user={userProfile} orders={orders} />
}

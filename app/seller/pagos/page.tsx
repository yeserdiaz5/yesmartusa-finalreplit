import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PagosClient from "./pagos-client"
import { getSellerPayoutStats } from "@/app/actions/stripe-payouts"

export default async function PagosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is a seller
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userData || (userData.role !== "seller" && userData.role !== "admin")) {
    redirect("/")
  }

  // Get payout stats
  const statsResult = await getSellerPayoutStats()
  const stats = statsResult.success ? statsResult.data : null

  return <PagosClient user={user} stats={stats} />
}

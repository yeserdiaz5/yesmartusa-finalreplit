import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ComprasClient from "./compras-client"

export default async function ComprasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch purchases (compras) filtering by buyer_id and excluding pending orders
  const { data: compras, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          id,
          title,
          image_url,
          images
        )
      ),
      shipments(
        id,
        tracking_number,
        tracking_url,
        carrier,
        status,
        estimated_delivery
      )
    `)
    .eq("buyer_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false })

  const purchases = error ? [] : compras || []

  return <ComprasClient user={userProfile} compras={purchases} />
}

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

  // Fetch purchases (compras) filtering by buyer_id
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
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  const purchases = error ? [] : compras || []

  return <ComprasClient user={userProfile} compras={purchases} />
}

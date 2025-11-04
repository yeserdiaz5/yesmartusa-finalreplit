import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProductsBySellerId } from "@/app/actions/products"
import TiendaClient from "./tienda-client"

interface TiendaPageProps {
  params: {
    sellerId: string
  }
}

export default async function TiendaPage({ params }: TiendaPageProps) {
  const supabase = await createClient()
  
  // Get current user (optional, for showing "add to cart" etc.)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userProfile } = user
    ? await supabase.from("users").select("*").eq("id", user.id).single()
    : { data: null }

  // Get seller and their products
  const result = await getProductsBySellerId(params.sellerId)

  if (!result.data) {
    notFound()
  }

  const { seller, products } = result.data

  return <TiendaClient seller={seller} products={products || []} currentUser={userProfile} />
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CreateLabelClient from "./create-label-client"

export const dynamic = "force-dynamic"

export default async function CreateLabelPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const orderId = searchParams.orderId as string

  if (!orderId) {
    redirect("/orders")
  }

  console.log("[v0] CreateLabel - Fetching order:", orderId)

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(*)
      )
    `,
    )
    .eq("id", orderId)
    .single()

  console.log("[v0] CreateLabel - Order result:", { order, orderError })

  if (orderError || !order) {
    console.error("[v0] CreateLabel - Order error:", orderError)
    redirect("/orders")
  }

  // Get seller info
  const sellerId = order.items[0]?.product?.seller_id

  console.log("[v0] CreateLabel - Seller ID:", sellerId)

  if (!sellerId) {
    console.error("[v0] CreateLabel - No seller ID found")
    redirect("/orders")
  }

  const { data: seller, error: sellerError } = await supabase
    .from("users")
    .select("full_name, phone, seller_address")
    .eq("id", sellerId)
    .single()

  console.log("[v0] CreateLabel - Seller result:", { seller, sellerError })

  // Get authenticated user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return <CreateLabelClient order={order} seller={seller} user={userProfile || user} />
}

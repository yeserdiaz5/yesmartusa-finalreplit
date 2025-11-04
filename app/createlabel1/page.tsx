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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware already redirects if no user, but double-check
  if (!user) {
    redirect("/auth/login")
  }

  const orderId = searchParams.orderId as string

  if (!orderId) {
    redirect("/orders")
  }

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

  if (orderError || !order) {
    redirect("/orders")
  }

  // Get seller info
  const sellerId = order.items[0]?.product?.seller_id

  if (!sellerId) {
    redirect("/orders")
  }

  const { data: seller } = await supabase
    .from("users")
    .select("full_name, phone, seller_address")
    .eq("id", sellerId)
    .single()

  return <CreateLabelClient order={order} seller={seller} user={user} />
}

import { createClient } from "@/lib/supabase/server"
import { SuccessClient } from "./success-client"
import { updateOrderWithShippingAddress } from "@/app/actions/stripe"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order_id?: string; session_id?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Update order with shipping address from Stripe
  if (searchParams.order_id && searchParams.session_id) {
    try {
      await updateOrderWithShippingAddress(searchParams.order_id, searchParams.session_id)
    } catch (error) {
      console.error("Error updating shipping address:", error)
    }
  }

  return <SuccessClient orderId={searchParams.order_id} user={user} />
}

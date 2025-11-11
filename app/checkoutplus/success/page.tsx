import { createClient } from "@/lib/supabase/server"
import { SuccessClient } from "./success-client"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order_id?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <SuccessClient orderId={searchParams.order_id} user={user} />
}

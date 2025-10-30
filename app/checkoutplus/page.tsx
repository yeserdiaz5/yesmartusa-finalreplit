import { CheckoutClient } from "./checkout-client"
import { getCurrentUser } from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

export default async function CheckoutPlusPage() {
  let user = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    // Guest user - no authentication required
    console.log("[v0] Checkout page - Guest user")
  }

  return <CheckoutClient initialUser={user} />
}

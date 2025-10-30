import { getCurrentUser } from "@/lib/auth/utils"
import SiteHeader from "@/components/site-header"
import { CartPageClient } from "./cart-page-client"

export const dynamic = "force-dynamic"

export default async function CartPlusPage() {
  let user = null
  try {
    user = await getCurrentUser()
  } catch (error) {
    // Guest user - no authentication required
    console.log("[v0] Cart page - Guest user")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />
      <CartPageClient user={user} />
    </div>
  )
}

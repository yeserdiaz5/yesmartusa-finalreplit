import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PagosClient from "./pagos-client"
import {
  getSellerPayoutStats,
  getPayoutSchedule,
  markAccountOnboardingComplete,
} from "@/app/actions/stripe-payouts"
import { sendSellerReviewEmail } from "@/lib/email/welcome-seller"

export default async function PagosPage({
  searchParams,
}: {
  searchParams: { setup?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user data - ANY authenticated user can be a seller
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData) {
    redirect("/")
  }

  // Si viene de completar el onboarding de Stripe, marcar como completado y enviar email
  if (searchParams.setup === "complete") {
    await markAccountOnboardingComplete(user.id)
    
    // Send review email to seller
    try {
      await sendSellerReviewEmail({
        to: user.email || "",
        sellerName: userData.full_name || user.email || "Seller",
      })
      console.log("[v0] Review email sent to seller:", user.email)
    } catch (error) {
      console.error("[v0] Failed to send review email:", error)
      // Don't block the user flow if email fails
    }
  }

  // Get payout stats
  const statsResult = await getSellerPayoutStats()
  const scheduleResult = await getPayoutSchedule()

  return (
    <PagosClient
      user={userData}
      statsResult={statsResult}
      scheduleResult={scheduleResult}
      setupComplete={searchParams.setup === "complete"}
    />
  )
}

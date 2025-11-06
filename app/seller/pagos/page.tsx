import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PagosClient from "./pagos-client"
import {
  getSellerPayoutStats,
  getPayoutSchedule,
  markAccountOnboardingComplete,
} from "@/app/actions/stripe-payouts"

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

  // Check if user is a seller
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData || (userData.role !== "seller" && userData.role !== "admin")) {
    redirect("/")
  }

  // Si viene de completar el onboarding de Stripe, marcar como completado
  if (searchParams.setup === "complete") {
    await markAccountOnboardingComplete(user.id)
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

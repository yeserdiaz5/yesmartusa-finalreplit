import { requireAuth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import SellerSettingsClient from "./seller-settings-client"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function SellerSettingsPage() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Get user profile with seller_address
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, email, full_name, store_name, seller_address, phone")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      redirect("/")
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader user={userProfile} showSearch={false} />

        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Configuración de Cuenta</h1>
            <p className="text-gray-600">Administra tu tienda y dirección de envío</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <SellerSettingsClient user={userProfile} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    redirect("/")
  }
}

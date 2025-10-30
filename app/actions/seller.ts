"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface SellerAddress {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string // Added phone field to seller address
}

export interface UpdateSellerSettingsInput {
  store_name: string
  seller_address: SellerAddress
}

export async function updateSellerSettings(input: UpdateSellerSettingsInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    const { error } = await supabase
      .from("users")
      .update({
        store_name: input.store_name,
        seller_address: input.seller_address,
      })
      .eq("id", user.id)

    if (error) {
      console.error("[v0] Error updating seller settings:", error)
      return { error: "Error al actualizar la configuración" }
    }

    revalidatePath("/seller/settings")
    revalidatePath("/seller")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { error: "Error inesperado" }
  }
}

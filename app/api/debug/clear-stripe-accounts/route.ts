import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Limpiar todas las cuentas de Stripe Connect de todos los usuarios
    const { data, error } = await supabase
      .from("users")
      .update({
        stripe_connect_account_id: null,
        stripe_account_verified: false,
        stripe_account_verified_at: null,
      })
      .not("stripe_connect_account_id", "is", null)
      .select("id")

    if (error) {
      console.error("[DEBUG] Error clearing Stripe accounts:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Error al limpiar las cuentas: ${error.message}`,
        },
        { status: 500 }
      )
    }

    const count = data?.length || 0

    return NextResponse.json({
      success: true,
      message: `Se limpiaron ${count} cuentas de Stripe exitosamente. Los usuarios ahora pueden crear nuevas cuentas en modo LIVE.`,
      count,
    })
  } catch (error: any) {
    console.error("[DEBUG] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Error inesperado",
      },
      { status: 500 }
    )
  }
}

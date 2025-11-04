import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/compras
 * Returns all purchases (compras) made by the authenticated user
 * Uses buyer_id (compradorId) to filter orders
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    // Query orders table filtering by buyer_id (compradorId)
    const { data: compras, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          product:products(
            id,
            title,
            image_url,
            images,
            description,
            price
          )
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching compras:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: compras || [],
    })
  } catch (error) {
    console.error("[API] Unexpected error in /api/compras:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

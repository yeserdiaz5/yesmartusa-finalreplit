import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, description, price, category, is_active")
      .order("created_at", { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      total: products?.length || 0,
      products: products || [],
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido" 
      },
      { status: 500 }
    )
  }
}

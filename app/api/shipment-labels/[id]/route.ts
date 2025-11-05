import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/shipment-labels/[id]
 * Serve PDF label from database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const labelId = params.id
    
    const { data: label, error: labelError } = await supabase
      .from("shipment_labels")
      .select('*, shipments!inner(order_id)')
      .eq('id', labelId)
      .single()
    
    if (labelError || !label) {
      console.error("[v0] Error fetching label:", labelError)
      return NextResponse.json(
        { error: "Etiqueta no encontrada" },
        { status: 404 }
      )
    }
    
    const orderId = label.shipments.order_id
    
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select('id, buyer_id, order_items(product_id, products(seller_id))')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      console.error("[v0] Error fetching order:", orderError)
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }
    
    const isBuyer = order.buyer_id === user.id
    const sellerIds = order.order_items?.map((item: any) => item.products?.seller_id) || []
    const isSeller = sellerIds.includes(user.id)
    
    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta etiqueta" },
        { status: 403 }
      )
    }
    
    if (!label.file_bytes) {
      return NextResponse.json(
        { error: "El archivo PDF no está disponible" },
        { status: 404 }
      )
    }
    
    const pdfBuffer = Buffer.from(label.file_bytes, "base64")
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="label-${label.tracking_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=31536000',
      },
    })
  } catch (error: any) {
    console.error("[v0] Error serving label PDF:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

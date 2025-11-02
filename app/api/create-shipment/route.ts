import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendOrderEmail, sellerLabelCreatedTemplate } from "@/lib/email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rate_id, to_address, from_address, parcel, order_id, seller_email } = body

    console.log("[v0] Creating shipment with data:", {
      rate_id,
      order_id,
      has_addresses: !!to_address && !!from_address,
      has_parcel: !!parcel,
    })

    // Validate required fields
    if (!to_address || !from_address || !parcel) {
      return NextResponse.json({ error: "Missing required fields: to_address, from_address, parcel" }, { status: 400 })
    }

    let transactionBody: any

    if (rate_id) {
      // If we have a rate_id, use it directly
      transactionBody = {
        rate: rate_id,
        label_file_type: "PDF",
        async: false,
      }
    } else {
      // Otherwise, create transaction with full address details
      transactionBody = {
        shipment: {
          address_from: from_address,
          address_to: to_address,
          parcels: [parcel],
        },
        carrier_account: undefined, // Let Shippo choose the best carrier
        servicelevel_token: "usps_priority",
      }
    }

    console.log("[v0] Calling Shippo transactions API...")

    // Make request to Shippo API
    const response = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionBody),
    })

    const shipmentData = await response.json()

    console.log("[v0] Shippo response:", { status: shipmentData.status, tracking_number: shipmentData.tracking_number })

    if (!response.ok || shipmentData.status === "ERROR") {
      console.error("[v0] Shippo API error:", shipmentData)
      throw new Error(shipmentData.messages?.[0]?.text || "Error creating shipment")
    }

    if (shipmentData.status === "SUCCESS" && seller_email) {
      try {
        const emailData = {
          orderNumber: order_id,
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.provider,
          labelUrl: shipmentData.label_url,
        }

        console.log("[v0] Sending label created email to seller:", seller_email)
        const emailResult = await sendOrderEmail(seller_email, "Etiqueta creada", sellerLabelCreatedTemplate(emailData))
        console.log("[v0] Seller email result:", emailResult)
      } catch (emailError) {
        console.error("[v0] Error sending seller email (non-fatal):", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      data: shipmentData,
    })
  } catch (error: any) {
    console.error("[v0] Error creating Shippo shipment:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al crear envío",
      },
      { status: 500 },
    )
  }
}

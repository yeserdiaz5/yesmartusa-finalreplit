import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  sendOrderEmail,
  labelCreatedTemplate,
  inTransitTemplate,
  deliveredTemplate,
  shippingFailedTemplate,
} from "@/lib/email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[v0] SHIPPO WEBHOOK EVENT:", JSON.stringify(body, null, 2))

    const eventType = body.event
    const data = body.data

    console.log("[v0] Event type:", eventType)
    console.log("[v0] Event data:", JSON.stringify(data, null, 2))

    if (eventType === "track_updated" || eventType === "TRACK_UPDATED") {
      const trackingNumber = data.tracking_number
      const trackingStatus = data.tracking_status?.status || data.status
      const carrier = data.carrier

      console.log("[v0] Processing tracking update:", {
        trackingNumber,
        trackingStatus,
        carrier,
      })

      if (!trackingNumber) {
        console.log("[v0] No tracking number found in event")
        return new NextResponse("OK - No tracking number", { status: 200 })
      }

      const { data: orders, error: findError } = await supabase
        .from("orders")
        .select("*, users!orders_buyer_id_fkey(email, full_name, id)")
        .eq("tracking_number", trackingNumber)
        .limit(1)

      console.log("[v0] Found orders:", orders)
      console.log("[v0] Find error:", findError)

      if (findError) {
        console.error("[v0] Error finding order:", findError)
        return new NextResponse("Error finding order", { status: 500 })
      }

      if (!orders || orders.length === 0) {
        console.log("[v0] No order found with tracking number:", trackingNumber)
        return new NextResponse("OK - Order not found", { status: 200 })
      }

      const order = orders[0]
      console.log("[v0] Updating order:", order.id)

      const shippingStatusMap: Record<string, string> = {
        UNKNOWN: "unknown",
        PRE_TRANSIT: "label_created",
        TRANSIT: "in_transit",
        DELIVERED: "delivered",
        RETURNED: "return_to_sender",
        FAILURE: "failed",
      }

      const mappedStatus = shippingStatusMap[trackingStatus?.toUpperCase()] || trackingStatus

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (trackingStatus?.toUpperCase() === "DELIVERED" || mappedStatus === "delivered") {
        updateData.status = "completed"
        console.log("[v0] Setting order status to completed")
      }

      const { error: updateOrderError } = await supabase.from("orders").update(updateData).eq("id", order.id)

      console.log("[v0] Order update result:", { updateOrderError })

      if (updateOrderError) {
        console.error("[v0] Error updating order:", updateOrderError)
        return new NextResponse("Error updating order", { status: 500 })
      }

      const { error: updateShipmentError } = await supabase
        .from("shipments")
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString(),
          ...(mappedStatus === "delivered" && {
            delivered_at: new Date().toISOString(),
          }),
        })
        .eq("tracking_number", trackingNumber)

      console.log("[v0] Shipment update result:", { updateShipmentError })

      if (updateShipmentError) {
        console.error("[v0] Error updating shipment:", updateShipmentError)
      }

      try {
        const buyerEmail = order.users?.email
        const buyerName = order.users?.full_name
        const buyerId = order.users?.id

        if (buyerEmail && buyerId) {
          const { data: shipment } = await supabase
            .from("shipments")
            .select("tracking_url")
            .eq("tracking_number", trackingNumber)
            .single()

          const emailData = {
            orderNumber: order.id,
            trackingNumber: trackingNumber,
            trackingUrl: shipment?.tracking_url || data.tracking_url_provider,
            carrier: carrier,
            customerName: buyerName,
          }

          let subject = ""
          let template = ""
          let notificationTitle = ""
          let notificationMessage = ""

          if (mappedStatus === "in_transit") {
            subject = "Your Order is On the Way!"
            template = inTransitTemplate(emailData)
            notificationTitle = "Your Order is On the Way 📦"
            notificationMessage = `Your order is in transit. Tracking number: ${trackingNumber}`
          } else if (mappedStatus === "delivered") {
            subject = "Your Order Has Been Delivered!"
            template = deliveredTemplate(emailData)
            notificationTitle = "Your Order Has Been Delivered! 🎉"
            notificationMessage = `Your order has been delivered successfully.`
          } else if (mappedStatus === "failed" || mappedStatus === "return_to_sender") {
            subject = "Shipping Issue - Action May Be Required"
            template = shippingFailedTemplate(emailData)
            notificationTitle = "Shipping Issue ⚠️"
            notificationMessage = `There was a problem with your shipment. Please contact support.`
          }

          if (subject && template) {
            console.log("[v0] Sending email to buyer:", buyerEmail)
            const emailResult = await sendOrderEmail(buyerEmail, subject, template)
            console.log("[v0] Email result:", emailResult)

            // Insert notification
            const { error: notifError } = await supabase.from("notifications").insert({
              user_id: buyerId,
              type: "shipping_update",
              title: notificationTitle,
              message: notificationMessage,
              order_id: order.id,
              link: "/seller/my-orders",
            })

            if (notifError) {
              console.error("[v0] Error creating notification:", notifError)
            } else {
              console.log("[v0] Notification created successfully")
            }
          }
        } else {
          console.log("[v0] No buyer email or ID found for order:", order.id)
        }
      } catch (emailError) {
        console.error("[v0] Error sending email/notification (non-fatal):", emailError)
      }

      console.log("[v0] Successfully processed tracking update")
      return new NextResponse("OK", { status: 200 })
    }

    if (eventType === "transaction_updated" || eventType === "TRANSACTION_UPDATED") {
      const trackingNumber = data.tracking_number
      const labelUrl = data.label_url
      const trackingUrl = data.tracking_url_provider
      const carrier = data.carrier
      const orderId = data.metadata?.order_id
      const transactionStatus = data.status

      console.log("[v0] Processing transaction update:", {
        trackingNumber,
        orderId,
        carrier,
        transactionStatus,
      })

      if (orderId) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            tracking_number: trackingNumber,
            shipping_carrier: carrier,
            status: "shipped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)

        console.log("[v0] Transaction order update result:", { updateError })

        if (updateError) {
          console.error("[v0] Error updating order:", updateError)
          return new NextResponse("Error updating order", { status: 500 })
        }

        const { error: shipmentError } = await supabase.from("shipments").upsert({
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier: carrier,
          label_url: labelUrl,
          tracking_url: trackingUrl,
          status: "label_created",
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        console.log("[v0] Shipment upsert result:", { shipmentError })

        if (shipmentError) {
          console.error("[v0] Error upserting shipment:", shipmentError)
        }

        if (transactionStatus === "SUCCESS") {
          try {
            const { data: order } = await supabase
              .from("orders")
              .select("*, users!orders_buyer_id_fkey(email, full_name, id)")
              .eq("id", orderId)
              .single()

            if (order?.users?.email && order?.users?.id) {
              const emailData = {
                orderNumber: orderId,
                trackingNumber: trackingNumber,
                trackingUrl: trackingUrl,
                carrier: carrier,
                customerName: order.users.full_name,
              }

              console.log("[v0] Sending label created email to buyer:", order.users.email)
              const emailResult = await sendOrderEmail(
                order.users.email,
                "Your Order Has Been Shipped!",
                labelCreatedTemplate(emailData),
              )
              console.log("[v0] Email result:", emailResult)

              // Insert notification
              const { error: notifError } = await supabase.from("notifications").insert({
                user_id: order.users.id,
                type: "label_created",
                title: "Your Order Has Been Shipped 📦",
                message: `Your shipping label has been created for your order. Tracking number: ${trackingNumber}`,
                order_id: orderId,
                link: "/seller/my-orders",
              })

              if (notifError) {
                console.error("[v0] Error creating notification:", notifError)
              } else {
                console.log("[v0] Notification created successfully")
              }
            }
          } catch (emailError) {
            console.error("[v0] Error sending email/notification (non-fatal):", emailError)
          }
        }
      }

      console.log("[v0] Successfully processed transaction update")
      return new NextResponse("OK", { status: 200 })
    }

    if (eventType === "transaction_failed" || eventType === "TRANSACTION_FAILED") {
      const orderId = data.metadata?.order_id

      if (orderId) {
        try {
          const { data: order } = await supabase
            .from("orders")
            .select("*, users!orders_buyer_id_fkey(email, full_name, id)")
            .eq("id", orderId)
            .single()

          if (order?.users?.email && order?.users?.id) {
            const emailData = {
              orderNumber: orderId,
              customerName: order.users.full_name,
            }

            console.log("[v0] Sending failed transaction email to buyer:", order.users.email)
            const emailResult = await sendOrderEmail(
              order.users.email,
              "Shipping Issue - Action May Be Required",
              shippingFailedTemplate(emailData),
            )
            console.log("[v0] Email result:", emailResult)

            // Insert notification
            const { error: notifError } = await supabase.from("notifications").insert({
              user_id: order.users.id,
              type: "shipping_failed",
              title: "Shipping Issue ⚠️",
              message: "There was a problem creating the shipping label. Please contact support.",
              order_id: orderId,
              link: "/seller/my-orders",
            })

            if (notifError) {
              console.error("[v0] Error creating notification:", notifError)
            } else {
              console.log("[v0] Notification created successfully")
            }
          }
        } catch (emailError) {
          console.error("[v0] Error sending email/notification (non-fatal):", emailError)
        }
      }
    }

    console.log("[v0] Unhandled event type:", eventType)
    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return new NextResponse("Error", { status: 500 })
  }
}

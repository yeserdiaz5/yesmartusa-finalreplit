import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendOrderEmail, sellerLabelCreatedTemplate } from "@/lib/email-templates"
import Stripe from "stripe"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rate_id, to_address, from_address, parcel, order_id, seller_email, seller_id, product_id } = body

    console.log("[v0] Creating shipment with payment logic:", {
      rate_id,
      order_id,
      seller_id,
      product_id,
    })

    // Validate required fields
    if (!to_address || !from_address || !parcel || !seller_id || !product_id) {
      return NextResponse.json(
        { error: "Missing required fields: to_address, from_address, parcel, seller_id, product_id" },
        { status: 400 }
      )
    }

    // Get product to determine shipping policy
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("shipping_policy, shipping_cost")
      .eq("id", product_id)
      .single()

    if (productError || !product) {
      console.error("[v0] Error fetching product:", productError)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product shipping policy:", product.shipping_policy)

    // Step 1: Verify seller has valid Stripe Connect account BEFORE generating label
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("stripe_connect_account_id, stripe_account_verified")
      .eq("id", seller_id)
      .single()

    if (sellerError || !seller || !seller.stripe_connect_account_id) {
      console.error("[v0] Seller not found or no Stripe account:", sellerError)
      return NextResponse.json(
        { error: "Seller does not have a Stripe Connect account. Cannot process payout." },
        { status: 400 }
      )
    }

    if (!seller.stripe_account_verified) {
      console.error("[v0] Seller Stripe account not verified")
      return NextResponse.json(
        { error: "Seller's Stripe account is not verified. Cannot process payout." },
        { status: 400 }
      )
    }

    console.log("[v0] Seller Stripe account verified:", seller.stripe_connect_account_id)

    // Step 2: Get the shipping rate from Shippo to know the actual cost
    let actualShippingCost = 0
    if (!rate_id) {
      return NextResponse.json({ error: "rate_id is required to determine shipping cost" }, { status: 400 })
    }

    // Retrieve rate details from Shippo
    const rateResponse = await fetch(`https://api.goshippo.com/rates/${rate_id}`, {
      method: "GET",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const rateData = await rateResponse.json()
    if (!rateResponse.ok) {
      console.error("[v0] Shippo rate error:", rateData)
      throw new Error("Error fetching shipping rate from Shippo")
    }

    actualShippingCost = parseFloat(rateData.amount)
    console.log("[v0] Actual shipping cost from Shippo:", actualShippingCost)

    // Step 3: Get order to know product price
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("price_at_purchase, quantity")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .single()

    if (orderItemsError || !orderItems) {
      console.error("[v0] Error fetching order items:", orderItemsError)
      return NextResponse.json({ error: "Order items not found" }, { status: 404 })
    }

    const productRevenue = orderItems.price_at_purchase * orderItems.quantity

    // Step 4: Determine seller transfer amount based on shipping policy
    let sellerTransferAmount = 0
    let sellerDeficit = 0

    if (product.shipping_policy === "seller_pays") {
      // Seller pays: Transfer product price minus full shipping cost
      sellerTransferAmount = productRevenue - actualShippingCost
      if (sellerTransferAmount < 0) {
        sellerDeficit = Math.abs(sellerTransferAmount)
        sellerTransferAmount = 0
        console.log("[v0] WARNING: Shipping cost exceeds product revenue. Seller deficit:", sellerDeficit)
      }
      console.log("[v0] Seller will receive (product - shipping):", sellerTransferAmount)
    } else if (product.shipping_policy === "shared") {
      // Shared: Transfer product price minus 50% of shipping
      sellerTransferAmount = productRevenue - (actualShippingCost * 0.5)
      if (sellerTransferAmount < 0) {
        sellerDeficit = Math.abs(sellerTransferAmount)
        sellerTransferAmount = 0
        console.log("[v0] WARNING: Shipping cost (50%) exceeds product revenue. Seller deficit:", sellerDeficit)
      }
      console.log("[v0] Seller will receive (product - 50% shipping):", sellerTransferAmount)
    } else {
      // Buyer pays: Transfer full product price
      sellerTransferAmount = productRevenue
      console.log("[v0] Seller will receive full product price:", sellerTransferAmount)
    }

    // Step 3: Create the shipping label with Shippo
    console.log("[v0] Creating Shippo label...")

    const transactionBody: any = {
      rate: rate_id,
      label_file_type: "PDF",
      async: false,
    }

    const response = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionBody),
    })

    const shipmentData = await response.json()

    console.log("[v0] Shippo response:", {
      status: shipmentData.status,
      tracking_number: shipmentData.tracking_number,
    })

    if (!response.ok || shipmentData.status === "ERROR") {
      console.error("[v0] Shippo API error:", shipmentData)
      throw new Error(shipmentData.messages?.[0]?.text || "Error creating shipment")
    }

    // Step 5: Transfer funds to seller via Stripe Connect
    console.log("[v0] Processing seller payout:", {
      transfer_amount: sellerTransferAmount,
      deficit: sellerDeficit,
      seller_account: seller.stripe_connect_account_id,
    })

    try {
      // Only create transfer if amount is positive
      if (sellerTransferAmount > 0) {
        const transfer = await stripe.transfers.create({
          amount: Math.round(sellerTransferAmount * 100), // Convert to cents
          currency: "usd",
          destination: seller.stripe_connect_account_id,
          description: `Payment for order ${order_id} (shipping: ${product.shipping_policy})`,
          metadata: {
            order_id: order_id,
            product_id: product_id,
            seller_id: seller_id,
            shipping_policy: product.shipping_policy || "unknown",
            shipping_cost: actualShippingCost.toString(),
            seller_deficit: sellerDeficit > 0 ? sellerDeficit.toString() : "0",
          },
        })

        console.log("[v0] Transfer created successfully:", transfer.id)
      } else {
        console.log("[v0] No transfer created - seller transfer amount is zero or negative")
      }

      // Record shipping charge in database for tracking (only when seller pays something)
      // When there's a deficit, we record only the outstanding amount
      // (what seller still owes after we withheld what we could)
      const shippingChargeAmount = product.shipping_policy === "seller_pays" ? actualShippingCost :
                                    product.shipping_policy === "shared" ? actualShippingCost * 0.5 : 0

      // Only record if seller is responsible for any shipping cost
      if (product.shipping_policy !== "buyer_pays" && shippingChargeAmount > 0) {
        // If there's a deficit, the amount to record is only what's still owed
        // (not the full shipping cost, since we already withheld the product revenue)
        const amountToRecord = sellerDeficit > 0 ? sellerDeficit : shippingChargeAmount

        await supabase
          .from("shipping_charges")
          .insert({
            seller_id: seller_id,
            order_id: order_id,
            amount: amountToRecord, // Deficit if exists, otherwise full shipping charge
            type: product.shipping_policy || "unknown",
            status: sellerDeficit > 0 ? "pending" : "deducted",
            deducted_at: sellerDeficit > 0 ? null : new Date().toISOString(),
            created_at: new Date().toISOString(),
          })

        if (sellerDeficit > 0) {
          console.log(`[v0] WARNING: Seller owes platform $${sellerDeficit.toFixed(2)} deficit (shipping: $${shippingChargeAmount.toFixed(2)}, product revenue: $${productRevenue.toFixed(2)}) - recorded as pending debt`)
        } else {
          console.log(`[v0] Shipping charge $${shippingChargeAmount.toFixed(2)} deducted successfully from transfer`)
        }
      } else {
        console.log(`[v0] No shipping charge recorded - buyer paid shipping (policy: ${product.shipping_policy})`)
      }
    } catch (error: any) {
      console.error("[v0] Error processing seller payout:", error)
      return NextResponse.json(
        {
          error: "Failed to process seller payout",
          details: error.message,
          shipment_created: true,
          tracking_number: shipmentData.tracking_number,
        },
        { status: 500 }
      )
    }

    // Step 5: Send email notification to seller
    if (shipmentData.status === "SUCCESS" && seller_email) {
      try {
        // Get seller's name for personalized email
        const { data: sellerData } = await supabase
          .from("users")
          .select("full_name, store_name")
          .eq("id", seller_id)
          .single()

        const sellerName = sellerData?.store_name || sellerData?.full_name || "Seller"

        const emailData = {
          orderNumber: order_id,
          trackingNumber: shipmentData.tracking_number,
          trackingUrl: shipmentData.tracking_url_provider,
          carrier: shipmentData.provider,
          labelUrl: shipmentData.label_url,
          sellerName: sellerName,
        }

        console.log("[v0] Sending label created email to seller:", seller_email)
        const emailResult = await sendOrderEmail(seller_email, "Shipping Label Ready - Action Required", sellerLabelCreatedTemplate(emailData))
        console.log("[v0] Seller email result:", emailResult)
      } catch (emailError) {
        console.error("[v0] Error sending seller email (non-fatal):", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      data: shipmentData,
      seller_transfer_amount: sellerTransferAmount,
      shipping_cost_deducted: product.shipping_policy === "seller_pays" ? actualShippingCost : 
                               product.shipping_policy === "shared" ? actualShippingCost * 0.5 : 0,
    })
  } catch (error: any) {
    console.error("[v0] Error creating shipment with payment:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al crear envío",
      },
      { status: 500 }
    )
  }
}

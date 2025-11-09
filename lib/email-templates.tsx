import { Resend } from "resend"

let resendInstance: Resend | null = null

function getResendClient() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface OrderEmailData {
  orderNumber?: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  labelUrl?: string
  customerName?: string
  sellerName?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  total?: number
  shippingCost?: number
  productTotal?: number
}

export async function sendOrderEmail(to: string, subject: string, html: string) {
  try {
    console.log("[v0] Sending email to:", to, "Subject:", subject)

    if (!process.env.RESEND_API_KEY) {
      console.warn("[v0] RESEND_API_KEY not configured, skipping email send")
      return { success: false, error: "Email service not configured" }
    }

    const resend = getResendClient()
    
    if (!resend) {
      console.warn("[v0] Failed to initialize Resend client")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "YesmartUSA <no-reply@yesmartusa.com>",
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return { success: false, error }
    }

    console.log("[v0] Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception sending email:", error)
    return { success: false, error }
  }
}

// EMAIL TEMPLATE 1: Order Confirmation (sent to buyer after checkout)
export function orderConfirmationTemplate(data: OrderEmailData): string {
  const itemsHtml = data.items?.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          table.items { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .total-row { font-weight: bold; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.customerName || 'Customer'},</p>
            <p style="font-size: 16px;">We have received your order and it is being processed. You will receive another email when your order has been shipped.</p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Order Summary</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              
              ${data.items && data.items.length > 0 ? `
                <table class="items" style="margin-top: 20px;">
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Item</th>
                      <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db;">Qty</th>
                      <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    ${data.productTotal ? `
                      <tr>
                        <td colspan="2" style="padding: 8px; text-align: right;">Subtotal:</td>
                        <td style="padding: 8px; text-align: right;">$${data.productTotal.toFixed(2)}</td>
                      </tr>
                    ` : ''}
                    ${data.shippingCost ? `
                      <tr>
                        <td colspan="2" style="padding: 8px; text-align: right;">Shipping:</td>
                        <td style="padding: 8px; text-align: right;">$${data.shippingCost.toFixed(2)}</td>
                      </tr>
                    ` : ''}
                    ${data.total ? `
                      <tr class="total-row">
                        <td colspan="2" style="padding: 12px 8px 8px 8px; text-align: right; border-top: 2px solid #d1d5db;">Total:</td>
                        <td style="padding: 12px 8px 8px 8px; text-align: right; border-top: 2px solid #d1d5db;">$${data.total.toFixed(2)}</td>
                      </tr>
                    ` : ''}
                  </tfoot>
                </table>
              ` : ''}
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">We will send you tracking information as soon as your order ships.</p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for shopping with YesmartUSA!
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// EMAIL TEMPLATE 2: Shipping Label Created (sent to seller)
export function sellerLabelCreatedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Shipping Label Ready!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your shipping label has been created</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.sellerName || 'Seller'},</p>
            <p style="font-size: 16px;">Your shipping label has been successfully created for order <strong>#${data.orderNumber || 'N/A'}</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Shipping Details</h3>
              <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Carrier:</strong> ${data.carrier || "N/A"}</p>
            </div>
            
            <div class="warning-box">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Important:</strong> Please download and print your shipping label, then attach it to your package before dropping it off at the carrier location.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              ${data.labelUrl ? `<a href="${data.labelUrl}" class="button">Download Label</a>` : ""}
              ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button" style="background: #10b981;">Track Shipment</a>` : ""}
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              <strong>Next Steps:</strong>
            </p>
            <ol style="font-size: 15px; line-height: 1.8; color: #4b5563;">
              <li>Download and print the shipping label</li>
              <li>Pack your item securely</li>
              <li>Attach the label to the package</li>
              <li>Drop off at nearest ${data.carrier || 'carrier'} location</li>
            </ol>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Thank you for being a YesmartUSA seller!
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// EMAIL TEMPLATE 3: Order Shipped (sent to buyer)
export function orderShippedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Your Order is On the Way!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Track your package</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.customerName || 'Customer'},</p>
            <p style="font-size: 16px;">Great news! Your order <strong>#${data.orderNumber || 'N/A'}</strong> has been shipped and is on its way to you.</p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Tracking Information</h3>
              <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Carrier:</strong> ${data.carrier || "N/A"}</p>
            </div>
            
            ${data.trackingUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.trackingUrl}" class="button">Track My Package</a>
              </div>
            ` : ''}
            
            <p style="font-size: 16px; margin-top: 30px;">
              You can track your package in real-time using the tracking number above. We will notify you when your order is out for delivery.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for shopping with YesmartUSA!
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// EMAIL TEMPLATE 4: Order Delivered (sent to buyer)
export function orderDeliveredTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Order Delivered!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your package has arrived</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.customerName || 'Customer'},</p>
            
            <div class="success-box">
              <p style="margin: 0; color: #065f46; font-size: 16px;">
                <strong>Great news!</strong> Your order <strong>#${data.orderNumber || 'N/A'}</strong> has been successfully delivered.
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Delivery Details</h3>
              <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Carrier:</strong> ${data.carrier || "N/A"}</p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              We hope you enjoy your purchase! If you have any questions or concerns about your order, please don't hesitate to contact us.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for choosing YesmartUSA. We appreciate your business!
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// EMAIL TEMPLATE 5: Shipping Problem/Failed (sent to buyer)
export function shippingFailedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Shipping Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Important information about your order</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.customerName || 'Customer'},</p>
            
            <div class="error-box">
              <p style="margin: 0; color: #991b1b; font-size: 16px;">
                We encountered an issue with the shipment of your order <strong>#${data.orderNumber || 'N/A'}</strong>.
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Order Details</h3>
              <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber || "N/A"}</p>
              <p style="margin: 8px 0;"><strong>Carrier:</strong> ${data.carrier || "N/A"}</p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Our team has been notified and is working to resolve this issue as quickly as possible. We will contact you shortly with more information about your order.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              If you have any immediate questions or concerns, please contact our support team.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              We apologize for any inconvenience and appreciate your patience.
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// EMAIL TEMPLATE 6: Order Cancelled (sent to buyer)
export function orderCancelledTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .refund-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Order Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your order has been cancelled</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${data.customerName || 'Customer'},</p>
            <p style="font-size: 16px;">Your order <strong>#${data.orderNumber || 'N/A'}</strong> has been cancelled.</p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Order Details</h3>
              <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber || "N/A"}</p>
              ${data.total ? `<p style="margin: 8px 0;"><strong>Order Total:</strong> $${data.total.toFixed(2)}</p>` : ''}
            </div>
            
            <div class="refund-box">
              <p style="margin: 0; color: #1e40af; font-size: 16px;">
                <strong>Refund Information:</strong> Your payment has been refunded. The refund will appear in your account within 5-10 business days, depending on your bank.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              We're sorry to see your order cancelled. If you have any questions or would like to place a new order, we're here to help.
            </p>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for considering YesmartUSA.
            </p>
          </div>
          <div class="footer">
            <p>YesmartUSA - Your Trusted Marketplace</p>
            <p>© ${new Date().getFullYear()} YesmartUSA. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Legacy templates kept for backward compatibility (but translated to English)
export function labelCreatedTemplate(data: OrderEmailData): string {
  return sellerLabelCreatedTemplate(data)
}

export function inTransitTemplate(data: OrderEmailData): string {
  return orderShippedTemplate(data)
}

export function deliveredTemplate(data: OrderEmailData): string {
  return orderDeliveredTemplate(data)
}

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderEmailData {
  orderNumber?: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  labelUrl?: string
  customerName?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  total?: number
}

export async function sendOrderEmail(to: string, subject: string, html: string) {
  try {
    console.log("[v0] Sending email to:", to, "Subject:", subject)

    if (!process.env.RESEND_API_KEY) {
      console.warn("[v0] RESEND_API_KEY not configured, skipping email send")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "YesMart USA <noreply@yesmartusa.com>",
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

export function labelCreatedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #146eb4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #146eb4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Tu etiqueta de envío está lista</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tu etiqueta de envío ha sido creada exitosamente.</p>
            
            <div class="info-box">
              <strong>Número de seguimiento:</strong> ${data.trackingNumber || "N/A"}<br>
              <strong>Transportista:</strong> ${data.carrier || "N/A"}
            </div>
            
            ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button">Rastrear envío</a>` : ""}
            
            <p>Gracias por usar YesMart USA.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function inTransitTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Tu pedido va en camino</h1>
          </div>
          <div class="content">
            <p>Hola ${data.customerName || ""},</p>
            <p>¡Buenas noticias! Tu pedido está en camino.</p>
            
            <div class="info-box">
              ${data.orderNumber ? `<strong>Pedido:</strong> #${data.orderNumber}<br>` : ""}
              <strong>Número de seguimiento:</strong> ${data.trackingNumber || "N/A"}<br>
              <strong>Transportista:</strong> ${data.carrier || "N/A"}
            </div>
            
            ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button">Rastrear mi pedido</a>` : ""}
            
            <p>Gracias por tu compra en YesMart USA.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function deliveredTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Tu pedido fue entregado!</h1>
          </div>
          <div class="content">
            <p>Hola ${data.customerName || ""},</p>
            <p>¡Excelente! Tu pedido ha sido entregado exitosamente.</p>
            
            <div class="info-box">
              ${data.orderNumber ? `<strong>Pedido:</strong> #${data.orderNumber}<br>` : ""}
              <strong>Número de seguimiento:</strong> ${data.trackingNumber || "N/A"}<br>
              <strong>Transportista:</strong> ${data.carrier || "N/A"}
            </div>
            
            <p>Esperamos que disfrutes tu compra. Si tienes alguna pregunta o problema, no dudes en contactarnos.</p>
            
            <p>¡Gracias por comprar en YesMart USA!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function shippingFailedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Problema con el envío</h1>
          </div>
          <div class="content">
            <p>Hola ${data.customerName || ""},</p>
            <p>Lamentamos informarte que ha ocurrido un problema con tu envío.</p>
            
            <div class="info-box">
              ${data.orderNumber ? `<strong>Pedido:</strong> #${data.orderNumber}<br>` : ""}
              <strong>Número de seguimiento:</strong> ${data.trackingNumber || "N/A"}<br>
              <strong>Transportista:</strong> ${data.carrier || "N/A"}
            </div>
            
            <p>Nuestro equipo está trabajando para resolver este problema. Te contactaremos pronto con más información.</p>
            
            <p>Si tienes alguna pregunta, por favor contáctanos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function sellerLabelCreatedTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Etiqueta creada</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tu etiqueta de envío ha sido creada exitosamente.</p>
            
            <div class="info-box">
              ${data.orderNumber ? `<strong>Pedido:</strong> #${data.orderNumber}<br>` : ""}
              <strong>Número de seguimiento:</strong> ${data.trackingNumber || "N/A"}<br>
              <strong>Transportista:</strong> ${data.carrier || "N/A"}
            </div>
            
            ${data.labelUrl ? `<a href="${data.labelUrl}" class="button">Descargar etiqueta</a>` : ""}
            ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button">Ver seguimiento</a>` : ""}
            
            <p>Imprime la etiqueta y pégala en el paquete antes de enviarlo.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

import { type NextRequest, NextResponse } from "next/server"
import { sendOrderEmail } from "@/lib/email-templates"

export async function GET(req: NextRequest) {
  try {
    const testEmailData = {
      orderNumber: "TEST-12345",
      trackingNumber: "1Z999AA10123456784",
      trackingUrl: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
      carrier: "UPS",
      customerName: "Yeser Diaz",
    }

    const testEmailTemplate = `
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
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛒 YesMart USA</div>
              <h1>¡Bienvenido a YesMart USA!</h1>
            </div>
            <div class="content">
              <p>Hola ${testEmailData.customerName},</p>
              <p>Este es un correo de prueba para confirmar que el sistema de emails de YesMart USA está funcionando correctamente.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">✅ Sistema de Emails Configurado</h3>
                <p>Tu aplicación YesMart USA ahora puede enviar notificaciones automáticas:</p>
                <ul style="margin: 10px 0;">
                  <li>📦 Etiquetas de envío creadas</li>
                  <li>🚚 Paquetes en tránsito</li>
                  <li>✅ Entregas confirmadas</li>
                  <li>⚠️ Alertas de problemas</li>
                </ul>
              </div>

              <div class="info-box" style="border-left: 4px solid #10b981;">
                <strong>Ejemplo de datos de pedido:</strong><br>
                <strong>Número de pedido:</strong> ${testEmailData.orderNumber}<br>
                <strong>Número de seguimiento:</strong> ${testEmailData.trackingNumber}<br>
                <strong>Transportista:</strong> ${testEmailData.carrier}
              </div>
              
              <a href="${testEmailData.trackingUrl}" class="button">Ver ejemplo de seguimiento</a>
              
              <p style="margin-top: 20px;">¡Tu marketplace está listo para operar! 🎉</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Próximos pasos:</strong><br>
                1. Verifica que recibiste este email en diazyeser@gmail.com<br>
                2. Configura tu dominio personalizado en Resend<br>
                3. Personaliza las plantillas de email según tu marca
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} YesMart USA. Todos los derechos reservados.</p>
              <p style="margin-top: 10px; font-size: 11px;">Este es un correo de prueba automático generado por tu aplicación.</p>
            </div>
          </div>
        </body>
      </html>
    `

    console.log("[TEST] Sending test email to yeserdiaz5@gmail.com")
    
    const result = await sendOrderEmail(
      "yeserdiaz5@gmail.com",
      "🎉 ¡YesMart USA - Sistema de Emails Funcionando!",
      testEmailTemplate
    )

    console.log("[TEST] Email result:", result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email de prueba enviado exitosamente a yeserdiaz5@gmail.com",
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: "Error al enviar el email de prueba",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[TEST] Error sending test email:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: "Error al enviar el email de prueba",
      },
      { status: 500 }
    )
  }
}

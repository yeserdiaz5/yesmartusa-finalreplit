import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendSellerWelcomeEmailParams {
  to: string
  sellerName: string
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function sendSellerWelcomeEmail({
  to,
  sellerName,
}: SendSellerWelcomeEmailParams) {
  // Sanitize seller name to prevent HTML injection
  const safeName = escapeHtml(sellerName)
  
  try {
    const { data, error } = await resend.emails.send({
      from: "YesmartUSA <no-reply@yesmartusa.com>",
      to: [to],
      subject: "Your YesmartUSA Seller Account is Ready!",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to YesmartUSA</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                YesmartUSA
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                Great News, ${safeName}!
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your Stripe account has been successfully verified and your seller account is now fully activated!
              </p>

              <!-- Success Checklist -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; color: #047857; font-weight: bold; font-size: 16px;">Your account is complete</p>
                <p style="margin: 0 0 12px 0; color: #047857; font-size: 14px;">You can now list products</p>
                <p style="margin: 0; color: #047857; font-size: 14px;">You're ready to receive payments</p>
              </div>

              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>Next Steps:</strong>
              </p>

              <ol style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                <li>List your first product</li>
                <li>Set up your store information</li>
                <li>Start selling to thousands of buyers</li>
              </ol>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://yesmartusa.com/seller" 
                       style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Go to My Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to the YesmartUSA seller community!
              </p>

              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong>The YesmartUSA Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                YesmartUSA - Your Trusted Marketplace
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} YesmartUSA. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      throw error
    }

    console.log("[v0] Email sent successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error sending welcome email:", error)
    throw new Error(`Failed to send welcome email: ${error.message}`)
  }
}

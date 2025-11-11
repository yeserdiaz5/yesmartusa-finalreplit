import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendUserWelcomeEmailParams {
  to: string
  userName: string
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function sendUserWelcomeEmail({
  to,
  userName,
}: SendUserWelcomeEmailParams) {
  // Sanitize user name to prevent HTML injection
  const safeName = escapeHtml(userName)
  
  try {
    const { data, error } = await resend.emails.send({
      from: "YesmartUSA <no-reply@yesmartusa.com>",
      to: [to],
      subject: "Welcome to YesmartUSA - Shop Safely & Sell Easily!",
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
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                Welcome to YesmartUSA!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Your trusted marketplace for buying and selling
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">
                Hi ${safeName}!
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for joining YesmartUSA! We're excited to have you as part of our community.
              </p>

              <!-- Key Benefits Section -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 20px; font-weight: bold; text-align: center;">
                  What You Can Do on YesmartUSA
                </h3>
                
                <!-- Buy Safely -->
                <div style="margin: 20px 0; padding: 15px; background: #ffffff; border-radius: 6px; border-left: 4px solid #10b981;">
                  <h4 style="margin: 0 0 10px 0; color: #047857; font-size: 18px; font-weight: bold;">
                    🛒 Buy with Confidence & Security
                  </h4>
                  <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Shop from trusted sellers with secure payment processing powered by Stripe. Your purchases are protected, and you can track your orders every step of the way.
                  </p>
                </div>

                <!-- Sell Easily -->
                <div style="margin: 20px 0; padding: 15px; background: #ffffff; border-radius: 6px; border-left: 4px solid #f59e0b;">
                  <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                    💼 Sell Simply & Securely
                  </h4>
                  <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Want to become a seller? It's easy! Import your existing product listings from:
                  </p>
                  <ul style="margin: 10px 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.8; padding-left: 0;">
                    <li><strong>Amazon:</strong> Import your Amazon products with just one click</li>
                    <li><strong>eBay Pharmacy:</strong> Bring your pharmacy listings directly to YesmartUSA</li>
                  </ul>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; font-style: italic;">
                    No need to manually recreate your listings - we make it fast and simple!
                  </p>
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                  Ready to Get Started?
                </h3>
                
                <ol style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Browse Products:</strong> Discover great deals from trusted sellers</li>
                  <li><strong>Start Selling:</strong> Set up your seller account and import your listings</li>
                  <li><strong>Track Everything:</strong> Monitor your orders and sales in real-time</li>
                </ol>
              </div>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://yesmartusa.com/products" 
                             style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                            Start Shopping
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="https://yesmartusa.com/seller" 
                             style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                            Become a Seller
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Your Security Matters:</strong> All transactions are processed through Stripe, ensuring your payment information is always secure and protected.
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have any questions or need assistance, our support team is here to help. Just reply to this email!
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
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

    console.log("[v0] User welcome email sent successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error sending user welcome email:", error)
    throw new Error(`Failed to send user welcome email: ${error.message}`)
  }
}

import { NextRequest, NextResponse } from "next/server"
import { sendSellerWelcomeEmail } from "@/lib/email/welcome-seller"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 }
      )
    }

    await sendSellerWelcomeEmail({
      to: email,
      sellerName: name || email,
    })

    console.log("[DEBUG] Welcome email sent to:", email)

    return NextResponse.json({
      success: true,
      message: `Email de bienvenida enviado exitosamente a ${email}`,
    })
  } catch (error: any) {
    console.error("[DEBUG] Error sending welcome email:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al enviar el email: ${error.message}`,
      },
      { status: 500 }
    )
  }
}

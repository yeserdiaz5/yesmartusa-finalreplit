import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendUserWelcomeEmail } from "@/lib/email/welcome-user"

const WelcomeEmailSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  fullName: z.string().trim().min(1).max(200),
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Received welcome email request")

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("[v0] RESEND_API_KEY not configured, skipping welcome email")
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 200 } // Return 200 to not block signup flow
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = WelcomeEmailSchema.parse(body)

    console.log("[v0] Sending welcome email to:", validatedData.email)

    // Send the welcome email
    const result = await sendUserWelcomeEmail({
      to: validatedData.email,
      userName: validatedData.fullName,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("[v0] Error in welcome email endpoint:", error)

    // Return 200 even on error to not block signup flow
    // Log the error but don't fail the user registration
    return NextResponse.json(
      {
        success: false,
        error: error instanceof z.ZodError 
          ? "Invalid request data" 
          : "Failed to send welcome email",
        details: error.message,
      },
      { status: 200 }
    )
  }
}

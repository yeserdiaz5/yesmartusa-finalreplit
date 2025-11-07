import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sendSellerReviewEmail } from "@/lib/email/welcome-seller"

export default async function OnboardingCompletePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/")
  }

  // Send review email to seller (they just completed onboarding)
  try {
    await sendSellerReviewEmail({
      to: user.email || "",
      sellerName: userData.full_name || user.email || "Seller",
    })
    console.log("[v0] Review email sent to seller:", user.email)
  } catch (error) {
    console.error("[v0] Failed to send review email:", error)
    // Don't block the user flow if email fails
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full bg-card border rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Onboarding Submitted!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your seller account application has been submitted successfully.
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Under Review
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Stripe is now reviewing your account information. This process
            typically takes 5-15 minutes in test mode, or up to 24-48 hours in
            production mode.
          </p>
        </div>

        <div className="space-y-4 text-left mb-8">
          <h3 className="font-semibold text-foreground">What happens next?</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Stripe verifies your account information</li>
            <li>You will receive an email once your account is approved</li>
            <li>After approval, you can start listing products and selling</li>
          </ol>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> While your account is under review, you can
            explore your seller dashboard, but you will not be able to list
            products until the verification is complete.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/seller"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover-elevate active-elevate-2 font-medium"
            data-testid="link-seller-dashboard"
          >
            Go to Seller Dashboard
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover-elevate active-elevate-2 font-medium"
            data-testid="link-home"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

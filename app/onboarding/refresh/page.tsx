"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingRefreshPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const refreshOnboarding = async () => {
      try {
        // Get or create account
        const accountResponse = await fetch(
          "/api/stripe/create-connect-account",
          {
            method: "POST",
          }
        )

        if (!accountResponse.ok) {
          throw new Error("Failed to get Stripe account")
        }

        await accountResponse.json()

        // Create new onboarding link (accountId is fetched from database)
        const linkResponse = await fetch("/api/stripe/create-onboarding-link", {
          method: "POST",
        })

        if (!linkResponse.ok) {
          throw new Error("Failed to create onboarding link")
        }

        const { url } = await linkResponse.json()

        // Redirect to Stripe onboarding
        window.location.href = url
      } catch (err: any) {
        console.error("[v0] Error refreshing onboarding:", err)
        setError(err.message || "Failed to refresh onboarding link")
        setLoading(false)
      }
    }

    refreshOnboarding()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Error Refreshing Link
            </h1>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover-elevate active-elevate-2 font-medium"
              data-testid="button-retry"
            >
              Try Again
            </button>
            <a
              href="/seller"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover-elevate active-elevate-2 font-medium"
              data-testid="link-seller-dashboard"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="w-8 h-8 text-blue-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Refreshing Onboarding Link
          </h1>
          <p className="text-muted-foreground">
            Please wait while we generate a new onboarding link for you...
          </p>
        </div>
      </div>
    </div>
  )
}

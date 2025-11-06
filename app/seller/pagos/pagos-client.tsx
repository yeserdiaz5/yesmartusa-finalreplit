"use client"

import { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"
import type { User } from "@/lib/types/database"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface PagosClientProps {
  user: User
  statsResult: any
  scheduleResult: any
  setupComplete: boolean
}

export default function PagosClient({ user, statsResult, scheduleResult, setupComplete }: PagosClientProps) {
  const [connectingStripe, setConnectingStripe] = useState(false)
  const { t } = useLanguage()

  const stats = statsResult?.data
  const needsOnboarding = statsResult?.needsOnboarding
  const accountId = statsResult?.accountId
  const schedule = scheduleResult?.data

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      // Call API route to create/get account and onboarding link
      const response = await fetch("/api/stripe-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t("stripeSetupError") + ": " + (result.error || t("unknownError")))
        setConnectingStripe(false)
        return
      }

      // Redirect to Stripe to complete onboarding
      window.location.href = result.url
    } catch (error: any) {
      alert(t("error") + ": " + error.message)
      setConnectingStripe(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: stats?.currency || "USD",
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPayoutStatusBadge = (status: string) => {
    const statusMap: Record<string, { labelKey: string; className: string }> = {
      paid: { labelKey: "paidOut", className: "bg-green-100 text-green-800" },
      pending: { labelKey: "pending", className: "bg-yellow-100 text-yellow-800" },
      in_transit: { labelKey: "inTransit", className: "bg-blue-100 text-blue-800" },
      canceled: { labelKey: "cancelled", className: "bg-red-100 text-red-800" },
      failed: { labelKey: "failed", className: "bg-red-100 text-red-800" },
    }
    const config = statusMap[status] || { labelKey: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{t(config.labelKey)}</Badge>
  }

  const getScheduleDescription = () => {
    if (!schedule) return t("notConfigured")

    const { interval, delayDays, weeklyAnchor, monthlyAnchor } = schedule

    if (interval === "manual") {
      return t("manual")
    } else if (interval === "daily") {
      return t("scheduleDaily").replace("{days}", String(delayDays))
    } else if (interval === "weekly") {
      const day = weeklyAnchor || "Monday"
      return t("scheduleWeekly").replace("{day}", day).replace("{days}", String(delayDays))
    } else if (interval === "monthly") {
      const day = monthlyAnchor || 1
      return t("scheduleMonthly").replace("{day}", String(day)).replace("{days}", String(delayDays))
    }

    return t("notConfigured")
  }

  const calculateNextPayoutDays = () => {
    if (!schedule || schedule.interval === "manual") return null

    const { delayDays } = schedule
    return delayDays || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("paymentsAndEarnings")}
              </h1>
              <p className="text-gray-600 mt-2">{t("managePaymentsDescription")}</p>
            </div>
            <Link href="/seller">
              <Button variant="outline" data-testid="button-back-seller">
                {t("backToPanel")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {setupComplete && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t("setupComplete")}
            </AlertDescription>
          </Alert>
        )}

        {/* Onboarding Required Alert */}
        {needsOnboarding && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {t("needsOnboardingMessage")}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <Card data-testid="card-total-earnings">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t("totalEarnings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900" data-testid="text-total-earnings">
                {formatCurrency(stats?.totalEarnings || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("completedSales").replace("{count}", String(stats?.orderCount || 0))}
              </p>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card data-testid="card-available-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t("availableBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="text-available-balance">
                {formatCurrency(stats?.availableBalance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t("readyToTransfer")}</p>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card data-testid="card-pending-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("pendingBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600" data-testid="text-pending-balance">
                {formatCurrency(stats?.pendingBalance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculateNextPayoutDays() !== null
                  ? t("nextPayoutIn").replace("{days}", String(calculateNextPayoutDays()))
                  : t("awaitingProcessing")}
              </p>
            </CardContent>
          </Card>

          {/* Payout Schedule */}
          <Card data-testid="card-payout-schedule">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("payoutSchedule")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900" data-testid="text-payout-schedule">
                {getScheduleDescription()}
              </div>
              {needsOnboarding && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="mt-3 w-full"
                  data-testid="button-setup-stripe"
                >
                  {connectingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("connecting")}...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t("setupStripeAccount")}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stripe Info Card */}
        {needsOnboarding && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="w-5 h-5" />
                {t("howPaymentsWork")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-blue-900">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("step1Title")}</h4>
                  <p className="text-sm text-blue-800">
                    {t("step1Description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("step2Title")}</h4>
                  <p className="text-sm text-blue-800">
                    {t("step2Description").replace("{days}", String(calculateNextPayoutDays() || 7))}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("step3Title")}</h4>
                  <p className="text-sm text-blue-800">
                    {t("step3Description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>{t("transferHistory")}</CardTitle>
            <CardDescription>{t("transferHistoryDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPayouts && stats.recentPayouts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPayouts.map((payout: any) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    data-testid={`payout-${payout.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{payout.description}</div>
                        <div className="text-sm text-gray-600">
                          {t("created")}: {formatDate(payout.createdDate)} • {t("arrivalDate")}: {formatDate(payout.arrivalDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(payout.amount)}</div>
                      {getPayoutStatusBadge(payout.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {needsOnboarding ? t("setupStripeAccountTitle") : t("noTransfers")}
                </h3>
                <p className="text-gray-600">
                  {needsOnboarding
                    ? t("setupStripeAccountDescription")
                    : t("noTransfersInfo")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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

interface PagosClientProps {
  user: User
  statsResult: any
  scheduleResult: any
  setupComplete: boolean
}

export default function PagosClient({ user, statsResult, scheduleResult, setupComplete }: PagosClientProps) {
  const [connectingStripe, setConnectingStripe] = useState(false)

  const stats = statsResult?.data
  const needsOnboarding = statsResult?.needsOnboarding
  const accountId = statsResult?.accountId
  const schedule = scheduleResult?.data

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      // Llamar a la API route para crear/obtener cuenta y link de onboarding
      const response = await fetch("/api/stripe-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert("Error al configurar Stripe: " + (result.error || "Error desconocido"))
        setConnectingStripe(false)
        return
      }

      // Redirigir a Stripe para completar onboarding
      window.location.href = result.url
    } catch (error: any) {
      alert("Error: " + error.message)
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
    const statusMap: Record<string, { label: string; className: string }> = {
      paid: { label: "Pagado", className: "bg-green-100 text-green-800" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      in_transit: { label: "En tránsito", className: "bg-blue-100 text-blue-800" },
      canceled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
      failed: { label: "Fallido", className: "bg-red-100 text-red-800" },
    }
    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getScheduleDescription = () => {
    if (!schedule) return "No configurado"

    const { interval, delayDays, weeklyAnchor, monthlyAnchor } = schedule

    if (interval === "manual") {
      return "Pagos manuales"
    } else if (interval === "daily") {
      return `Diario (con ${delayDays} días de retraso)`
    } else if (interval === "weekly") {
      const day = weeklyAnchor || "lunes"
      return `Semanal (cada ${day}, con ${delayDays} días de retraso)`
    } else if (interval === "monthly") {
      const day = monthlyAnchor || 1
      return `Mensual (día ${day}, con ${delayDays} días de retraso)`
    }

    return "No configurado"
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
                Pagos y Ganancias
              </h1>
              <p className="text-gray-600 mt-2">Administra tus pagos y visualiza tus ganancias de Stripe</p>
            </div>
            <Link href="/seller">
              <Button variant="outline" data-testid="button-back-seller">
                Volver al Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {setupComplete && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Configuración completada! Tu cuenta de Stripe está lista para recibir pagos.
            </AlertDescription>
          </Alert>
        )}

        {/* Onboarding Required Alert */}
        {needsOnboarding && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Para recibir pagos, necesitas completar la configuración de tu cuenta de Stripe. Haz clic en el botón
              &quot;Configurar Cuenta de Stripe&quot; para comenzar.
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
                Ganancias Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900" data-testid="text-total-earnings">
                {formatCurrency(stats?.totalEarnings || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                De {stats?.orderCount || 0} ventas completadas
              </p>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card data-testid="card-available-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Saldo Disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600" data-testid="text-available-balance">
                {formatCurrency(stats?.availableBalance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Listo para transferir</p>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card data-testid="card-pending-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Saldo Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600" data-testid="text-pending-balance">
                {formatCurrency(stats?.pendingBalance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculateNextPayoutDays() !== null
                  ? `Próximo pago en ${calculateNextPayoutDays()} días`
                  : "Esperando procesamiento"}
              </p>
            </CardContent>
          </Card>

          {/* Payout Schedule */}
          <Card data-testid="card-payout-schedule">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendario de Pagos
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
                      Conectando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Configurar Cuenta de Stripe
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
                Cómo Funcionan los Pagos con Stripe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-blue-900">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Los clientes pagan con Stripe</h4>
                  <p className="text-sm text-blue-800">
                    Cuando un cliente compra tus productos, el pago se procesa de forma segura a través de Stripe.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Stripe retiene los fondos temporalmente</h4>
                  <p className="text-sm text-blue-800">
                    Los pagos se mantienen seguros mientras se procesa la transacción (típicamente {calculateNextPayoutDays() || 7} días).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Recibes tus pagos automáticamente</h4>
                  <p className="text-sm text-blue-800">
                    Stripe transfiere tus ganancias directamente a tu cuenta bancaria según el calendario configurado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transferencias de Stripe</CardTitle>
            <CardDescription>Transferencias de Stripe a tu cuenta bancaria</CardDescription>
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
                          Creado: {formatDate(payout.createdDate)} • Llegará: {formatDate(payout.arrivalDate)}
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
                  {needsOnboarding ? "Configura tu cuenta de Stripe" : "No hay transferencias aún"}
                </h3>
                <p className="text-gray-600">
                  {needsOnboarding
                    ? "Una vez configurada tu cuenta, tus transferencias aparecerán aquí"
                    : "Tus transferencias de Stripe aparecerán aquí cuando se procesen"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { DollarSign, TrendingUp, Clock, CreditCard, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"

interface PagosClientProps {
  user: any
  stats: {
    totalEarnings: number
    pendingPayouts: number
    recentPayments: Array<{
      id: string
      amount: number
      date: string
      status: string
      paymentIntentId: string | null
    }>
    orderCount: number
  } | null
}

export default function PagosClient({ user, stats }: PagosClientProps) {
  const [connectingStripe, setConnectingStripe] = useState(false)

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    // This would create a Stripe Connect account and redirect to onboarding
    // For now, we'll just show a message
    alert("La integración con Stripe Connect estará disponible próximamente")
    setConnectingStripe(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pagos y Ganancias
              </h1>
              <p className="text-gray-600 mt-2">Administra tus pagos y visualiza tus ganancias</p>
            </div>
            <Link href="/seller">
              <Button variant="outline">Volver al Panel</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Earnings */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5" />
                Ganancias Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{formatCurrency(stats?.totalEarnings || 0)}</div>
              <p className="text-green-100 text-sm">De {stats?.orderCount || 0} ventas completadas</p>
            </CardContent>
          </Card>

          {/* Pending Payouts */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                Pagos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{formatCurrency(stats?.pendingPayouts || 0)}</div>
              <p className="text-orange-100 text-sm">Próximo pago en 7 días</p>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="w-5 h-5" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">Stripe</div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="mt-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {connectingStripe ? "Conectando..." : "Configurar Cuenta"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <TrendingUp className="w-5 h-5" />
              Cómo Funcionan los Pagos
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
                  Los pagos se mantienen seguros mientras se completa el envío y se confirma la entrega.
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
                  Stripe transfiere tus ganancias directamente a tu cuenta bancaria según el calendario de pagos
                  configurado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Tus ventas y pagos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Pedido #{payment.id.slice(0, 8)}</div>
                        <div className="text-sm text-gray-600">{formatDate(payment.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos aún</h3>
                <p className="text-gray-600">Tus pagos aparecerán aquí cuando completes tus primeras ventas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

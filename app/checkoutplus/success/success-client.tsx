"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Package, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrderById } from "@/app/actions/orders"

interface SuccessClientProps {
  orderId?: string
}

export function SuccessClient({ orderId }: SuccessClientProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    } else {
      setLoading(false)
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return

    const result = await getOrderById(orderId)
    if (result.success && result.data) {
      setOrder(result.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">¡Gracias por su Compra!</CardTitle>
          <p className="text-gray-600">Su pedido ha sido procesado exitosamente</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {order && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Número de Pedido</p>
                <p className="font-mono font-semibold text-lg text-blue-600">{order.id}</p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-gray-900">Detalles del Pedido:</p>
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image_url || "/placeholder.svg?height=50&width=50"}
                          alt={item.product.title}
                          className="w-14 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{item.product.title}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-center">
                  <Package className="inline h-4 w-4 mr-2" />
                  Este es un pedido de prueba. No se ha procesado ningún pago real.
                </p>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Siga Explorando en YesMart USA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

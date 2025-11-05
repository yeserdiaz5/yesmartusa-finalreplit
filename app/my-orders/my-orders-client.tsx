"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import { Package, Truck, ExternalLink } from "lucide-react"
import { getOrderShipments, type Shipment } from "../actions/shipments"
import { useRouter } from "next/navigation"
import { CancelOrderDialog } from "@/components/cancel-order-dialog"

interface MyOrdersClientProps {
  user: User | null
  orders: any[]
}

export default function MyOrdersClient({ user, orders = [] }: MyOrdersClientProps) {
  const [orderShipments, setOrderShipments] = useState<Record<string, Shipment[]>>({})
  const router = useRouter()

  // Agrupar y ordenar órdenes: paid primero, luego shipped, luego cancelled
  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      paid: 1,
      shipped: 2,
      cancelled: 3,
      pending: 4
    }
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
  })

  useEffect(() => {
    const fetchShipments = async () => {
      if (!Array.isArray(orders) || orders.length === 0) {
        return
      }

      const shipmentsMap: Record<string, Shipment[]> = {}

      for (const order of orders) {
        const result = await getOrderShipments(order.id)
        if (result.success && result.data) {
          shipmentsMap[order.id] = result.data
        }
      }

      setOrderShipments(shipmentsMap)
    }

    fetchShipments()
  }, [orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "paid":
        return "Pagado"
      case "shipped":
        return "Enviado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const OrderCard = ({ order }: { order: any }) => {
    const hasShipment = orderShipments[order.id] && orderShipments[order.id].length > 0
    const firstShipment = hasShipment ? orderShipments[order.id][0] : null
    const hasLabel = order.status === "shipped" || (hasShipment && firstShipment?.tracking_number)

    return (
      <Card key={order.id}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold text-lg">Pedido #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600">
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
          </div>

          <div className="space-y-3 mb-4">
            {(order.items || order.order_items)?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <img
                  src={item.product?.image_url || "/placeholder.svg"}
                  alt={item.product?.title || "Product"}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.product?.title}</p>
                  <p className="text-sm text-gray-600">
                    Cantidad: {item.quantity} × ${item.price_at_purchase}
                  </p>
                </div>
                <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex justify-between items-center mb-4">
            <span className="font-medium">Total:</span>
            <span className="text-xl font-bold text-green-600">${order.total_amount?.toFixed(2)}</span>
          </div>

          {hasLabel ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Tu pedido ha sido enviado 📦</h3>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Número de seguimiento:</span>
                  <span className="font-mono text-sm font-medium">
                    {firstShipment?.tracking_number || order.tracking_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transportista:</span>
                  <span className="text-sm font-medium">
                    {(firstShipment?.carrier || order.shipping_carrier || "").toUpperCase()}
                  </span>
                </div>
              </div>

              {firstShipment?.tracking_url && (
                <Button
                  onClick={() => window.open(firstShipment.tracking_url, "_blank")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Rastrear envío
                </Button>
              )}
            </div>
          ) : order.status === "paid" ? (
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/create-shippo-label?order_id=${order.id}`)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid={`button-create-shipping-${order.id}`}
              >
                <Truck className="w-4 h-4 mr-2" />
                Comprar Envío
              </Button>
              <CancelOrderDialog
                orderId={order.id}
                userType="seller"
                onCancelled={() => window.location.reload()}
              />
            </div>
          ) : order.status === "pending" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-900 font-medium">Esperando confirmación de pago</p>
              </div>
            </div>
          ) : null}

          {order.status === "cancelled" && order.cancellation_reason && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-1">Pedido Cancelado</p>
              <p className="text-sm text-red-800">{order.cancellation_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Agrupar órdenes por estado
  const paidOrders = sortedOrders.filter(order => order.status === 'paid')
  const shippedOrders = sortedOrders.filter(order => order.status === 'shipped')
  const cancelledOrders = sortedOrders.filter(order => order.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            <p className="text-sm font-medium">Total de Pedidos</p>
            <p className="text-3xl font-bold">{orders.length}</p>
          </div>
        </div>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">No tienes pedidos todavía</h2>
              <p className="text-gray-600">Tus pedidos aparecerán aquí una vez que realices una compra</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Órdenes Pagadas - Requieren Acción */}
            {paidOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-green-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-green-900">
                    Pedidos Pagados ({paidOrders.length})
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">Estos pedidos necesitan que crees la etiqueta de envío</p>
                <div className="space-y-4">
                  {paidOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* Órdenes Enviadas */}
            {shippedOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    Pedidos Enviados ({shippedOrders.length})
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">Pedidos que ya han sido enviados al cliente</p>
                <div className="space-y-4">
                  {shippedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* Órdenes Canceladas */}
            {cancelledOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-red-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-red-900">
                    Pedidos Cancelados ({cancelledOrders.length})
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">Historial de pedidos cancelados</p>
                <div className="space-y-4">
                  {cancelledOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

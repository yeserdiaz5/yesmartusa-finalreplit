"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import { Package, Truck, ExternalLink, Printer, XCircle, Loader2 } from "lucide-react"
import { getOrderShipments, type Shipment } from "../actions/shipments"
import { cancelOrder } from "../actions/orders"
import { useRouter } from "next/navigation"

interface MyOrdersClientProps {
  user: User | null
  orders: any[]
}

export default function MyOrdersClient({ user, orders = [] }: MyOrdersClientProps) {
  const [orderShipments, setOrderShipments] = useState<Record<string, Shipment[]>>({})
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null,
  })
  const [cancellationReason, setCancellationReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchShipments = async () => {
      if (!Array.isArray(orders) || orders.length === 0) {
        return
      }

      const shipmentsMap: Record<string, Shipment[]> = {}

      for (const order of orders) {
        const result = await getOrderShipments(order.id)
        console.log("[v0] Shipments for order", order.id, ":", result)
        if (result.success && result.data) {
          shipmentsMap[order.id] = result.data
          console.log("[v0] First shipment label_url:", result.data[0]?.label_url)
        }
      }

      setOrderShipments(shipmentsMap)
    }

    fetchShipments()
  }, [orders])

  const handleCancelOrder = async () => {
    if (!cancelDialog.orderId || !cancellationReason) {
      return
    }

    setIsSubmitting(true)
    const result = await cancelOrder(cancelDialog.orderId, cancellationReason)

    if (result.success) {
      setCancelDialog({ open: false, orderId: null })
      setCancellationReason("")
      router.refresh()
    }

    setIsSubmitting(false)
  }

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

  const pendingOrders = orders.filter((order) => order.status === "paid" || order.status === "pending")
  const shippedOrders = orders.filter((order) => order.status === "shipped")
  const cancelledOrders = orders.filter((order) => order.status === "cancelled")

  const OrderCard = ({ order }: { order: any }) => {
    const hasShipment = orderShipments[order.id] && orderShipments[order.id].length > 0
    const firstShipment = hasShipment ? orderShipments[order.id][0] : null
    const hasLabel = order.status === "shipped" || (hasShipment && firstShipment?.tracking_number)
    const canCancel = order.status === "paid" || order.status === "pending"
    const labelUrl = firstShipment?.label_url || order.label_url

    console.log("[v0] OrderCard for order", order.id, ":", {
      hasShipment,
      hasLabel,
      labelUrl,
      firstShipment_label_url: firstShipment?.label_url,
      order_label_url: order.label_url,
      order_status: order.status,
    })

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
            {order.order_items?.map((item: any) => (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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

              <div className="flex gap-2">
                {firstShipment?.tracking_url && (
                  <Button
                    onClick={() => window.open(firstShipment.tracking_url, "_blank")}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Rastrear envío
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (labelUrl) {
                      window.open(labelUrl, "_blank")
                    } else {
                      alert("La etiqueta de envío no está disponible. Por favor, contacta al vendedor.")
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={!labelUrl}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Reimprimir Etiqueta
                </Button>
              </div>
            </div>
          ) : order.status === "paid" ? (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <p className="text-orange-900 font-medium">Tu pedido está siendo preparado para envío 🚚</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/create-shippo-label?order_id=${order.id}`)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Comprar Envío
                </Button>
                {canCancel && (
                  <Button
                    onClick={() => setCancelDialog({ open: true, orderId: order.id })}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Pedido
                  </Button>
                )}
              </div>
            </div>
          ) : order.status === "pending" ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-900 font-medium">Esperando confirmación de pago</p>
                </div>
              </div>
              {canCancel && (
                <Button
                  onClick={() => setCancelDialog({ open: true, orderId: order.id })}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Pedido
                </Button>
              )}
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

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            <p className="text-sm font-medium">Total de Pedidos</p>
            <p className="text-3xl font-bold">{orders.length}</p>
          </div>
        </div>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <EmptyState message="No tienes pedidos todavía. Tus pedidos aparecerán aquí una vez que realices una compra" />
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pendientes a Envío ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Enviados ({shippedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cancelados ({cancelledOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingOrders.length === 0 ? (
                <EmptyState message="No tienes pedidos pendientes de envío" />
              ) : (
                pendingOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>

            <TabsContent value="shipped" className="space-y-4">
              {shippedOrders.length === 0 ? (
                <EmptyState message="No tienes pedidos enviados" />
              ) : (
                shippedOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledOrders.length === 0 ? (
                <EmptyState message="No tienes pedidos cancelados" />
              ) : (
                cancelledOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Por favor, indica el motivo de la cancelación. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de cancelación</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Cambié de opinión, encontré un mejor precio, etc."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, orderId: null })}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isSubmitting || !cancellationReason.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

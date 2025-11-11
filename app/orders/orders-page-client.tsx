"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import { Package, Truck, Download, RefreshCw, MapPin, XCircle, ExternalLink, FileText } from "lucide-react"
import { shipOrder, cancelOrder, syncOrderStatus } from "../actions/orders"
import { getOrderShipments, type Shipment } from "../actions/shipments"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrdersPageClientProps {
  user: User | null
  orders: any[]
}

export default function OrdersPageClient({ user, orders = [] }: OrdersPageClientProps) {
  console.log("[v0] OrdersPageClient - Received orders:", {
    ordersType: typeof orders,
    isArray: Array.isArray(orders),
    length: orders?.length,
    orders: orders,
  })

  const router = useRouter()
  const [shippingDialog, setShippingDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null,
  })
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null,
  })
  const [shippingCarrier, setShippingCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [cancellationReason, setCancellationReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderShipments, setOrderShipments] = useState<Record<string, Shipment[]>>({})

  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const [syncingOrders, setSyncingOrders] = useState<Set<string>>(new Set())
  const [updatingTracking, setUpdatingTracking] = useState<Set<string>>(new Set())
  const [voidingLabels, setVoidingLabels] = useState<Set<string>>(new Set())

  const shippedOrders = orders.filter((order) => order.status === "shipped")
  const pendingShipmentOrders = orders.filter((order) => order.status === "paid")
  const pendingPaymentOrders = orders.filter((order) => order.status === "pending")

  const totalOrders = orders.length

  useEffect(() => {
    const fetchShipments = async () => {
      if (!Array.isArray(orders) || orders.length === 0) {
        console.log("[v0] OrdersPageClient - No orders to fetch shipments for")
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

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "returned":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getShipmentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_transit":
        return "En Tránsito"
      case "delivered":
        return "Entregado"
      case "failed":
        return "Fallido"
      case "returned":
        return "Devuelto"
      default:
        return status
    }
  }

  const handleSyncStatus = async (orderId: string) => {
    setSyncingOrders((prev) => new Set(prev).add(orderId))

    const result = await syncOrderStatus(orderId)

    setSyncingOrders((prev) => {
      const newSet = new Set(prev)
      newSet.delete(orderId)
      return newSet
    })

    if (result.success) {
      toast.success(result.message || "Estado sincronizado correctamente")
      router.refresh()
    } else {
      toast.error(result.error || "Error al sincronizar estado")
    }
  }

  const handleShipOrder = async () => {
    if (!shippingDialog.orderId || !shippingCarrier || !trackingNumber) {
      return
    }

    setIsSubmitting(true)
    const result = await shipOrder(shippingDialog.orderId, shippingCarrier, trackingNumber)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("El pedido ha sido marcado como enviado")
      setShippingDialog({ open: false, orderId: null })
      setShippingCarrier("")
      setTrackingNumber("")
    } else {
      toast.error("Error al marcar el pedido como enviado")
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelDialog.orderId || !cancellationReason) {
      return
    }

    setIsSubmitting(true)
    const result = await cancelOrder(cancelDialog.orderId, cancellationReason)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("El pedido ha sido cancelado")
      setCancelDialog({ open: false, orderId: null })
      setCancellationReason("")
    } else {
      toast.error("Error al cancelar el pedido")
    }
  }

  const handleUpdateTracking = async (shipmentId: string) => {
    setUpdatingTracking((prev) => new Set(prev).add(shipmentId))

    const { updateTrackingStatus } = await import("../actions/shipengine")
    const result = await updateTrackingStatus(shipmentId)

    setUpdatingTracking((prev) => {
      const newSet = new Set(prev)
      newSet.delete(shipmentId)
      return newSet
    })

    if (result.success) {
      toast.success("Estado de rastreo actualizado")
      router.refresh()
    } else {
      toast.error(result.error || "Error al actualizar el rastreo")
    }
  }

  const handleVoidLabel = async (labelId: string, orderId: string, trackingNumber: string) => {
    if (
      !confirm(
        `⚠️ ADVERTENCIA: Esto anulará la etiqueta de envío ${trackingNumber}.\n\nSi la etiqueta no ha sido usada y está dentro del período permitido por el transportista (generalmente 24 horas), recibirás un reembolso.\n\n¿Continuar?`,
      )
    ) {
      return
    }

    setVoidingLabels((prev) => new Set(prev).add(labelId))

    const { voidLabel } = await import("../actions/shipengine")
    const result = await voidLabel(labelId, orderId)

    setVoidingLabels((prev) => {
      const newSet = new Set(prev)
      newSet.delete(labelId)
      return newSet
    })

    if (result.success) {
      toast.success(result.message || "Etiqueta anulada correctamente")
      router.refresh()
    } else {
      toast.error(result.error || "Error al anular etiqueta")
    }
  }

  const handleBuyShipping = async (order: any) => {
    setLoadingOrders((prev) => new Set(prev).add(order.id))

    try {
      if (!user?.seller_address) {
        toast.error("Por favor configura tu dirección de envío en Configuración del Vendedor")
        setLoadingOrders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(order.id)
          return newSet
        })
        return
      }

      router.push(`/createlabel1?orderId=${order.id}`)
    } catch (error) {
      console.error("[v0] Error buying shipping:", error)
      toast.error("Error al procesar el envío")
    } finally {
      setLoadingOrders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(order.id)
        return newSet
      })
    }
  }

  const OrderCard = ({ order }: { order: any }) => {
    const hasShipment = orderShipments[order.id] && orderShipments[order.id].length > 0
    const isSyncing = syncingOrders.has(order.id)
    const hasLabel = hasShipment && orderShipments[order.id].some((s) => s.label_url)
    const firstShipment = hasShipment ? orderShipments[order.id][0] : null

    return (
      <Card key={order.id}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold">Pedido #{order.id.slice(0, 8)}</p>
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

          <div className="bg-gray-50 rounded p-3 mb-3">
            <p className="text-sm font-medium mb-1">Cliente:</p>
            {order.shipping_address && (
              <>
                <p className="text-sm">{order.shipping_address.full_name}</p>
                <p className="text-sm text-gray-600">{order.buyer_email || "Email no disponible"}</p>
                <p className="text-sm mt-2">
                  {order.shipping_address.address_line1}
                  {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                </p>
                <p className="text-sm">
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p className="text-sm">{order.shipping_address.country}</p>
                <p className="text-sm text-gray-600">Tel: {order.shipping_address.phone}</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Productos:</p>
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded">
                <img
                  src={item.product.image_url || "/placeholder.svg"}
                  alt={item.product.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.product.title}</p>
                  <p className="text-xs text-gray-600">
                    Cantidad: {item.quantity} × ${item.price_at_purchase}
                  </p>
                </div>
                <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-medium">Total del Pedido:</span>
            <span className="text-lg font-bold text-green-600">
              $
              {order.items
                .reduce((sum: number, item: any) => sum + item.price_at_purchase * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>

          {hasLabel && firstShipment ? (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Envío</h3>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Número de seguimiento:</span>
                  <span className="font-mono text-sm font-medium">{firstShipment.tracking_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transportista:</span>
                  <span className="text-sm font-medium">{firstShipment.carrier.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (firstShipment.label_url) {
                      window.open(firstShipment.label_url, "_blank")
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver etiqueta de envío
                </Button>
                {firstShipment.tracking_url && (
                  <Button
                    onClick={() => {
                      if (firstShipment.tracking_url) {
                        window.open(firstShipment.tracking_url, "_blank")
                      }
                    }}
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver seguimiento
                  </Button>
                )}
              </div>
            </div>
          ) : (
            order.status === "paid" && (
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/create-shippo-label?order_id=${order.id}`)}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Crear etiqueta de envío
                </Button>
              </div>
            )
          )}

          {order.status === "paid" && (
            <div className="mt-4 flex gap-2">
              {!hasShipment ? (
                <Button
                  onClick={() => handleBuyShipping(order)}
                  disabled={loadingOrders.has(order.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {loadingOrders.has(order.id) ? "Creando envío..." : "Comprar Envío"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleSyncStatus(order.id)}
                  disabled={isSyncing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Sincronizando..." : "Sincronizar Estado"}
                </Button>
              )}
              <Button
                onClick={() => setShippingDialog({ open: true, orderId: order.id })}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Marcar como Enviado
              </Button>
              <Button
                onClick={() => setCancelDialog({ open: true, orderId: order.id })}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancelar Pedido
              </Button>
            </div>
          )}

          {orderShipments[order.id] && orderShipments[order.id].length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Envíos:</p>
              </div>
              {orderShipments[order.id].map((shipment) => {
                const isUpdating = updatingTracking.has(shipment.id)
                const isVoiding = voidingLabels.has((shipment as any).label_id)
                const canVoid = shipment.status !== "voided" && shipment.status !== "delivered"

                return (
                  <div key={shipment.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-blue-900">{shipment.carrier.toUpperCase()}</p>
                          <Badge className={getShipmentStatusColor(shipment.status)}>
                            {getShipmentStatusLabel(shipment.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <MapPin className="w-3 h-3" />
                          <span className="font-mono">{shipment.tracking_number}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTracking(shipment.id)}
                        disabled={isUpdating}
                        className="bg-white hover:bg-blue-50 border-blue-300"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isUpdating ? "animate-spin" : ""}`} />
                        {isUpdating ? "Actualizando..." : "Actualizar"}
                      </Button>
                    </div>

                    <div className="text-xs text-blue-700 space-y-1 bg-white rounded p-2">
                      {shipment.shipped_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Enviado:</span>
                          <span className="font-medium">
                            {new Date(shipment.shipped_at).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      )}
                      {shipment.estimated_delivery && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entrega estimada:</span>
                          <span className="font-medium">
                            {new Date(shipment.estimated_delivery).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      )}
                      {shipment.delivered_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entregado:</span>
                          <span className="font-medium text-green-600">
                            {new Date(shipment.delivered_at).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      )}
                    </div>

                    {shipment.notes && (
                      <p className="mt-2 text-xs italic text-blue-600 bg-white rounded p-2">{shipment.notes}</p>
                    )}

                    {(shipment as any).label_url && (
                      <Button
                        size="sm"
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          console.log("[v0] Downloading label from URL:", (shipment as any).label_url)
                          const link = document.createElement("a")
                          link.href = (shipment as any).label_url
                          link.download = `etiqueta-${shipment.tracking_number}.pdf`
                          link.target = "_blank"
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          toast.success("Descargando etiqueta...")
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Reimprimir Etiqueta
                      </Button>
                    )}

                    {canVoid && (shipment as any).label_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleVoidLabel((shipment as any).label_id, order.id, shipment.tracking_number)}
                        disabled={isVoiding}
                      >
                        <XCircle className={`w-4 h-4 mr-2 ${isVoiding ? "animate-spin" : ""}`} />
                        {isVoiding ? "Anulando..." : "Anular Etiqueta"}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {order.status === "cancelled" && order.cancellation_reason && (
            <div className="mt-4 bg-red-50 rounded p-3">
              <p className="text-sm font-medium text-red-900 mb-1">Razón de Cancelación:</p>
              <p className="text-sm text-red-800">{order.cancellation_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            <p className="text-sm font-medium">Total de Pedidos</p>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </div>
        </div>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">No hay pedidos todavía</h2>
              <p className="text-gray-600">Los pedidos de tus productos aparecerán aquí</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending-shipment" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending-shipment" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pendientes a Envío
                {pendingShipmentOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingShipmentOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Enviados
                {shippedOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {shippedOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending-payment" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pendientes de Pago
                {pendingPaymentOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingPaymentOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending-shipment" className="space-y-4">
              {pendingShipmentOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold mb-2">No hay pedidos pendientes a envío</h2>
                    <p className="text-gray-600">Los pedidos pagados que necesitan ser enviados aparecerán aquí</p>
                  </CardContent>
                </Card>
              ) : (
                pendingShipmentOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>

            <TabsContent value="shipped" className="space-y-4">
              {shippedOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold mb-2">No hay pedidos enviados</h2>
                    <p className="text-gray-600">Los pedidos que ya han sido enviados aparecerán aquí</p>
                  </CardContent>
                </Card>
              ) : (
                shippedOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>

            <TabsContent value="pending-payment" className="space-y-4">
              {pendingPaymentOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold mb-2">No hay pedidos pendientes de pago</h2>
                    <p className="text-gray-600">Los pedidos con pagos fallidos o pendientes aparecerán aquí</p>
                  </CardContent>
                </Card>
              ) : (
                pendingPaymentOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={shippingDialog.open} onOpenChange={(open) => setShippingDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Enviado</DialogTitle>
            <DialogDescription>Ingresa la información de envío para este pedido</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Transportista</Label>
              <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                <SelectTrigger id="carrier">
                  <SelectValue placeholder="Selecciona un transportista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="Amazon Logistics">Amazon Logistics</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Número de Rastreo</Label>
              <Input
                id="tracking"
                placeholder="Ingresa el número de rastreo"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialog({ open: false, orderId: null })}>
              Cancelar
            </Button>
            <Button onClick={handleShipOrder} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Marcar como Enviado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>Selecciona la razón de cancelación</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={cancellationReason} onValueChange={setCancellationReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sin stock" id="outstock" />
                <Label htmlFor="outstock">Sin stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cliente canceló" id="customer" />
                <Label htmlFor="customer">Cliente canceló</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Problema con el pago" id="payment" />
                <Label htmlFor="payment">Problema con el pago</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Dirección incorrecta" id="address" />
                <Label htmlFor="address">Dirección incorrecta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pedido duplicado" id="duplicate" />
                <Label htmlFor="duplicate">Pedido duplicado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Otro" id="other" />
                <Label htmlFor="other">Otro</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, orderId: null })}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={isSubmitting}>
              {isSubmitting ? "Cancelando..." : "Cancelar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

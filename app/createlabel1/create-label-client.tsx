"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import SiteHeader from "@/components/site-header"
import { Package, Truck, DollarSign, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getRatesForOrder } from "@/app/actions/shipengine-rates"
import { purchaseLabelForOrder } from "@/app/actions/shipengine"

interface CreateLabelClientProps {
  order: any
  seller: any
  user: any
}

export default function CreateLabelClient({ order, seller, user }: CreateLabelClientProps) {
  const router = useRouter()
  const [length, setLength] = useState("12")
  const [width, setWidth] = useState("9")
  const [height, setHeight] = useState("6")
  const [weight, setWeight] = useState("16")
  const [rates, setRates] = useState<any[]>([])
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [purchasingLabel, setPurchasingLabel] = useState(false)

  const handleGetRates = async () => {
    if (!length || !width || !height || !weight) {
      toast.error("Por favor ingresa todas las dimensiones y peso del paquete")
      return
    }

    setLoadingRates(true)
    setRates([])
    setSelectedRate(null)

    try {
      const result = await getRatesForOrder(
        order.id,
        Number.parseFloat(length),
        Number.parseFloat(width),
        Number.parseFloat(height),
        Number.parseFloat(weight),
        order.shipping_address,
        seller.seller_address,
        seller.seller_address?.full_name || seller.full_name,
        seller.phone || seller.seller_address?.phone,
      )

      if (result.success && result.rates) {
        setRates(result.rates)
        toast.success(`Se encontraron ${result.rates.length} opciones de envío`)
      } else {
        toast.error(result.error || "Error al obtener tarifas")
      }
    } catch (error) {
      console.error("[v0] Error getting rates:", error)
      toast.error("Error al obtener tarifas de envío")
    } finally {
      setLoadingRates(false)
    }
  }

  const handlePurchaseLabel = async () => {
    if (!selectedRate) {
      toast.error("Por favor selecciona una opción de envío")
      return
    }

    setPurchasingLabel(true)

    try {
      const result = await purchaseLabelForOrder(
        order.id,
        selectedRate.rate_id,
        selectedRate.service_code,
        Number.parseFloat(length),
        Number.parseFloat(width),
        Number.parseFloat(height),
        Number.parseFloat(weight),
      )

      if (result.success) {
        toast.success("¡Etiqueta comprada exitosamente!")

        // Download the label PDF
        if (result.label_url) {
          const link = document.createElement("a")
          link.href = result.label_url
          link.download = `etiqueta-${result.tracking_number}.pdf`
          link.target = "_blank"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }

        // Redirect to orders page after a short delay
        setTimeout(() => {
          router.push("/orders")
        }, 2000)
      } else {
        toast.error(result.error || "Error al comprar etiqueta")
      }
    } catch (error) {
      console.error("[v0] Error purchasing label:", error)
      toast.error("Error al comprar etiqueta de envío")
    } finally {
      setPurchasingLabel(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} showSearch={false} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Crear Etiqueta de Envío</h1>
          <p className="text-gray-600">Pedido #{order.id.slice(0, 8)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Package Info & Rates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Dimensiones del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="length">Largo (in)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Ancho (in)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Alto (in)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso (oz)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="16"
                    />
                  </div>
                </div>

                <Button onClick={handleGetRates} disabled={loadingRates} className="w-full" size="lg">
                  {loadingRates ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Obteniendo Tarifas...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Obtener Tarifas de Envío
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Shipping Rates */}
            {rates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Opciones de Envío ({rates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rates.map((rate) => (
                    <div
                      key={rate.rate_id}
                      onClick={() => setSelectedRate(rate)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRate?.rate_id === rate.rate_id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-lg">{rate.carrier_friendly_name}</p>
                            {selectedRate?.rate_id === rate.rate_id && (
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{rate.service_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${Number.parseFloat(rate.shipping_amount?.amount || "0").toFixed(2)}
                          </p>
                          {rate.other_amount?.amount && Number.parseFloat(rate.other_amount.amount) > 0 && (
                            <p className="text-xs text-gray-500">
                              + ${Number.parseFloat(rate.other_amount.amount).toFixed(2)} otros cargos
                            </p>
                          )}
                        </div>
                      </div>

                      {rate.delivery_days && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Entrega estimada: {rate.delivery_days} día{rate.delivery_days > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {rate.estimated_delivery_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Fecha estimada: {new Date(rate.estimated_delivery_date).toLocaleDateString("es-ES")}
                        </p>
                      )}

                      {rate.trackable && (
                        <Badge variant="secondary" className="mt-2">
                          Rastreable
                        </Badge>
                      )}
                    </div>
                  ))}

                  {selectedRate && (
                    <Button
                      onClick={handlePurchaseLabel}
                      disabled={purchasingLabel}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {purchasingLabel ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Comprando Etiqueta...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Comprar Etiqueta - $
                          {Number.parseFloat(selectedRate.shipping_amount?.amount || "0").toFixed(2)}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p className="text-gray-600">Tel: {order.shipping_address.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">{item.product.title}</p>
                        <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                        <p className="text-sm font-semibold">${item.price_at_purchase}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      $
                      {order.items
                        .reduce((sum: number, item: any) => sum + item.price_at_purchase * item.quantity, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

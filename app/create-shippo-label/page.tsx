"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, ExternalLink, CheckCircle2, MapPin, User, Box, Printer, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  products: {
    id: string
    title: string
    image_url: string
  }
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  shipping_street: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  shipping_phone: string
  total_amount: number
  tracking_number?: string
  shipping_carrier?: string
  order_items: OrderItem[]
}

interface Shipment {
  tracking_number: string
  carrier: string
  label_url: string
  tracking_url: string
  status: string
}

interface ShippingRate {
  object_id: string
  provider: string
  servicelevel: {
    name: string
    token: string
  }
  amount: string
  currency: string
  estimated_days: number
}

export default function CreateShippoLabelPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")

  const [loading, setLoading] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [existingShipment, setExistingShipment] = useState<Shipment | null>(null)
  const [sellerAddress, setSellerAddress] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [packageDimensions, setPackageDimensions] = useState({
    length: "12",
    width: "10",
    height: "8",
    weight: "1.0",
  })
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()

    if (!orderId) {
      setError("No order ID provided")
      setLoadingOrder(false)
      return
    }

    const loadOrderData = async () => {
      setLoadingOrder(true)
      setError("")

      try {
        const supabase = createClient()

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(
              *,
              products(id, title, image_url)
            )
          `)
          .eq("id", orderId)
          .single()

        if (orderError) throw orderError
        if (!orderData) throw new Error("Order not found")

        console.log("[v0] Order data loaded:", orderData)

        let shippingAddress = orderData.shipping_address
        if (typeof shippingAddress === "string") {
          try {
            shippingAddress = JSON.parse(shippingAddress)
          } catch (e) {
            console.error("[v0] Error parsing shipping_address:", e)
            shippingAddress = null
          }
        }

        console.log("[v0] Parsed shipping_address:", shippingAddress)

        const processedOrder = {
          ...orderData,
          customer_name: shippingAddress?.full_name || orderData.customer_name || "",
          customer_email: orderData.buyer_email || orderData.customer_email || "",
          shipping_street: shippingAddress?.address_line1 || orderData.shipping_street || "",
          shipping_city: shippingAddress?.city || orderData.shipping_city || "",
          shipping_state: shippingAddress?.state || orderData.shipping_state || "",
          shipping_zip: shippingAddress?.postal_code || orderData.shipping_zip || "",
          shipping_country: shippingAddress?.country || orderData.shipping_country || "US",
          shipping_phone: shippingAddress?.phone || "",
        }

        console.log("[v0] Processed order with shipping data:", processedOrder)

        setOrder(processedOrder as Order)

        const { data: shipmentData } = await supabase
          .from("shipments")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle()

        if (shipmentData) {
          setExistingShipment(shipmentData as Shipment)
        }

        if (orderData.order_items && orderData.order_items.length > 0) {
          const sellerId = orderData.order_items[0].seller_id

          const { data: seller } = await supabase.from("users").select("*").eq("id", sellerId).single()

          if (seller) {
            let sellerAddressData = seller.seller_address
            if (typeof sellerAddressData === "string") {
              try {
                sellerAddressData = JSON.parse(sellerAddressData)
              } catch (e) {
                console.error("[v0] Error parsing seller_address:", e)
                sellerAddressData = {}
              }
            }

            setSellerAddress({
              name: seller.full_name || seller.store_name || "Seller",
              email: seller.email,
              phone: seller.phone,
              street1: sellerAddressData?.street1 || sellerAddressData?.address_line1 || "",
              city: sellerAddressData?.city || "",
              state: sellerAddressData?.state || "",
              zip: sellerAddressData?.zip || sellerAddressData?.postal_code || "",
              country: sellerAddressData?.country || "US",
            })
          }
        }

        const totalItems = processedOrder.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        const calculatedWeight = Math.max(1, totalItems * 0.5)
        setPackageDimensions((prev) => ({
          ...prev,
          weight: calculatedWeight.toFixed(1),
        }))
      } catch (err) {
        console.error("[v0] Error loading order data:", err)
        setError(err instanceof Error ? err.message : "Error loading order data")
      } finally {
        setLoadingOrder(false)
      }
    }

    loadOrderData()
  }, [orderId])

  const handleGetRates = async () => {
    if (!order || !sellerAddress) return

    setLoadingRates(true)
    setError("")
    setShippingRates([])
    setSelectedRate(null)

    try {
      const response = await fetch("/api/get-shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_address: {
            name: order.customer_name,
            street1: order.shipping_street,
            city: order.shipping_city,
            state: order.shipping_state,
            zip: order.shipping_zip,
            country: order.shipping_country || "US",
            phone: order.shipping_phone,
            email: order.customer_email,
          },
          from_address: {
            name: sellerAddress.name,
            street1: sellerAddress.street1,
            city: sellerAddress.city,
            state: sellerAddress.state,
            zip: sellerAddress.zip,
            country: sellerAddress.country || "US",
            phone: sellerAddress.phone,
            email: sellerAddress.email,
          },
          parcel: {
            length: packageDimensions.length,
            width: packageDimensions.width,
            height: packageDimensions.height,
            weight: packageDimensions.weight,
            distance_unit: "in",
            mass_unit: "lb",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo tarifas de envío")
      }

      console.log("[v0] Shipping rates received:", data.rates)
      setShippingRates(data.rates || [])
    } catch (err) {
      console.error("[v0] Error fetching rates:", err)
      setError(err instanceof Error ? err.message : "Error obteniendo tarifas de envío")
    } finally {
      setLoadingRates(false)
    }
  }

  const handleCreateLabel = async () => {
    if (!order || !sellerAddress || !selectedRate) return

    setLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rate_id: selectedRate.object_id,
          order_id: orderId,
          to_address: {
            name: order.customer_name,
            street1: order.shipping_street,
            city: order.shipping_city,
            state: order.shipping_state,
            zip: order.shipping_zip,
            country: order.shipping_country || "US",
            phone: order.shipping_phone,
            email: order.customer_email,
          },
          from_address: {
            name: sellerAddress.name,
            street1: sellerAddress.street1,
            city: sellerAddress.city,
            state: sellerAddress.state,
            zip: sellerAddress.zip,
            country: sellerAddress.country || "US",
            phone: sellerAddress.phone,
            email: sellerAddress.email,
          },
          parcel: {
            length: packageDimensions.length,
            width: packageDimensions.width,
            height: packageDimensions.height,
            weight: packageDimensions.weight,
            distance_unit: "in",
            mass_unit: "lb",
          },
          seller_email: sellerAddress.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error creando la etiqueta")
      }

      console.log("[v0] Label created successfully:", data)

      const supabase = createClient()

      await supabase
        .from("orders")
        .update({
          tracking_number: data.data.tracking_number,
          shipping_carrier: data.data.provider || selectedRate.provider,
          status: "shipped",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      const { data: shipmentData } = await supabase
        .from("shipments")
        .insert({
          order_id: orderId,
          tracking_number: data.data.tracking_number,
          carrier: data.data.provider || selectedRate.provider,
          status: "label_created",
          label_url: data.data.label_url,
          tracking_url: data.data.tracking_url_provider,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (shipmentData) {
        setExistingShipment(shipmentData as Shipment)
      }

      setSuccessMessage("Etiqueta creada y guardada correctamente en el pedido")

      if (data.data.label_url) {
        window.open(data.data.label_url, "_blank")
      }
    } catch (err) {
      console.error("[v0] Error creating label:", err)
      setError(err instanceof Error ? err.message : "Error creando la etiqueta")
    } finally {
      setLoading(false)
    }
  }

  if (loadingOrder) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Cargando datos del pedido...</span>
          </div>
        </div>
      </>
    )
  }

  if (error && !order) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <Alert variant="destructive">
            <AlertDescription>No se encontró el pedido</AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader user={user} />
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Crear Etiqueta de Envío
          </h1>
          <p className="text-muted-foreground mt-2">Pedido #{order.id.slice(0, 8)}</p>
        </div>

        {existingShipment && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Etiqueta Ya Creada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Seguimiento:</p>
                <p className="text-lg font-mono">{existingShipment.tracking_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transportista:</p>
                <p className="text-lg">{existingShipment.carrier}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => window.open(existingShipment.tracking_url, "_blank")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Rastrear Envío
                </Button>
                <Button
                  onClick={() => window.open(existingShipment.label_url, "_blank")}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Printer className="h-4 w-4" />
                  Reimprimir Etiqueta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Artículos del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.products.image_url && (
                    <img
                      src={item.products.image_url || "/placeholder.svg"}
                      alt={item.products.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.products.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.quantity} × ${item.price_at_purchase.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 text-lg font-bold">
                <span>Total:</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Remitente (Vendedor)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sellerAddress ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre:</p>
                    <p className="font-medium">{sellerAddress.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección:</p>
                    <p className="font-medium">{sellerAddress.street1}</p>
                    <p className="font-medium">
                      {sellerAddress.city}, {sellerAddress.state} {sellerAddress.zip}
                    </p>
                    <p className="font-medium">{sellerAddress.country || "US"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto:</p>
                    <p className="text-sm">{sellerAddress.email}</p>
                    <p className="text-sm">{sellerAddress.phone || "No disponible"}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No se encontró dirección del vendedor</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Destinatario (Comprador)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nombre:</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dirección:</p>
                <p className="font-medium">{order.shipping_street}</p>
                <p className="font-medium">
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                </p>
                <p className="font-medium">{order.shipping_country || "US"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm">{order.customer_email}</p>
              </div>
              {order.shipping_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono:</p>
                  <p className="text-sm">{order.shipping_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Información del Paquete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="length">Largo (in)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={packageDimensions.length}
                  onChange={(e) => setPackageDimensions((prev) => ({ ...prev, length: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="width">Ancho (in)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={packageDimensions.width}
                  onChange={(e) => setPackageDimensions((prev) => ({ ...prev, width: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="height">Alto (in)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={packageDimensions.height}
                  onChange={(e) => setPackageDimensions((prev) => ({ ...prev, height: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (lb)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={packageDimensions.weight}
                  onChange={(e) => setPackageDimensions((prev) => ({ ...prev, weight: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Dimensiones calculadas automáticamente. Puedes editarlas según el paquete real.
            </p>

            {!existingShipment && shippingRates.length === 0 && (
              <Button
                onClick={handleGetRates}
                disabled={loadingRates || !sellerAddress}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
              >
                {loadingRates ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obteniendo Tarifas...
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    Ver Opciones de Envío
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {shippingRates.length > 0 && !existingShipment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Selecciona un Transportista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shippingRates.map((rate) => (
                  <div
                    key={rate.object_id}
                    onClick={() => setSelectedRate(rate)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRate?.object_id === rate.object_id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-lg">{rate.provider}</p>
                        <p className="text-sm text-muted-foreground">{rate.servicelevel.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega estimada: {rate.estimated_days} {rate.estimated_days === 1 ? "día" : "días"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${Number.parseFloat(rate.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{rate.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button onClick={() => router.back()} variant="outline" className="flex-1">
            Volver
          </Button>
          {!existingShipment && selectedRate && (
            <Button
              onClick={handleCreateLabel}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando Etiqueta...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-5 w-5" />
                  Crear Etiqueta de Envío
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Minus, Plus, Trash2, CreditCard, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getCart, updateCartItemQuantity, removeFromCart } from "@/app/actions/cart"
import { createTestOrder, createGuestOrder } from "@/app/actions/orders"
import { SiteHeader } from "@/components/site-header"
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart, clearGuestCart } from "@/lib/guest-cart"
import { createStripeCheckoutSession } from "@/app/actions/stripe"

interface CheckoutClientProps {
  initialUser: any
}

export function CheckoutClient({ initialUser }: CheckoutClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  // Form state
  const [customerName, setCustomerName] = useState(initialUser?.full_name || "")
  const [customerEmail, setCustomerEmail] = useState(initialUser?.email || "")
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [country, setCountry] = useState("US")

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    setLoading(true)

    if (initialUser) {
      // Authenticated user - load from database
      const result = await getCart()
      if (result.success && result.data) {
        setCartItems(result.data)
      }
      setIsGuest(false)
    } else {
      // Guest user - load from localStorage
      const guestCart = getGuestCart()
      setCartItems(guestCart)
      setIsGuest(true)
    }

    setLoading(false)
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    if (isGuest) {
      updateGuestCartQuantity(itemId, newQuantity)
      await loadCart()
    } else {
      // Update authenticated user cart in database
      const result = await updateCartItemQuantity(itemId, newQuantity)
      if (result.success) {
        await loadCart()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar la cantidad",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (isGuest) {
      removeFromGuestCart(itemId)
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del carrito",
      })
      await loadCart()
    } else {
      // Remove from authenticated user cart
      const result = await removeFromCart(itemId)
      if (result.success) {
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado del carrito",
        })
        await loadCart()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el producto",
          variant: "destructive",
        })
      }
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = isGuest ? item.product.price : item.product.price
      const quantity = item.quantity
      return sum + price * quantity
    }, 0)
  }

  const handleTestOrder = async () => {
    console.log("[v0] handleTestOrder - Starting")

    // Validate form
    if (!customerName || !customerEmail || !phone || !street || !city || !state || !zip) {
      console.log("[v0] handleTestOrder - Validation failed")
      toast({
        title: "Datos de envío incompletos",
        description: "Por favor llena tus datos de envío para continuar",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] handleTestOrder - Form validated, creating order")
    setProcessing(true)

    try {
      let result

      if (isGuest) {
        const orderItems = cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
          seller_id: item.product.seller_id,
        }))

        result = await createGuestOrder(orderItems, {
          customerName,
          customerEmail,
          phone,
          street,
          city,
          state,
          zip,
          country,
        })

        if (result.success) {
          clearGuestCart()
        }
      } else {
        // Create authenticated user order
        result = await createTestOrder({
          customerName,
          customerEmail,
          phone,
          street,
          city,
          state,
          zip,
          country,
        })
      }

      console.log("[v0] handleTestOrder - Result:", result)

      if (result.success) {
        console.log("[v0] handleTestOrder - Success, order ID:", result.orderId)
        setCartItems([])
        toast({
          title: "¡Pedido creado!",
          description: "Tu pedido ha sido procesado exitosamente",
        })
        router.push(`/checkoutplus/success?order_id=${result.orderId}`)
      } else {
        console.log("[v0] handleTestOrder - Error:", result.error)
        toast({
          title: "Error al crear pedido",
          description: result.error || "No se pudo crear el pedido. Por favor intenta de nuevo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] handleTestOrder - Exception:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al procesar tu pedido. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleStripeCheckout = async () => {
    console.log("[v0] handleStripeCheckout - Starting")

    // Validate form
    if (!customerName || !customerEmail || !phone || !street || !city || !state || !zip) {
      console.log("[v0] handleStripeCheckout - Validation failed")
      toast({
        title: "Datos de envío incompletos",
        description: "Por favor llena tus datos de envío para continuar",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] handleStripeCheckout - Form validated, creating Stripe session")
    setProcessing(true)

    try {
      const result = await createStripeCheckoutSession(
        {
          customerName,
          customerEmail,
          phone,
          street,
          city,
          state,
          zip,
          country,
        },
        isGuest,
      )

      console.log("[v0] handleStripeCheckout - Stripe session created:", result)

      if (result.url) {
        if (isGuest) {
          clearGuestCart()
        }
        setCartItems([])

        window.location.href = result.url
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear la sesión de pago",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[v0] handleStripeCheckout - Exception:", error)
      toast({
        title: "Error al procesar pago",
        description: error.message || "No se pudo procesar el pago. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader user={initialUser} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Cargando...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader user={initialUser} />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.push("/cartplus")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Carrito
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Tu carrito está vacío</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Continuar Comprando
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getItemId = (item: any) => (isGuest ? item.product_id : item.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={initialUser} />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push("/cartplus")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Carrito
        </Button>

        {isGuest && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Estás comprando como invitado. Puedes{" "}
              <a href="/auth/login" className="underline font-medium">
                iniciar sesión
              </a>{" "}
              o{" "}
              <a href="/auth/sign-up" className="underline font-medium">
                crear una cuenta
              </a>{" "}
              para guardar tu historial de pedidos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items & Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos en tu Carrito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={getItemId(item)} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.product.image_url || "/placeholder.svg?height=80&width=80"}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.title}</h3>
                      <p className="text-lg font-semibold text-blue-600">${item.product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleUpdateQuantity(getItemId(item), item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleUpdateQuantity(getItemId(item), item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveItem(getItemId(item))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Information Form */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nombre Completo *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="juan@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Dirección *</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main Street, Apt 4B"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Miami"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="FL"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Código Postal *</Label>
                    <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33101" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Input id="country" value="United States" disabled className="bg-gray-50" />
                  <input type="hidden" name="country" value="US" />
                  <p className="text-xs text-gray-500">Actualmente solo enviamos a Estados Unidos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary & Payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={getItemId(item)} className="flex justify-between text-sm">
                      <span>
                        {item.product.title} x {item.quantity}
                      </span>
                      <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    onClick={handleTestOrder}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {processing ? "Procesando..." : "Realizar Pedido de Prueba"}
                  </Button>

                  <Button
                    onClick={handleStripeCheckout}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {processing ? "Procesando..." : "Pagar con Stripe"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  * El pedido de prueba crea una orden con estado "pending". El pago con Stripe procesa pagos reales y
                  actualiza el estado a "paid".
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

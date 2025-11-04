"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Minus, Plus, Trash2, CreditCard, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getCart, updateCartItemQuantity, removeFromCart } from "@/app/actions/cart"
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

  const handleStripeCheckout = async () => {
    console.log("[v0] handleStripeCheckout - Starting")
    setProcessing(true)

    try {
      const result = await createStripeCheckoutSession(
        isGuest,
        isGuest ? cartItems : undefined,
        initialUser?.email || null
      )

      console.log("[v0] handleStripeCheckout - Stripe session created:", result)

      if (result.url) {
        console.log("[v0] handleStripeCheckout - Redirecting to:", result.url)
        
        if (isGuest) {
          clearGuestCart()
        }
        setCartItems([])

        // Try multiple methods to ensure redirect works
        try {
          window.location.replace(result.url)
        } catch (e) {
          console.error("[v0] handleStripeCheckout - Replace failed, trying href:", e)
          window.location.href = result.url
        }
      } else {
        console.error("[v0] handleStripeCheckout - No URL in result:", result)
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

        <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 mb-2 text-lg">✓ Pago Rápido y Seguro</h3>
              <p className="text-sm text-green-800 mb-2">
                <strong>¡Haz clic en "Pagar con Stripe" para continuar!</strong> Stripe te pedirá tus datos de pago y dirección de envío de forma segura.
              </p>
              {isGuest && (
                <p className="text-xs text-green-700">
                  <em>Opcional:</em> Si quieres guardar tu historial de pedidos,{" "}
                  <a href="/auth/login" className="underline font-semibold hover:text-green-900">
                    inicia sesión
                  </a>{" "}
                  o{" "}
                  <a href="/auth/sign-up" className="underline font-semibold hover:text-green-900">
                    crea una cuenta
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>

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
                    onClick={handleStripeCheckout}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {processing ? "Procesando pago..." : "Pagar con Stripe"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Pago seguro procesado por Stripe. Tus datos están protegidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

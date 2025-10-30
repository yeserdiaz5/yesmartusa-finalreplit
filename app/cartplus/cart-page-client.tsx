"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCart, updateCartItemQuantity, removeFromCart, type CartItem } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types/database"
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart, type GuestCartItem } from "@/lib/guest-cart"

interface CartPageClientProps {
  user: User | null
}

export function CartPageClient({ user }: CartPageClientProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCart()

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (!user) {
        setGuestCartItems(getGuestCart())
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    return () => window.removeEventListener("cartUpdated", handleCartUpdate)
  }, [user])

  const loadCart = async () => {
    setLoading(true)

    if (user) {
      // Load from database for authenticated users
      const result = await getCart()
      if (result.success && result.data) {
        setCartItems(result.data)
      }
    } else {
      // Load from localStorage for guests
      setGuestCartItems(getGuestCart())
    }

    setLoading(false)
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (user) {
      // Update database cart
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
    } else {
      // Update guest cart
      updateGuestCartQuantity(itemId, newQuantity)
      setGuestCartItems(getGuestCart())
    }
  }

  const handleRemove = async (itemId: string) => {
    if (user) {
      // Remove from database cart
      const result = await removeFromCart(itemId)
      if (result.success) {
        toast({
          title: "Producto eliminado",
          description: "El producto se eliminó del carrito",
        })
        await loadCart()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el producto",
          variant: "destructive",
        })
      }
    } else {
      // Remove from guest cart
      removeFromGuestCart(itemId)
      setGuestCartItems(getGuestCart())
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó del carrito",
      })
    }
  }

  // Calculate totals based on user type
  const items = user ? cartItems : guestCartItems
  const subtotal = items.reduce((sum, item) => {
    const price = user ? (item as CartItem).product.price : (item as GuestCartItem).product.price
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal > 0 ? 10 : 0
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Cargando carrito...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowLeft className="h-5 w-5" />
        <span>Continue Shopping</span>
      </Link>

      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const product = user ? (item as CartItem).product : (item as GuestCartItem).product
                const itemId = user ? (item as CartItem).id : (item as GuestCartItem).product_id

                return (
                  <div key={itemId} className="bg-white rounded-lg shadow p-4">
                    <div className="flex gap-4">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{product.title}</h3>
                        <p className="text-lg font-bold text-gray-900 mb-2">${product.price}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-red-500 hover:text-red-700"
                            onClick={() => handleRemove(itemId)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Link href="/checkoutplus">
              <Button className="w-full" disabled={items.length === 0}>
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

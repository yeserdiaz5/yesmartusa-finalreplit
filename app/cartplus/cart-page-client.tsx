"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, Minus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCart, updateCartItemQuantity, removeFromCart, type CartItem } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types/database"
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart, type GuestCartItem } from "@/lib/guest-cart"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface CartPageClientProps {
  user: User | null
}

export function CartPageClient({ user }: CartPageClientProps) {
  const { t } = useLanguage()
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
        // Dispatch event to update cart count
        window.dispatchEvent(new Event("cartUpdated"))
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
        // Dispatch event to update cart count
        window.dispatchEvent(new Event("cartUpdated"))
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

  // Calculate totals based on user type and shipping policies
  const items = user ? cartItems : guestCartItems
  const subtotal = items.reduce((sum, item) => {
    const price = user ? (item as CartItem).product.price : (item as GuestCartItem).product.price
    return sum + price * item.quantity
  }, 0)
  
  // Calculate shipping based on each product's shipping policy
  const shipping = items.reduce((sum, item) => {
    const product = user ? (item as CartItem).product : (item as GuestCartItem).product
    const quantity = item.quantity
    const shippingPolicy = product.shipping_policy || 'buyer_pays' // Default to buyer pays
    const shippingCost = product.shipping_cost || 10 // Default $10 if not set
    
    if (shippingPolicy === 'seller_pays') {
      return sum + 0 // Seller pays, buyer pays nothing
    } else if (shippingPolicy === 'buyer_pays') {
      return sum + (shippingCost * quantity) // Buyer pays full cost per unit
    } else if (shippingPolicy === 'shared') {
      return sum + ((shippingCost / 2) * quantity) // Split 50/50 per unit
    }
    return sum + (shippingCost * quantity) // Default to buyer pays per unit
  }, 0)
  
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax
  
  // Helper function to get shipping info for display (per unit)
  const getShippingInfo = (product: CartItem['product'] | GuestCartItem['product']) => {
    const policy = product.shipping_policy || 'buyer_pays'
    const cost = product.shipping_cost || 10
    
    if (policy === 'seller_pays') {
      return { label: t("freeShipping"), badge: "seller_pays" }
    } else if (policy === 'buyer_pays') {
      return { label: `+$${cost.toFixed(2)} ${t("shipping").toLowerCase()}/unit`, badge: "buyer_pays" }
    } else if (policy === 'shared') {
      return { label: `+$${(cost / 2).toFixed(2)} ${t("sharedCost").toLowerCase()}/unit`, badge: "shared" }
    }
    return { label: `+$${cost.toFixed(2)} ${t("shipping").toLowerCase()}/unit`, badge: "buyer_pays" }
  }

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
                      <Link href={`/productdes/${product.id}`} className="shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.title}
                          className="w-24 h-24 object-cover rounded hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/productdes/${product.id}`}>
                          <h3 className="font-semibold mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-gray-900">${product.price}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {getShippingInfo(product).label}
                          </span>
                        </div>
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

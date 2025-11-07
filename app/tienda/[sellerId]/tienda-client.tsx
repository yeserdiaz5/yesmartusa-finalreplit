"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SiteHeader from "@/components/site-header"
import type { User, Product } from "@/lib/types/database"
import { Store, ShoppingCart, Star, MapPin, Package, Plus, Minus } from "lucide-react"
import { addToCart } from "@/app/actions/cart"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { addToGuestCart } from "@/lib/guest-cart"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface TiendaClientProps {
  seller: {
    id: string
    full_name: string | null
    store_name: string | null
    avatar_url: string | null
    email: string
    seller_address?: {
      full_name: string
      address_line1: string
      address_line2?: string
      city: string
      state: string
      postal_code: string
      country: string
    } | null
  }
  products: Product[]
  currentUser: User | null
}

function ProductCard({ product, userId }: { product: Product; userId: string | null }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { t } = useLanguage()
  
  // Generate consistent rating and reviews based on product id
  const rating = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    return 4 + (hash % 100) / 100
  }, [product.id])
  
  const reviews = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    return Math.floor((hash % 2000)) + 100
  }, [product.id])

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // For guests, use localStorage
    if (!userId) {
      addToGuestCart(
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          seller_id: product.seller_id,
        },
        quantity,
      )
      toast({
        title: t("productAdded"),
        description: `${quantity} ${t("productsAddedToCart")}`,
      })
      setQuantity(1)
      return
    }

    // For authenticated users, use database
    setIsAdding(true)
    const result = await addToCart(product.id, quantity)
    setIsAdding(false)

    if (result && result.success) {
      toast({
        title: t("productAdded"),
        description: `${quantity} ${t("productsAddedToCart")}`,
      })
      setQuantity(1)
      // Dispatch event to update cart count
      window.dispatchEvent(new Event("cartUpdated"))
    } else {
      toast({
        title: "Error",
        description: result?.error || t("couldNotAddToCart"),
        variant: "destructive",
      })
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // For guests, use localStorage
    if (!userId) {
      addToGuestCart(
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          seller_id: product.seller_id,
        },
        quantity,
      )
      router.push("/cartplus")
      return
    }

    // For authenticated users, use database
    setIsAdding(true)
    const result = await addToCart(product.id, quantity)
    setIsAdding(false)

    if (result && result.success) {
      // Dispatch event to update cart count
      window.dispatchEvent(new Event("cartUpdated"))
      router.push("/cartplus")
    } else {
      toast({
        title: "Error",
        description: result?.error || t("couldNotAddToCart"),
        variant: "destructive",
      })
    }
  }

  const increaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity < 10) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <Link href={`/productdes/${product.id}`}>
          <div className="relative mb-3 cursor-pointer">
            <img
              src={product.image_url || product.images?.[0] || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
        </Link>

        <Link href={`/productdes/${product.id}`}>
          <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">{product.title}</h3>
        </Link>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1">({reviews})</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={increaseQuantity}
            disabled={quantity >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock_quantity === 0}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdding ? t("adding") : t("addToCart")}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isAdding || product.stock_quantity === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            {isAdding ? t("processing") : t("buyNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TiendaClient({ seller, products, currentUser }: TiendaClientProps) {
  const { t } = useLanguage()
  const storeName = seller.store_name || seller.full_name || t("store")

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={currentUser} />
      
      {/* Store Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={storeName}
                width={120}
                height={120}
                className="rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                <Store className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{storeName}</h1>
              <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-3 text-white/90">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{products.length} {t("productsCount")}</span>
                </div>
                {seller.seller_address?.city && seller.seller_address?.state && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{seller.seller_address.city}, {seller.seller_address.state}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">{t("noProductsAvailable")}</h3>
              <p className="text-gray-600">{t("storeHasNoProducts")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t("availableProducts")}</h2>
              <p className="text-gray-600">{t("exploreCollection", { storeName })}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} userId={currentUser?.id || null} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

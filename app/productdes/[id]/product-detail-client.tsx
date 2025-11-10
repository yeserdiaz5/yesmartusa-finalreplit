"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Star, ShoppingCart, Plus, Minus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SiteHeader from "@/components/site-header"
import { addToCart } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { addToGuestCart } from "@/lib/guest-cart"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface ProductDetailClientProps {
  product: any
  user: User | null
  relatedVariants?: any[]
}

export default function ProductDetailClient({ product, user, relatedVariants = [] }: ProductDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedImage, setSelectedImage] = useState(product.image_url || "/placeholder.svg")

  // Generate consistent values based on product id
  const trustScore = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    return 75 + Math.floor((hash % 20))
  }, [product.id])
  
  const rating = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    return 4 + (hash % 100) / 100
  }, [product.id])
  
  const reviews = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    return Math.floor((hash % 2000)) + 100
  }, [product.id])

  const handleAddToCart = async () => {
    if (!user) {
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
      return
    }

    setIsAdding(true)
    const result = await addToCart(product.id, quantity)
    setIsAdding(false)

    if (result && result.success) {
      toast({
        title: t("productAdded"),
        description: `${quantity} ${t("productsAddedToCart")}`,
      })
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

  const handleBuyNow = async () => {
    if (!user) {
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

  const increaseQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const images =
    product.images && product.images.length > 0 ? product.images : [product.image_url || "/placeholder.svg"]

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToProducts")}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-[500px] object-contain rounded-lg"
                  data-testid="image-main-product"
                />
              </div>
              <div className="grid grid-cols-5 gap-3">
                {images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${
                      selectedImage === img ? "border-blue-600 shadow-md" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedImage(img)}
                    data-testid={`thumbnail-product-image-${idx}`}
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">({reviews} reviews)</span>
              </div>

              {product.product_tags && product.product_tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {product.product_tags.map((pt: any) => (
                    <Badge key={pt.tag.id} variant="secondary">
                      {pt.tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${product.price}</span>
              </div>

              {(product.brand || product.condition) && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    {product.brand && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t("productBrand")}</p>
                        <p className="text-base font-semibold text-gray-900" data-testid="text-product-brand">{product.brand}</p>
                      </div>
                    )}
                    {product.condition && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t("productCondition")}</p>
                        <p className="text-base font-semibold text-gray-900" data-testid="text-product-condition">
                          {product.condition === "new" && t("productConditionNew")}
                          {product.condition === "like_new" && t("productConditionLikeNew")}
                          {product.condition === "used" && t("productConditionUsed")}
                          {product.condition === "refurbished" && t("productConditionRefurbished")}
                          {product.condition === "open_box" && t("productConditionOpenBox")}
                          {product.condition === "for_parts" && t("productConditionForParts")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {relatedVariants.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">{t("availableVariants") || "Available Variants"}:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {relatedVariants.map((variant) => (
                      <Link
                        key={variant.id}
                        href={`/productdes/${variant.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                        data-testid={`link-variant-${variant.id}`}
                      >
                        <div className="aspect-square mb-2 overflow-hidden rounded">
                          <img
                            src={variant.image_url || variant.images?.[0] || "/placeholder.svg"}
                            alt={variant.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{variant.title}</p>
                        <p className="text-sm font-semibold text-blue-600">${variant.price}</p>
                        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).slice(0, 2).map(([key, value]) => (
                              <span key={key} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                  {t("productDescription")}
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">{product.description || t("highQualityProduct")}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium mb-2">{t("quantity")}</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={decreaseQuantity} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={increaseQuantity} disabled={quantity >= 10}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-6 text-lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isAdding ? t("adding") : t("addToCart")}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isAdding}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6 text-lg"
                >
                  {isAdding ? t("processing") : t("buyNow")}
                </Button>
              </div>

              {product.stock_quantity > 0 ? (
                <p className="text-sm text-green-600 mt-4">{t("inStock")} ({product.stock_quantity} {t("available")})</p>
              ) : (
                <p className="text-sm text-red-600 mt-4">{t("outOfStock")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Star, Search, ShoppingCart, Plus, Minus, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { addToCart } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import { addToGuestCart } from "@/lib/guest-cart"
import { useBuyerLocation } from "@/hooks/use-buyer-location"
import { calculateDistance, getDeliveryTimeMessage, geocodeAddress } from "@/lib/geolocation"

interface BuyerHomepageClientProps {
  user: User | null
  products: any[]
  categories: any[]
}

interface SellerLocationProps {
  seller: any
  buyerLocation: { latitude: number; longitude: number } | null
}

function SellerLocationInfo({ seller, buyerLocation }: SellerLocationProps) {
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null)

  // Always show seller location immediately if available
  const locationStr =
    seller?.seller_address?.city && seller?.seller_address?.state
      ? `${seller.seller_address.city}, ${seller.seller_address?.state}`
      : null

  useEffect(() => {
    // Only calculate delivery time if we have both buyer location and seller address
    if (!buyerLocation || !seller?.seller_address?.city || !seller?.seller_address?.state) {
      setDeliveryTime(null)
      return
    }

    async function calculateDeliveryTime() {
      try {
        const sellerCoords = await geocodeAddress(seller.seller_address.city, seller.seller_address.state)

        if (sellerCoords) {
          const distance = calculateDistance(
            buyerLocation.latitude,
            buyerLocation.longitude,
            sellerCoords.lat,
            sellerCoords.lng,
          )
          const deliveryTimeMsg = getDeliveryTimeMessage(distance)
          setDeliveryTime(deliveryTimeMsg)
        }
      } catch (error) {
        console.error("Error calculating delivery time:", error)
        setDeliveryTime(null)
      }
    }

    calculateDeliveryTime()
  }, [seller, buyerLocation])

  // Don't render if no location available
  if (!locationStr) {
    return null
  }

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1 text-gray-600">
        <MapPin className="w-3 h-3" />
        <span>{locationStr}</span>
      </div>
      {deliveryTime && (
        <div className="flex items-center gap-1 text-green-600 font-medium">
          <Clock className="w-3 h-3" />
          <span>{deliveryTime}</span>
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  userId,
  buyerLocation,
}: { product: any; userId: string | null; buyerLocation: { latitude: number; longitude: number } | null }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const rating = 4 + Math.random()
  const reviews = Math.floor(Math.random() * 2000) + 100

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
        title: "Producto agregado",
        description: `${quantity} producto(s) agregado(s) al carrito`,
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
        title: "Producto agregado",
        description: `${quantity} producto(s) agregado(s) al carrito`,
      })
      setQuantity(1)
    } else {
      toast({
        title: "Error",
        description: result?.error || "No se pudo agregar el producto al carrito",
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
      router.push("/cartplus")
    } else {
      toast({
        title: "Error",
        description: result?.error || "No se pudo agregar el producto al carrito",
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
              src={product.image_url || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-48 object-cover rounded-md"
            />
            {product.product_tags && product.product_tags.length > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">{product.product_tags[0].tag.name}</Badge>
            )}
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

        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          <Link
            href={`/tienda/${product.seller?.id}`}
            className="text-blue-600 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {product.seller?.store_name || product.seller?.full_name || "Tienda"}
          </Link>
        </div>

        <div className="mb-3">
          <SellerLocationInfo seller={product.seller} buyerLocation={buyerLocation} />
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
            disabled={isAdding}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdding ? "Agregando..." : "Agregar al Carrito"}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isAdding}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            {isAdding ? "Procesando..." : "Comprar Ahora"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BuyerHomepageClient({ user, products, categories }: BuyerHomepageClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 200])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { location: buyerLocation } = useBuyerLocation()

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categorySlug])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== categorySlug))
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase()
        const titleMatch = product.title.toLowerCase().includes(query)
        const descriptionMatch = product.description?.toLowerCase().includes(query)
        if (!titleMatch && !descriptionMatch) {
          return false
        }
      }

      if (selectedCategories.length > 0) {
        const productCategories = product.product_categories?.map((pc: any) => pc.category.slug) || []
        if (!selectedCategories.some((cat) => productCategories.includes(cat))) {
          return false
        }
      }

      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategories, priceRange])

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside
            className={`w-64 bg-white rounded-lg p-6 h-fit sticky top-24 ${sidebarOpen ? "block" : "hidden md:block"}`}
          >
            <h3 className="font-semibold mb-4">Filters</h3>

            <div className="mb-6">
              <h4 className="font-medium mb-3">Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.slug}
                      checked={selectedCategories.includes(category.slug)}
                      onCheckedChange={(checked) => handleCategoryChange(category.slug, checked as boolean)}
                    />
                    <label htmlFor={category.slug} className="text-sm cursor-pointer">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-3">Price Range</h4>
              <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="mb-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-3">Seller Rating</h4>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox id={`rating-${rating}`} />
                    <label htmlFor={`rating-${rating}`} className="flex items-center text-sm cursor-pointer">
                      <div className="flex">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-1">& up</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setSearchQuery(e.currentTarget.value)
                      }
                    }}
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-md transition-colors"
                    onClick={() => setSearchQuery(searchQuery)}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
                {searchQuery && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Resultados de búsqueda para: <span className="font-semibold">"{searchQuery}"</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 text-blue-600"
                        onClick={() => setSearchQuery("")}
                      >
                        Limpiar búsqueda
                      </Button>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* results header removed (count + sort selector) */}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userId={user?.id || null}
                    buyerLocation={buyerLocation}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found matching your filters.</p>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline" className="px-8 bg-transparent">
                  Load More Products
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

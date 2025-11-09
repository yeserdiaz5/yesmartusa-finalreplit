"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Star, Search, ShoppingCart, Plus, Minus, MapPin, Clock, Image as ImageIcon, X, Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import SiteHeader from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { addToCart } from "@/app/actions/cart"
import { useToast } from "@/hooks/use-toast"
import { addToGuestCart } from "@/lib/guest-cart"
import { useBuyerLocation } from "@/hooks/use-buyer-location"
import { calculateDistance, getDeliveryTimeMessage, geocodeAddress } from "@/lib/geolocation"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { CameraCapture } from "@/components/camera-capture"

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
  onFindSimilar,
}: { 
  product: any
  userId: string | null
  buyerLocation: { latitude: number; longitude: number } | null
  onFindSimilar: (productImageUrl: string, productTitle: string) => void
}) {
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
            {product.seller?.store_name || product.seller?.full_name || t("store")}
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
            {isAdding ? t("adding") : t("addToCart")}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isAdding}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            {isAdding ? t("processing") : t("buyNow")}
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
  const [imageSearchOpen, setImageSearchOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageSearching, setImageSearching] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([])
  const [isImageSearch, setIsImageSearch] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const { toast } = useToast()
  const { location: buyerLocation } = useBuyerLocation()
  const { t } = useLanguage()

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageSearch = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: t("noImageSelected"),
        variant: "destructive",
      })
      return
    }

    setImageSearching(true)
    
    try {
      // Use vector-based image search for more accurate results
      const response = await fetch("/api/search-by-image-vector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const productCount = data.products?.length || 0
        
        setImageSearchResults(data.products || [])
        setIsImageSearch(true)
        setSearchQuery("") // Clear text search
        setImageSearchOpen(false)
        
        if (productCount === 0) {
          toast({
            title: t("imageSearchResults"),
            description: t("noSimilarProducts"),
          })
        } else {
          toast({
            title: t("imageSearchResults"),
            description: t("foundSimilarProducts", { 
              count: productCount, 
              plural: productCount > 1 ? 's' : '' 
            }),
          })
        }
      } else {
        // Keep modal open on error
        toast({
          title: "Error",
          description: data.error || t("imageSearchFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Image search error:", error)
      // Keep modal open on error
      toast({
        title: "Error",
        description: t("imageSearchFailedRetry"),
        variant: "destructive",
      })
    } finally {
      setImageSearching(false)
    }
  }

  const clearImageSearch = () => {
    setIsImageSearch(false)
    setImageSearchResults([])
    setSelectedImage(null)
  }

  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl)
    setShowCamera(false)
    setImageSearchOpen(true)
  }

  const handleOpenCamera = () => {
    setImageSearchOpen(false)
    setShowCamera(true)
  }

  const handleFindSimilar = async (productImageUrl: string, productTitle: string) => {
    if (!productImageUrl) {
      toast({
        title: "Error",
        description: t("noImageAvailable") || "No image available for this product",
        variant: "destructive",
      })
      return
    }

    setImageSearching(true)
    
    try {
      // Fetch the image and convert to base64
      const response = await fetch(productImageUrl)
      const blob = await response.blob()
      
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result as string
        
        try {
          // Use vector-based image search for more accurate results
          const searchResponse = await fetch("/api/search-by-image-vector", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }),
          })

          const data = await searchResponse.json()

          if (searchResponse.ok && data.success) {
            const productCount = data.products?.length || 0
            
            setImageSearchResults(data.products || [])
            setIsImageSearch(true)
            setSearchQuery("")
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" })
            
            if (productCount === 0) {
              toast({
                title: t("imageSearchResults"),
                description: t("noSimilarProducts"),
              })
            } else {
              toast({
                title: t("foundSimilarProducts") || `Found ${productCount} similar products`,
                description: t("similarTo") || `Similar to: ${productTitle}`,
              })
            }
          } else {
            toast({
              title: "Error",
              description: data.error || t("imageSearchFailed"),
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Image search error:", error)
          toast({
            title: "Error",
            description: t("imageSearchFailedRetry"),
            variant: "destructive",
          })
        } finally {
          setImageSearching(false)
        }
      }
      
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error("Error loading product image:", error)
      setImageSearching(false)
      toast({
        title: "Error",
        description: t("couldNotLoadImage") || "Could not load product image",
        variant: "destructive",
      })
    }
  }

  const filteredProducts = useMemo(() => {
    // If image search is active, use image search results
    if (isImageSearch) {
      return imageSearchResults
    }
    
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
  }, [products, searchQuery, selectedCategories, priceRange, isImageSearch, imageSearchResults])

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
            {/* Amazon-style Search Bar */}
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-md p-2 mb-4">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("searchProducts")}
                      className="w-full pl-12 pr-4 py-4 text-base rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-gray-900 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          setSearchQuery(e.currentTarget.value)
                        }
                      }}
                      disabled={isImageSearch}
                      data-testid="input-search-products"
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    className="bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    onClick={() => setSearchQuery(searchQuery)}
                    disabled={isImageSearch}
                    data-testid="button-search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Results Info */}
                {searchQuery && !isImageSearch && (
                  <div className="mt-3 px-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        {filteredProducts.length} {t("results")} {t("for")} <span className="font-semibold text-gray-900">"{searchQuery}"</span>
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => setSearchQuery("")}
                        data-testid="button-clear-search"
                      >
                        {t("clearSearch")}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Image Search Results Info */}
                {isImageSearch && (
                  <div className="mt-3 px-2">
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-900 font-medium">
                          {t("imageSearchActive")} - <span className="font-bold">{imageSearchResults.length}</span> {t("similarProducts")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                        onClick={clearImageSearch}
                        data-testid="button-clear-image-search"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t("clearSearch")}
                      </Button>
                    </div>
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
                    onFindSimilar={handleFindSimilar}
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

      {/* Image Search Modal - Enhanced with Drag & Drop */}
      <Dialog open={imageSearchOpen} onOpenChange={setImageSearchOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="dialog-image-search">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              {t("searchByImage")}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t("uploadImageToSearch")} - {t("findSimilarProducts") || "Find similar products instantly"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Drop Zone */}
            <div 
              className={`border-4 border-dashed rounded-2xl p-12 text-center transition-all ${
                selectedImage 
                  ? "border-green-300 bg-green-50/30" 
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("border-blue-500", "bg-blue-100/50")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-blue-500", "bg-blue-100/50")
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("border-blue-500", "bg-blue-100/50")
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith("image/")) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const result = e.target?.result
                    if (typeof result === "string") {
                      setSelectedImage(result)
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            >
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="max-h-96 mx-auto rounded-xl shadow-lg border-4 border-white"
                    data-testid="img-selected-preview"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 shadow-lg"
                    onClick={() => setSelectedImage(null)}
                    data-testid="button-remove-image"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t("remove") || "Remove"}
                  </Button>
                  <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">
                      {t("imageReady") || "Image ready to search!"} - {t("clickSearchBelow") || "Click search below"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera Option - Primary */}
                  <Button
                    onClick={handleOpenCamera}
                    className="w-full h-32 bg-gradient-to-br from-black to-gray-800 hover:from-gray-900 hover:to-black text-white flex flex-col items-center justify-center gap-3 rounded-2xl shadow-xl"
                    data-testid="button-open-camera"
                  >
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center">
                      <Camera className="w-9 h-9 text-black" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">Usar Cámara</p>
                      <p className="text-sm opacity-90">Escanea productos en tiempo real</p>
                    </div>
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">o</span>
                    </div>
                  </div>

                  {/* Upload Option - Secondary */}
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <div className="border-2 border-gray-300 hover:border-blue-400 rounded-2xl p-8 text-center transition-all hover:bg-blue-50/30">
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Upload className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("dragImageHere") || "Subir desde dispositivo"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {t("orClickToUpload") || "Arrastra una imagen o haz clic aquí"}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          JPG
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          PNG
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          WEBP
                        </Badge>
                      </div>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      data-testid="input-image-upload"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={() => {
                  setImageSearchOpen(false)
                  setSelectedImage(null)
                }}
                data-testid="button-cancel-image-search"
              >
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={handleImageSearch}
                disabled={!selectedImage || imageSearching}
                data-testid="button-search-by-image"
              >
                {imageSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("searching")}...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    {t("search")}
                  </>
                )}
              </Button>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("howItWorks") || "How it works"}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. {t("uploadProductImage") || "Upload a photo of any product"}</li>
                <li>2. {t("aiAnalyzesImage") || "Our AI analyzes the image to identify the product"}</li>
                <li>3. {t("showSimilarProducts") || "We show you similar products from our marketplace"}</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Capture - Full Screen */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}

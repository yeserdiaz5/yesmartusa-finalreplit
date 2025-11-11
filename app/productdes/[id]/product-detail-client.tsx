"use client"

import { useState } from "react"
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

interface ProductDetailClientProps {
  product: any
  user: User | null
}

export default function ProductDetailClient({ product, user }: ProductDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedImage, setSelectedImage] = useState(product.image_url || "/placeholder.svg")

  const trustScore = 75 + Math.floor(Math.random() * 20)
  const rating = 4 + Math.random()
  const reviews = Math.floor(Math.random() * 2000) + 100

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
        title: "Producto agregado",
        description: `${quantity} producto(s) agregado(s) al carrito`,
      })
      return
    }

    setIsAdding(true)
    const result = await addToCart(product.id, quantity)
    setIsAdding(false)

    if (result && result.success) {
      toast({
        title: "Producto agregado",
        description: `${quantity} producto(s) agregado(s) al carrito`,
      })
    } else {
      toast({
        title: "Error",
        description: result?.error || "No se pudo agregar el producto al carrito",
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
      router.push("/cartplus")
    } else {
      toast({
        title: "Error",
        description: result?.error || "No se pudo agregar el producto al carrito",
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
            Volver a productos
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img || "/placeholder.svg"}
                      alt={`${product.title} ${idx + 1}`}
                      className={`w-full h-20 object-cover rounded cursor-pointer border-2 ${
                        selectedImage === img ? "border-blue-500" : "border-gray-200"
                      }`}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              )}
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

              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Cantidad:</p>
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
                  {isAdding ? "Agregando..." : "Agregar al Carrito"}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isAdding}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6 text-lg"
                >
                  {isAdding ? "Procesando..." : "Comprar Ahora"}
                </Button>
              </div>

              {product.stock_quantity > 0 ? (
                <p className="text-sm text-green-600 mt-4">En stock ({product.stock_quantity} disponibles)</p>
              ) : (
                <p className="text-sm text-red-600 mt-4">Agotado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

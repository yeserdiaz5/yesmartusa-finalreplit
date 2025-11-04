"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SiteHeader from "@/components/site-header"
import type { User, Product } from "@/lib/types/database"
import { Store, ShoppingCart, Star, MapPin, Package } from "lucide-react"
import { addToCart } from "@/app/actions/cart"
import { toast } from "sonner"

interface TiendaClientProps {
  seller: {
    id: string
    full_name: string | null
    store_name: string | null
    avatar_url: string | null
    email: string
  }
  products: Product[]
  currentUser: User | null
}

export default function TiendaClient({ seller, products, currentUser }: TiendaClientProps) {
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const handleAddToCart = async (productId: string) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para agregar al carrito")
      return
    }

    setAddingToCart(productId)
    try {
      const result = await addToCart(productId, 1)
      if (result.success) {
        toast.success("Producto agregado al carrito")
      } else {
        toast.error(result.error || "Error al agregar al carrito")
      }
    } catch (error) {
      toast.error("Error al agregar al carrito")
    } finally {
      setAddingToCart(null)
    }
  }

  const storeName = seller.store_name || seller.full_name || "Tienda"

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
              <div className="flex items-center justify-center md:justify-start gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{products.length} productos</span>
                </div>
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
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-gray-600">Esta tienda aún no tiene productos publicados</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Productos Disponibles</h2>
              <p className="text-gray-600">Explora la colección de {storeName}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <Link href={`/productdes/${product.id}`}>
                      {product.image_url || product.images?.[0] ? (
                        <Image
                          src={product.image_url || product.images![0]}
                          alt={product.title}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </Link>
                  </CardHeader>
                  <CardContent className="flex-1 p-4">
                    <Link href={`/productdes/${product.id}`}>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.stock_quantity > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          En stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Agotado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock_quantity === 0 || addingToCart === product.id}
                    >
                      {addingToCart === product.id ? (
                        <>Agregando...</>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Agregar al Carrito
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

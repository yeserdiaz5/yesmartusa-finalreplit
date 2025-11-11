"use client"

import { useState } from "react"
import { ArrowLeft, Star, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { testShippingRates } from "@/app/actions/shipengine"
import { useToast } from "@/hooks/use-toast"

interface ProductDetailClientProps {
  product: any
  user: User | null
}

function TrustBadge({ score }: { score: number }) {
  const getScoreData = (score: number) => {
    if (score >= 90)
      return {
        color: "bg-emerald-50 border-emerald-200 text-emerald-800",
        icon: "🛡️",
        label: "Excellent",
        barColor: "bg-emerald-500",
      }
    if (score >= 80)
      return {
        color: "bg-blue-50 border-blue-200 text-blue-800",
        icon: "✅",
        label: "Very Good",
        barColor: "bg-blue-500",
      }
    if (score >= 70)
      return {
        color: "bg-amber-50 border-amber-200 text-amber-800",
        icon: "⚠️",
        label: "Good",
        barColor: "bg-amber-500",
      }
    return {
      color: "bg-red-50 border-red-200 text-red-800",
      icon: "❌",
      label: "Poor",
      barColor: "bg-red-500",
    }
  }

  const scoreData = getScoreData(score)

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${scoreData.color}`}>
      <span className="text-lg">{scoreData.icon}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trust Score</span>
          <span className="text-lg font-bold">{score}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreData.barColor} transition-all duration-300`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs opacity-75">{scoreData.label}</span>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailClient({ product, user }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [testingRates, setTestingRates] = useState(false)
  const [testRates, setTestRates] = useState<any[]>([])
  const { toast } = useToast()

  const images = product.images || [product.image_url]
  const trustScore = 75 + Math.floor(Math.random() * 20)
  const rating = 4 + Math.random()
  const reviews = Math.floor(Math.random() * 2000) + 100

  const handleTestShippingRates = async () => {
    setTestingRates(true)
    setTestRates([])

    console.log("[v0] 🧪 Testing shipping rates with exact same data as working test label...")

    try {
      const result = await testShippingRates()

      console.log("[v0] 🧪 Test rates result:", result)

      if (result.success) {
        setTestRates(result.rates || [])
        toast({
          title: "Éxito!",
          description: result.message || `Se encontraron ${result.rates?.length || 0} tarifas de envío`,
        })

        console.log("[v0] ✅ Test rates retrieved successfully!")
        console.log("[v0] ✅ Number of rates:", result.rates?.length)
        if (result.rates && result.rates.length > 0) {
          console.log("[v0] ✅ Rates details:")
          result.rates.forEach((rate: any, index: number) => {
            console.log(`[v0] ✅ Rate ${index + 1}:`, {
              carrier: rate.carrier_friendly_name,
              service: rate.service_type,
              price: rate.shipping_amount?.amount,
              days: rate.delivery_days,
            })
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron obtener las tarifas",
          variant: "destructive",
        })

        console.error("[v0] ❌ Test rates failed:", result.error)
        if (result.errorDetails) {
          console.error("[v0] ❌ Error details:", JSON.stringify(result.errorDetails, null, 2))

          if (result.errorDetails.errors && Array.isArray(result.errorDetails.errors)) {
            console.error("[v0] ❌ Individual errors:")
            result.errorDetails.errors.forEach((err: any, index: number) => {
              console.error(`[v0] ❌ Error ${index + 1}:`, {
                code: err.error_code,
                message: err.message,
                field: err.field_name,
                type: err.error_type,
              })
            })
          }
        }
      }
    } catch (error: any) {
      console.error("[v0] ❌ Exception testing rates:", error)
      toast({
        title: "Error",
        description: error.message || "Error al probar las tarifas",
        variant: "destructive",
      })
    } finally {
      setTestingRates(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Test Shipping Rates Button */}
        <div className="mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Prueba de Tarifas de Envío</h3>
                  <p className="text-sm text-blue-700">
                    Usa los mismos datos exactos que funcionaron en la etiqueta de prueba
                  </p>
                </div>
                <Button
                  onClick={handleTestShippingRates}
                  disabled={testingRates}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {testingRates ? "Probando..." : "Probar Tarifas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Display Test Rates if Available */}
        {testRates.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Tarifas de Envío Encontradas ({testRates.length})</h3>
                <div className="space-y-2">
                  {testRates.map((rate: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{rate.carrier_friendly_name}</div>
                        <div className="text-sm text-gray-600">{rate.service_type}</div>
                        {rate.delivery_days && (
                          <div className="text-xs text-gray-500">{rate.delivery_days} días de entrega</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${rate.shipping_amount?.amount?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{rate.shipping_amount?.currency?.toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg p-4">
              <img
                src={images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-md p-2 border-2 ${
                      selectedImage === index ? "border-blue-500" : "border-gray-200"
                    }`}
                  >
                    <img src={image || "/placeholder.svg"} alt="" className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating.toFixed(1)} ({reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Score */}
            <div className="mb-6">
              <TrustBadge score={trustScore} />
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-red-600">${product.price}</span>
              {product.stock_quantity > 0 ? (
                <Badge className="bg-green-500 text-white">En Stock</Badge>
              ) : (
                <Badge className="bg-red-500 text-white">Agotado</Badge>
              )}
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Vendido por {product.seller?.full_name || product.seller?.email || "Vendedor"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import {
  Plus,
  TrendingUp,
  Package,
  Star,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  Settings,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SellerDashboardClientProps {
  user: User
  products: any[]
  orders: any[] // Added orders prop
}

function TrustScoreDisplay({ score }: { score: number }) {
  const getScoreData = (score: number) => {
    if (score >= 90)
      return {
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        icon: "🛡️",
      }
    if (score >= 80)
      return {
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "✅",
      }
    if (score >= 70)
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        icon: "⚠️",
      }
    return {
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "❌",
    }
  }

  const scoreData = getScoreData(score)

  return (
    <div className={`text-center p-4 rounded-xl ${scoreData.bgColor}`}>
      <div className="text-2xl mb-2">{scoreData.icon}</div>
      <div className={`text-4xl font-bold ${scoreData.color} mb-1`}>{score}</div>
      <div className="text-sm text-gray-600 mb-3">Trust Score</div>
      <Progress value={score} className="h-2" />
    </div>
  )
}

export default function SellerDashboardClient({ user, products, orders }: SellerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isTestingLabel, setIsTestingLabel] = useState(false)
  const router = useRouter()

  const activeListings = products.filter((p) => p.is_active).length
  const totalListings = products.length
  const trustScore = 85 // Mock for now

  const monthlyRevenue = orders.reduce((sum, order) => {
    const orderTotal = order.items.reduce((itemSum: number, item: any) => {
      return itemSum + item.price_at_purchase * item.quantity
    }, 0)
    return sum + orderTotal
  }, 0)

  const totalSales = orders.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "paid":
        return "Pagado"
      case "shipped":
        return "Enviado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const handleTestLabel = async () => {
    setIsTestingLabel(true)
    try {
      const { createTestLabel } = await import("@/app/actions/shipengine")
      const result = await createTestLabel()

      console.log("[v0] Test label result:", JSON.stringify(result, null, 2))

      if (result.success && result.label?.label_download?.pdf) {
        window.open(result.label.label_download.pdf, "_blank")
        alert("Etiqueta de prueba creada exitosamente! Se abrirá en una nueva pestaña.")
      } else {
        if (result.errorDetails?.errors) {
          console.error("[v0] ShipEngine errors array:", result.errorDetails.errors)
          result.errorDetails.errors.forEach((err: any, index: number) => {
            console.error(`[v0] Error ${index + 1}:`, JSON.stringify(err, null, 2))
          })
        }
        alert(`Error: ${result.error || "No se pudo crear la etiqueta de prueba"}`)
        console.error("[v0] Test label error:", result)
      }
    } catch (error) {
      console.error("[v0] Error creating test label:", error)
      alert("Error al crear la etiqueta de prueba. Revisa los logs del servidor.")
    } finally {
      setIsTestingLabel(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader user={user} showSearch={false} />

      {/* Secondary header for dashboard title */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Seller Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.full_name || user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestLabel} disabled={isTestingLabel}>
                <FileText className="w-4 h-4 mr-2" />
                {isTestingLabel ? "Creando..." : "Etiqueta de Prueba"}
              </Button>
              <Link href="/seller/settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </Link>
              <Link href="/seller/products/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Trust Score Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrustScoreDisplay score={trustScore} />
                </CardContent>
              </Card>

              {/* Revenue Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% from last month
                  </div>
                </CardContent>
              </Card>

              {/* Total Sales Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">All time</div>
                </CardContent>
              </Card>

              {/* Active Listings Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeListings}</div>
                  <div className="text-sm text-gray-600">of {totalListings} total</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Pedido #{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(order.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                        <div className="font-bold text-green-600">
                          $
                          {order.items
                            .reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trust Score Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Trust Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Product Quality</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Shipping Speed</span>
                        <span>88%</span>
                      </div>
                      <Progress value={88} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Customer Service</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Description Accuracy</span>
                        <span>90%</span>
                      </div>
                      <Progress value={90} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Product Listings</h2>
              <div className="flex gap-2">
                <select className="border rounded-md px-3 py-2 text-sm">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <Link href="/seller/products/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => {
                  const trustScore = 75 + Math.floor(Math.random() * 20)
                  const views = Math.floor(Math.random() * 2000)
                  const sales = Math.floor(Math.random() * 200)

                  return (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{product.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>${product.price}</span>
                              <span>Stock: {product.stock_quantity}</span>
                              <Badge
                                className={
                                  product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }
                              >
                                {product.is_active ? "active" : "inactive"}
                              </Badge>
                              {product.product_categories && product.product_categories.length > 0 && (
                                <span className="text-xs text-blue-600">
                                  {product.product_categories[0].category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Trust Score</div>
                            <div className="font-bold">{trustScore}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Views</div>
                            <div className="font-bold">{views}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Sales</div>
                            <div className="font-bold">{sales}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Link href={`/seller/products/${product.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">Start selling by adding your first product</p>
                  <Link href="/seller/products/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trust Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-16 h-16 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Review management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

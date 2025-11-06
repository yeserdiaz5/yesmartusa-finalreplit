"use client"

import {
  Plus,
  Package,
  Eye,
  Edit,
  Trash2,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import type { User } from "@/lib/types/database"
import Link from "next/link"

interface SellerDashboardClientProps {
  user: User
  products: any[]
  orders: any[]
}

export default function SellerDashboardClient({ user, products }: SellerDashboardClientProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SiteHeader user={user} />

      {/* Secondary header for dashboard title */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Product Listings</h1>
              <p className="text-gray-600">Manage your products</p>
            </div>
            <div className="flex gap-2">
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
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
                      <Link href={`/productdes/${product.id}`} className="shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/productdes/${product.id}`}>
                          <h3 className="font-medium hover:text-blue-600 transition-colors cursor-pointer">{product.title}</h3>
                        </Link>
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
      </div>
    </div>
  )
}
